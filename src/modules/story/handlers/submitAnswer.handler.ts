import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { and, eq } from 'drizzle-orm';
import { CodeTest, runWithDenoWindows } from '../../../runners/deno.runner';
import * as storySchema from '../story.schema';
import { extractValidationErrors } from '../../../helpers/validation.helper';
import { getNextSectionFor } from '../../../db/repositories/story.repository';
import { generateFeedback } from '../../../feedback';

export const submitAnswerHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const validationResult = await storySchema.submitAnswerSchema.safeParseAsync(
    req.body,
  );

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
  });

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

  await db.insert(schema.challengeAnswers).values({
    userId,
    challengeId,
    code: answer,
    result: passed ? 'passed' : 'failed',
    metadata: JSON.stringify(runnerResponse),
    codeOutput,
  });

  let nextSection = null;
  let feedback = null;

  if (passed) {
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

    // feedback = await generateFeedback(`
    //   Respond in HTML (wrap in div, don't markdown):
    //   CHALLENGE GIVEN: ${challenge?.description}
    //   DIFFICULTY: ${challenge?.difficulty}
    //   USER CODE: ${answer}
    //   USER CODE RESULT: ${JSON.stringify(runnerResponse)}

    //   Response:
    //   1. Code Review
    //   2. Code Improvements
    //   3. Best Practices
    //   4. Additional Resources
    //   5. Trivia
    // `);

    nextSection = await getNextSectionFor(userId);
  }

  res.json({
    ...runnerResponse,
    nextSection,
    feedback,
  });
};
