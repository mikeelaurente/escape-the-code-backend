import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import dayjs from 'dayjs';

export const startChallengeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const challengeId = parseInt(req.params.id || '');
  const userId = Number(req.user?.id);

  const challenge = await db.query.challenges.findFirst({
    where: eq(schema.challenges.id, challengeId),
  });

  if (!challenge) {
    return res.json({
      status: 'error',
      message: 'Challenge not found',
    });
  }

  // check if challenge was already started or completed

  const challengeAnswer = await db.query.challengeAnswers.findFirst({
    where: and(
      eq(schema.challengeAnswers.userId, userId),
      eq(schema.challengeAnswers.challengeId, challenge.id),
      inArray(schema.challengeAnswers.status, [
        schema.ChallengeStatus.Ongoing,
        schema.ChallengeStatus.Completed,
      ]),
    ),
  });

  if (
    challengeAnswer &&
    challengeAnswer.status === schema.ChallengeStatus.Completed
  ) {
    return res.json({
      status: 'error',
      message: 'Challenge has already been completed.',
    });
  }

  const now = dayjs();

  if (
    challengeAnswer &&
    challengeAnswer.status === schema.ChallengeStatus.Ongoing
  ) {
    // check if expired or duration limit was reached
    const durationLimit = challengeAnswer.durationLimitMinutes || 0;
    const expirationDate = dayjs(challengeAnswer.createdAt).add(
      durationLimit,
      'minutes',
    );

    if (now.isAfter(expirationDate) && durationLimit > 0) {
      // mark the challengeAnswer as expired
      await db
        .update(schema.challengeAnswers)
        .set({
          status: schema.ChallengeStatus.Expired,
        })
        .where(eq(schema.challengeAnswers.id, challengeAnswer.id));
    } else {
      const remainingTime =
        expirationDate.subtract(now.unix(), 'second').unix() / 60;
      return res.json({
        status: 'error',
        message: 'Challenge has already been started.',
        data: {
          remainingTime: Math.min(0, remainingTime),
          mode: 'free',
        },
      });
    }
  }

  await db.insert(schema.challengeAnswers).values({
    challengeId: challenge.id,
    userId: userId,
    durationLimitMinutes: challenge.durationLimitMinutes,
    status: schema.ChallengeStatus.Ongoing,
  });

  res.json({
    status: 'ok',
    data: {
      remainingTime: (challenge.durationLimitMinutes || 0) * 60,
      mode: 'timed',
      status: 'ongoing',
    },
  });
};
