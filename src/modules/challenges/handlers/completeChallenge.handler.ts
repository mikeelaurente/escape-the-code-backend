import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { getNextSectionFor } from '../../../db/repositories/story.repository';
import { generateFeedback } from '../../../feedback';
import { updateUserBalance } from '../../../db/repositories/user.repository';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { onChallengeCompleted } from '../../../services/achievements.service';

export const completeChallengeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    dayjs.extend(utc);
    const challengeId = parseInt(req.params.id || '');
    const userId = Number(req.user?.id);

    const response = await db.transaction(async (tx) => {
      const challenge = await tx.query.challenges.findFirst({
        where: eq(schema.challenges.id, challengeId),
        with: {
          answers: {
            where: and(
              eq(schema.challengeAnswers.userId, userId),
              eq(
                schema.challengeAnswers.status,
                schema.ChallengeStatus.Ongoing,
              ),
            ),
            with: {
              submissions: {
                where: eq(schema.challengeAnswerSubmissions.result, 'passed'),
              },
            },
          },
        },
      });

      if (!challenge) {
        return {
          status: 'error',
          message: 'Challenge not found',
        };
      }

      const activeAnswer = challenge.answers[0];
      if (!activeAnswer) {
        return {
          status: 'error',
          message: 'Challenge not started',
        };
      }

      const successfulSubmission = activeAnswer.submissions[0];
      if (!successfulSubmission) {
        return {
          status: 'error',
          message: 'You have not solved this challenge yet.',
        };
      }

      let nextSection = null;
      let feedback = null;

      const challengeWithDetails = await tx.query.challenges.findFirst({
        where: eq(schema.challenges.id, challengeId),
        with: {
          section: {
            with: {
              chapter: {
                with: {
                  course: true,
                },
              },
            },
          },
        },
      });
      // check if already inserted to story progress
      const inserted = await tx.query.courseProgress.findFirst({
        where: and(
          eq(schema.courseProgress.userId, userId),
          eq(
            schema.courseProgress.sectionId,
            Number(challengeWithDetails?.sectionID),
          ),
        ),
      });
      if (!inserted) {
        await tx.insert(schema.courseProgress).values({
          courseId: challengeWithDetails?.section?.chapter?.courseId,
          chapterId: challengeWithDetails?.section?.chapterId,
          sectionId: challengeWithDetails?.sectionID,
          userId,
        });
      }

      await tx
        .update(schema.challengeAnswers)
        .set({
          completedAt: new Date(),
          status: schema.ChallengeStatus.Completed,
          rewardPoints: challenge.rewardPoints,
          creditPoints: challenge.creditPoints,
        })
        .where(eq(schema.challengeAnswers.id, activeAnswer.id));

      await tx.insert(schema.creditTransactions).values({
        amount: Number(challenge.creditPoints),
        title: 'Reward: ' + challenge.title,
        type: 'in',
        group: 'reward',
        referenceId: activeAnswer.id,
        userId: userId,
      });

      await updateUserBalance(userId, tx);

      try {
        feedback = await generateFeedback(`
CHALLENGE GIVEN: """
${challenge.description}
"""
DIFFICULTY: ${challenge.difficulty}
USER CODE: """
${successfulSubmission.code}
"""
USER CODE RESULT: """
${successfulSubmission.codeOutput}
"""
Respond in HTML only (wrapped in div, no markdown syntax):
<div>
    <div>
          <h2>Code Review</h2>
          <div>{ CODE_REVIEW_HERE }</div>
    </div>
    <div>
          <h2>Code Improvements</h2>
          <div>{ CODE_IMPROVEMENTS_HERE }</div>
    </div>
</div>
Important Rules:
- make sure to use the given task as context when giving a feedback or code review.
- the input data is a variable named 'input'.
- to display the output, console.log will be used.
- for code review - check if the user has followed the given task. Also, validate if some tricks were used to bypass the correct procedure.
- for code improvements - if the user did not follow the given task, provide an explanation on how it could be done.
- use <br/> for line breaks
- wrap code in <pre> tag
        `);
      } catch (e) {
        console.log(e);
        feedback = 'No feedback.';
      }

      nextSection = await getNextSectionFor(userId, tx);

      await tx
        .update(schema.challengeAnswers)
        .set({
          feedback: feedback,
        })
        .where(eq(schema.challengeAnswers.id, activeAnswer.id));

      const updatedAnswer = await tx.query.challengeAnswers.findFirst({
        where: eq(schema.challengeAnswers.id, activeAnswer.id),
        extras: {
          duration: sql`TIMESTAMPDIFF(SECOND, created_at, completed_at)`.as(
            'duration',
          ),
        },
      });

      await tx.insert(schema.creditTransactions).values({
        amount: Number(updatedAnswer?.creditPoints),
        title: 'Reward: ' + challenge.title,
        type: 'in',
        group: 'reward',
        userId: userId,
      });

      await updateUserBalance(userId, tx);

      let challengeStatus = 'none';
      switch (updatedAnswer?.status) {
        case schema.ChallengeStatus.Completed:
          challengeStatus = 'completed';
          break;
        case schema.ChallengeStatus.Ongoing:
          challengeStatus = 'ongoing';
          break;
      }

      return {
        status: 'ok',
        data: {
          nextSection,
          answer: {
            id: updatedAnswer?.id,
            submission: successfulSubmission,
            feedback: updatedAnswer?.feedback,
            startedAt: updatedAnswer?.createdAt,
            completedAt: updatedAnswer?.completedAt,
            duration: updatedAnswer?.duration,
            status: challengeStatus,
          },
        },
      };
    });

    let achievements: (typeof schema.achievements.$inferSelect)[] = [];
    if (response.status === 'ok' && response?.data?.nextSection) {
      const answerId = response.data.answer.id;
      if (answerId) {
        const awardedAchievements = await onChallengeCompleted(answerId);
        achievements = await db.query.achievements.findMany({
          where: inArray(schema.achievements.code, awardedAchievements),
        });
      }
    }

    return res.json({
      ...response,
      achievements: achievements,
    });
  } catch (e) {
    console.log('error', e);
    next(e);
  }
};
