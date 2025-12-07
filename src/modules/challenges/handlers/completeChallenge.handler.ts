import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { getNextSectionFor } from '../../../db/repositories/story.repository';
import { generateFeedback, generateOllamaFeedback } from '../../../feedback';
import { updateUserBalance } from '../../../db/repositories/user.repository';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
  onChallengeCompleted,
  awardChallengeAchievements,
} from '../../../services/achievements.service';

export const completeChallengeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    dayjs.extend(utc);
    const challengeId = parseInt(req.params.id || '');
    const userId = Number(req.user?.id);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    // Function to send data
    const sendEvent = (event: string, data: unknown, stringify = true) => {
      res.write(`${event}: ${stringify ? JSON.stringify(data) : data}\n\n`);
    };

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
      let feedback = '';

      sendEvent('message', { message: 'Checking challenge.' });
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

      sendEvent('message', { message: 'Updating progress.' });
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

      sendEvent('message', { message: 'Checking rewards.' });
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
        sendEvent('message', { message: 'Generating feedback.' });
        const response = await generateOllamaFeedback(`
COURSE CHAPTER: ${challengeWithDetails?.section?.chapter.title}
CHAPTER SECTION: ${challengeWithDetails?.section?.title}
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
    <hr />
    <h2>Rating: { RATING }/{ MAX_RATING}</h2>
</div>
Important Rules:
- The user is a beginner.
- Make sure to use the given task as context when giving a feedback or code review.
- The input data is a variable named 'input'. This variable will be automatically injected in the code. Task may contain placeholder(s) pointing to the input data and can be named differently.
- To display the output, console.log will be used.
- Use <br/> for line breaks
- Wrap code in <pre> tag
- CODE REVIEW RULES:
  > Assume that the user's code is correct unless it didn't follow the task instructions and bypass the rules.
  > Validate if some tricks were used to bypass the correct procedure
  > Adding validation, sanitation, or error handling is not considered as a trick.
  > A trick is defined as doing shortcuts like printing the literal output.
  > Don't print the serialed output, just give the review.
  > Don't require input validation, sanitization or error handling unless specified in the task.
- CODE IMPROVEMENT RULES:
  > Provide an explanation on how the code can be improved.
  > Don't use any advance solutions, make it beginner friendly.
- RATING RULES:
  > Add the overall rating (1-10), 10 is the highest.
  > If the desired output has been produced without using any tricks, give it a perfect rating to motivate the user.
        `);

        if (response) {
          for await (const part of response) {
            feedback += part.message.content.toString();
            sendEvent('feedback', { data: part.message.content });
          }
        } else {
          feedback = 'No feedback';
        }
      } catch (e) {
        console.log(e);
        feedback = 'No feedback.';
      }

      const courseId = challengeWithDetails?.section?.chapter?.courseId;
      nextSection = await getNextSectionFor(userId, courseId!, tx);

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
            rewardPoints: updatedAnswer?.rewardPoints,
            creditPoints: updatedAnswer?.creditPoints,
          },
        },
      };
    });

    let achievements: (
      | typeof schema.achievements.$inferSelect
      | typeof schema.sectionAchievements.$inferSelect
    )[] = [];
    if (response.status === 'ok' && response?.data?.nextSection) {
      const answerId = response.data.answer.id;
      if (answerId) {
        const awardedAchievements = await onChallengeCompleted(answerId);
        const globalAchievements = await db.query.achievements.findMany({
          where: inArray(schema.achievements.code, awardedAchievements),
        });
        achievements.push(...globalAchievements);
      }
    }

    // Award challenge-specific section achievements
    if (response.status === 'ok') {
      try {
        const sectionAchievements = await awardChallengeAchievements(
          userId,
          challengeId,
        );
        achievements.push(...sectionAchievements);
      } catch (error) {
        console.error('Error awarding section achievements:', error);
      }
    }

    const finalPayload = JSON.stringify(
      {
        data: {
          ...response,
          achievements,
        },
      },
      null,
      2,
    );

    // split finalPayload into chunks of 2048 characters
    const chunkSize = 2048;
    for (let i = 0; i < finalPayload.length; i += chunkSize) {
      const chunk = finalPayload.slice(i, i + chunkSize);
      sendEvent('end:chunk', chunk, false);
    }

    sendEvent('end', {
      data: 'complete',
    });
  } catch (e) {
    console.log('error', e);
    next(e);
  }
};
