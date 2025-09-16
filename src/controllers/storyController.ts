import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import * as schema from '../db/schema';
import { and, eq } from 'drizzle-orm';
import { runWithDenoWindows, CodeTest } from '../runners/deno.runner';

export const createStories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const title = req.body.title;
    const description = req.body.description;
    const rewardOptions = req.body.rewardOptions;
  } catch (error) {
    next(error);
  }
};

export const getStories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const stories = await db().query.stories.findMany({
      with: {
        chapters: {
          with: {
            sections: {
              with: {
                challenges: true,
              },
            },
          },
        },
      },
    });
    res.json(stories);
  } catch (error) {
    next(error);
  }
};

export const getChallengeHints = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const challengeId = parseInt(req.params.id || '');

  const challengeHints = await db().query.challengeHints.findMany({
    where: eq(schema.challengeHints.challengeId, challengeId),
  });

  if (!challengeHints) {
    res.status(404).json({ message: 'Hints not found' });
    return;
  }
  res.json(challengeHints);
};

export const buyHint = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const hintId = req.body.hintId;
  const currentUserId = Number(req.session.userId);

  const challengeHint = await db().query.challengeHints.findFirst({
    where: eq(schema.challengeHints.id, hintId),
  });

  if (!challengeHint) {
    res.status(404).json({ message: 'Hint not found' });
    return;
  }

  const usedHint = await db().query.creditUsage.findFirst({
    where: and(
      eq(schema.creditUsage.userId, currentUserId),
      eq(schema.creditUsage.challengeHintId, hintId),
    ),
  });

  if (usedHint) {
    return res.json({
      alreadyUsed: true,
      hint: challengeHint,
    });
  }

  const userCredits = await db().query.userCredits.findFirst({
    where: eq(schema.userCredits.userId, currentUserId),
  });

  if (!userCredits) {
    res.status(404).json({ message: 'Credits not found' });
    return;
  }
  if (userCredits?.value < challengeHint.cost) {
    res.status(404).json({ message: 'Not enough credits' });
    return;
  }

  const newCredit = userCredits?.value - challengeHint.cost;

  await db()
    .update(schema.userCredits)
    .set({
      value: newCredit,
    })
    .where(eq(schema.userCredits.userId, currentUserId));

  await db().insert(schema.creditUsage).values({
    userId: currentUserId,
    challengeHintId: hintId,
    cost: challengeHint.cost,
  });

  res.json({
    remainingCredits: newCredit,
    purchasedHint: challengeHint,
  });
};

export const submitAnswer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const challengeId = parseInt(req.params.id || '');
  const answer = decodeURIComponent(req.body.answer);

  const challenge = await db().query.challenges.findFirst({
    where: eq(schema.challenges.id, challengeId),
  });

  const codeTests = JSON.parse(challenge?.expectedOutput || '[]') as CodeTest[];
  console.log('challenge', challenge);

  const runnerResponse = await runWithDenoWindows({
    code: answer,
    tests: codeTests,
    timeoutMs: 3000,
    heapMb: 256,
    softenCpu: false,
  });

  console.log('runnerResponse', runnerResponse);

  res.json(runnerResponse);
};
