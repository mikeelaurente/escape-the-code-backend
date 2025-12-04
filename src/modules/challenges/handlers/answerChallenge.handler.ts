import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { and, eq } from 'drizzle-orm';
import * as challengesSchema from '../challenges.schema';
import { extractValidationErrors } from '../../../helpers/validation.helper';
import { updateUserBalance } from '../../../db/repositories/user.repository';
import { onChallengeCompleted } from '../../../services/achievements.service';
import { getNextSectionFor } from '../../../db/repositories/story.repository';

export const answerChallengeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const validationResult =
    await challengesSchema.answerChallengeSchema.safeParseAsync(req.body);

  if (!validationResult.success) {
    return res.json({
      status: 'error',
      errors: extractValidationErrors(validationResult),
    });
  }

  const challengeId = parseInt(req.params.id || '');
  const userAnswer = validationResult.data.answer;
  const userId = Number(req.user?.id);

  try {
    const challenge = await db.query.challenges.findFirst({
      where: eq(schema.challenges.id, challengeId),
    });

    if (!challenge) {
      return res.json({
        status: 'error',
        code: 'challenge_not_found',
        message: 'Challenge not found',
      });
    }

    // Verify this is a multiple choice challenge
    if (challenge.type !== 'multiple_choice') {
      return res.json({
        status: 'error',
        code: 'invalid_challenge_type',
        message: 'This endpoint is only for multiple choice challenges',
      });
    }

    // Check if challenge was already started or completed
    const existingAnswer = await db.query.challengeAnswers.findFirst({
      where: and(
        eq(schema.challengeAnswers.userId, userId),
        eq(schema.challengeAnswers.challengeId, challengeId),
      ),
    });

    if (!existingAnswer) {
      return res.json({
        status: 'error',
        code: 'challenge_not_started',
        message: 'Challenge has not been started yet',
      });
    }

    if (existingAnswer.status === schema.ChallengeStatus.Completed) {
      return res.json({
        status: 'error',
        code: 'challenge_already_answered',
        message: 'You have already completed this challenge',
      });
    }

    if (existingAnswer.status === schema.ChallengeStatus.Cancelled) {
      return res.json({
        status: 'error',
        code: 'challenge_already_answered',
        message:
          'You have already answered this challenge incorrectly. Multiple choice challenges can only be attempted once.',
      });
    }

    if (existingAnswer.status !== schema.ChallengeStatus.Ongoing) {
      return res.json({
        status: 'error',
        code: 'challenge_not_available',
        message: 'This challenge is not available for answering',
      });
    }

    // Parse choices to find the correct answer
    let correctAnswer = '';
    if (!challenge.choices) {
      return res.json({
        status: 'error',
        code: 'invalid_challenge_data',
        message: 'Multiple choice challenge must have choices',
      });
    }

    try {
      const choices = JSON.parse(challenge.choices);
      const correctChoice = choices.find(
        (choice: any) => choice.isCorrect === true,
      );
      if (correctChoice) {
        correctAnswer = correctChoice.text;
      } else {
        return res.json({
          status: 'error',
          code: 'invalid_challenge_data',
          message: 'No correct answer found in choices',
        });
      }
    } catch (error) {
      console.error('Error parsing choices:', error);
      return res.json({
        status: 'error',
        code: 'invalid_challenge_data',
        message: 'Invalid choices format',
      });
    }

    const isCorrect = userAnswer === correctAnswer;

    // Generate feedback
    let feedback = '';
    if (isCorrect) {
      feedback = `Great job! "${correctAnswer}" is the correct answer.`;
    } else {
      feedback = `Sorry, that's incorrect. You selected "${userAnswer}", but the correct answer is "${correctAnswer}".`;
    }

    // Update challenge answer record - always mark as Completed
    await db
      .update(schema.challengeAnswers)
      .set({
        status: schema.ChallengeStatus.Completed,
        rewardPoints: isCorrect ? challenge.rewardPoints : 0,
        creditPoints: isCorrect ? challenge.creditPoints : 0,
        completedAt: new Date(),
        feedback,
      })
      .where(eq(schema.challengeAnswers.id, existingAnswer.id));

    // Create submission record
    await db.insert(schema.challengeAnswerSubmissions).values({
      userId,
      challengeId,
      challengeAnswerId: existingAnswer.id,
      code: String(userAnswer),
      result: isCorrect ? 'passed' : 'failed',
      codeOutput: isCorrect ? 'Correct!' : 'Incorrect',
      metadata: JSON.stringify({
        userAnswer,
        correctAnswer,
        isCorrect,
      }),
    });

    if (isCorrect) {
      // Award credits and points
      await db.insert(schema.creditTransactions).values({
        amount: Number(challenge.creditPoints),
        title: 'Reward: ' + challenge.title,
        type: 'in',
        group: 'reward',
        referenceId: existingAnswer.id,
        userId: userId,
      });

      await updateUserBalance(userId);

      // Get challenge with details for course progress
      const challengeWithDetails = await db.query.challenges.findFirst({
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

      // Update course progress
      if (challenge.sectionID) {
        const inserted = await db.query.courseProgress.findFirst({
          where: and(
            eq(schema.courseProgress.userId, userId),
            eq(
              schema.courseProgress.sectionId,
              Number(challengeWithDetails?.sectionID),
            ),
          ),
        });

        if (!inserted && challengeWithDetails?.section) {
          await db.insert(schema.courseProgress).values({
            courseId: challengeWithDetails.section.chapter?.courseId,
            chapterId: challengeWithDetails.section.chapterId,
            sectionId: challengeWithDetails.sectionID,
            userId,
          });
        }
      }

      // Trigger achievement check
      try {
        await onChallengeCompleted(existingAnswer.id);
      } catch (error) {
        console.error('Error checking achievements:', error);
      }

      // Get next section
      const courseId = challengeWithDetails?.section?.chapter?.courseId;
      const nextSection = courseId
        ? await getNextSectionFor(userId, courseId)
        : null;

      // Get updated challenge answer with submission
      const acceptedAnswer = await db.query.challengeAnswers.findFirst({
        where: eq(schema.challengeAnswers.id, existingAnswer.id),
        with: {
          submissions: true,
        },
      });

      // Parse choices if available
      let choices = null;
      if (challenge.choices) {
        try {
          choices = JSON.parse(challenge.choices);
        } catch (error) {
          console.error('Error parsing choices:', error);
        }
      }

      return res.json({
        status: 'ok',
        data: {
          result: 'correct',
          rewardPoints: challenge.rewardPoints,
          creditPoints: challenge.creditPoints,
          feedback,
          choices,
          acceptedAnswer,
          nextSection: nextSection && {
            id: nextSection.id,
            chapterId: nextSection.chapterId,
            title: nextSection.title,
          },
        },
      });
    } else {
      // Parse choices if available
      let choices = null;
      if (challenge.choices) {
        try {
          choices = JSON.parse(challenge.choices);
        } catch (error) {
          console.error('Error parsing choices:', error);
        }
      }

      // Get challenge with details for next section
      const challengeWithDetails = await db.query.challenges.findFirst({
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

      // Get next section
      const courseId = challengeWithDetails?.section?.chapter?.courseId;
      const nextSection = courseId
        ? await getNextSectionFor(userId, courseId)
        : null;

      return res.json({
        status: 'ok',
        data: {
          result: 'incorrect',
          userAnswer,
          correctAnswer,
          feedback,
          choices,
          nextSection: nextSection && {
            id: nextSection.id,
            chapterId: nextSection.chapterId,
            title: nextSection.title,
          },
        },
      });
    }
  } catch (error) {
    console.error('Error in answerChallengeHandler:', error);
    return res.status(500).json({
      status: 'error',
      code: 'internal_error',
      message: 'An error occurred while processing your answer',
    });
  }
};
