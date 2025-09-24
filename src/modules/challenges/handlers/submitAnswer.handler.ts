import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { CodeTest, runWithDenoWindows } from '../../../runners/deno.runner';
import * as challengesSchema from '../challenges.schema';
import { extractValidationErrors } from '../../../helpers/validation.helper';
import { getNextSectionFor } from '../../../db/repositories/story.repository';
import { generateFeedback } from '../../../feedback';

export const submitAnswerHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const validationResult =
    await challengesSchema.submitAnswerSchema.safeParseAsync(req.body);

  if (!validationResult.success) {
    return res.json({
      status: 'error',
      errors: extractValidationErrors(validationResult),
    });
  }
  const challengeId = parseInt(req.params.id || '');
  const answer = decodeURIComponent(validationResult.data.answer);
  const userId = Number(req.user?.id);

  const challenge = await db.query.challenges.findFirst({
    where: eq(schema.challenges.id, challengeId),
    with: {
      answers: {
        with: {
          submissions: {
            where: eq(schema.challengeAnswerSubmissions.result, 'passed'),
          },
        },
        where: and(
          eq(schema.challengeAnswers.userId, userId),
          eq(schema.challengeAnswers.status, schema.ChallengeStatus.Ongoing),
        ),
      },
    },
  });

  if (!challenge) {
    return res.json({
      status: 'error',
      code: 'challenge_not_found',
      message: 'Challenge not found',
    });
  }

  const firstAnswer = challenge.answers[0];
  if (!firstAnswer) {
    return res.json({
      status: 'error',
      code: 'challenge_not_started',
      message: 'Challenge not started',
    });
  }

  const successfulSubmission = firstAnswer.submissions[0];
  if (successfulSubmission) {
    return res.json({
      status: 'error',
      code: 'challenge_already_solved',
      message: 'You have already solved this challenge',
    });
  }

  const codeTests = JSON.parse(challenge?.expectedOutput || '[]') as CodeTest[];

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

  await db.insert(schema.challengeAnswerSubmissions).values({
    userId,
    challengeId,
    challengeAnswerId: firstAnswer.id,
    code: answer,
    result: passed ? 'passed' : 'failed',
    metadata: JSON.stringify(runnerResponse),
    codeOutput,
  });

  const submittedResponse = await db.query.challengeAnswerSubmissions.findFirst(
    {
      where: and(
        eq(schema.challengeAnswerSubmissions.userId, userId),
        eq(schema.challengeAnswerSubmissions.challengeAnswerId, firstAnswer.id),
      ),
      orderBy: desc(schema.challengeAnswerSubmissions.id),
    },
  );

  (firstAnswer as any).submission = {
    id: submittedResponse?.id,
    result: submittedResponse?.result,
    code: submittedResponse?.code,
    codeOutput: submittedResponse?.codeOutput,
    metadata: JSON.parse(submittedResponse?.metadata || ''),
  };

  res.json({
    status: 'ok',
    data: {
      result: passed ? 'solved' : 'ongoing',
      ongoingAnswer: firstAnswer,
    },
  });
};
