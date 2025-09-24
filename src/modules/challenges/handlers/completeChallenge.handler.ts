import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import dayjs from 'dayjs';
import { getNextSectionFor } from '../../../db/repositories/story.repository';
import { generateFeedback } from '../../../feedback';

export const completeChallengeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const challengeId = parseInt(req.params.id || '');
  const userId = Number(req.user?.id);

  const challenge = await db.query.challenges.findFirst({
    where: eq(schema.challenges.id, challengeId),
    with: {
      answers: {
        where: and(
          eq(schema.challengeAnswers.userId, userId),
          eq(schema.challengeAnswers.status, schema.ChallengeStatus.Ongoing),
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
    return res.json({
      status: 'error',
      message: 'Challenge not found',
    });
  }

  const activeAnswer = challenge.answers[0];
  if (!activeAnswer) {
    return res.json({
      status: 'error',
      message: 'Challenge not started',
    });
  }

  const successfulSubmission = activeAnswer.submissions[0];
  if (!successfulSubmission) {
    return res.json({
      status: 'error',
      message: 'You have not solved this challenge yet.',
    });
  }

  let nextSection = null;
  let feedback = null;

  const challengeWithDetails = await db.query.challenges.findFirst({
    where: eq(schema.challenges.id, challengeId),
    with: {
      section: {
        with: {
          chapter: {
            with: {
              story: true,
            },
          },
        },
      },
    },
  });
  // check if already inserted to story progress
  const inserted = await db.query.storyProgress.findFirst({
    where: and(
      eq(schema.storyProgress.userId, userId),
      eq(
        schema.storyProgress.sectionId,
        Number(challengeWithDetails?.sectionID),
      ),
    ),
  });
  if (!inserted) {
    await db.insert(schema.storyProgress).values({
      storyId: challengeWithDetails?.section?.chapter?.storyId,
      chapterId: challengeWithDetails?.section?.chapterId,
      sectionId: challengeWithDetails?.sectionID,
      userId,
    });
  }

  feedback = await generateFeedback(`
      Respond in HTML (wrap in div, don't markdown):
      CHALLENGE GIVEN: ${challenge.description}
      DIFFICULTY: ${challenge.difficulty}
      USER CODE: ${successfulSubmission.code}
      USER CODE RESULT: ${successfulSubmission.codeOutput}

      Response:
      1. Code Review
      2. Code Improvements
      3. Best Practices
      4. Additional Resources
      5. Trivia
    `);

  nextSection = await getNextSectionFor(userId);

  await db
    .update(schema.challengeAnswers)
    .set({
      completedAt: new Date(),
      feedback: feedback,
      status: schema.ChallengeStatus.Completed,
    })
    .where(eq(schema.challengeAnswers.id, activeAnswer.id));

  const updatedAnswer = await db.query.challengeAnswers.findFirst({
    where: eq(schema.challengeAnswers.id, activeAnswer.id),
  });

  let challengeStatus = 'none';
  switch (updatedAnswer?.status) {
    case schema.ChallengeStatus.Completed:
      challengeStatus = 'completed';
      break;
    case schema.ChallengeStatus.Ongoing:
      challengeStatus = 'ongoing';
      break;
  }

  res.json({
    status: 'ok',
    data: {
      nextSection,
      answer: {
        id: updatedAnswer?.id,
        submission: successfulSubmission,
        feedback: updatedAnswer?.feedback,
        startedAt: updatedAnswer?.createdAt,
        completedAt: updatedAnswer?.completedAt,
        status: challengeStatus,
      },
    },
  });
};
