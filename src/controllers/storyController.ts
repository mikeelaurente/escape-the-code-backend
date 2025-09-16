import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import * as schema from '../db/schema';
import { and, asc, eq } from 'drizzle-orm';
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
    const userId = Number(req.session.userId);
    const stories = await db().query.stories.findMany({
      with: {
        progress: {
          where: eq(schema.storyProgress.userId, userId),
        },
        chapters: {
          with: {
            sections: {
              with: {
                challenges: true,
              },
              orderBy: asc(schema.sections.order),
            },
          },
          orderBy: asc(schema.chapters.order),
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
    columns: {
      challengeId: true,
      cost: true,
      displayText: true,
      id: true,
    },
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
  const userId = req.session.userId;

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

  const passed =
    runnerResponse.status === 'ok' && runnerResponse.results.every((x) => x.ok);

  let codeOutput = '';

  if (runnerResponse.status === 'ok') {
    codeOutput = JSON.stringify(runnerResponse.results);
  } else if (runnerResponse.status === 'crash') {
    codeOutput = runnerResponse.detail || 'error';
  } else if (
    runnerResponse.status === 'killed' ||
    runnerResponse.status === 'timeout'
  ) {
    codeOutput = runnerResponse.detail || 'timeout';
  } else if (runnerResponse.status === 'oom') {
    codeOutput = runnerResponse.detail || 'out of memory';
  } else if (runnerResponse.status === 'parse_error') {
    codeOutput = runnerResponse.detail || 'syntax error';
  }

  await db()
    .insert(schema.challengeAnswers)
    .values({
      userId,
      challengeId,
      code: answer,
      result: passed ? 'passed' : 'failed',
      metadata: JSON.stringify(runnerResponse),
      codeOutput,
    });

  if (passed) {
    const challengeWithDetails = await db().query.challenges.findFirst({
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
    await db().insert(schema.storyProgress).values({
      storyId: challengeWithDetails?.section?.chapter?.storyId,
      chapterId: challengeWithDetails?.section?.chapterId,
      sectionId: challengeWithDetails?.sectionID,
      userId,
    });
  }

  res.json(runnerResponse);
};
