import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { ResolveFnOutput } from 'module';
import { runCode } from '../runner';
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
