import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { ResolveFnOutput } from 'module';
import { runCode } from '../runner';

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

  const question = `
RESPOND IN JSON FORMAT:
{
    "code_output": "<the code output from submitted CODE>",
    "result": "success or failed. Determine if the submitted CODE output is equal to the EXPECTED OUTPUT",
    "syntax_errors": [
        { "code": "<the code snippet with error line by line, make sure to properly escape the snippet>", "lineNumber": <number>, "columnNumber": <number> }
    ]
    "recommendations": [
        { "message": "<message>", "reason": "<reason>" }
    ],
    "feedback": []
}
EXPECTED OUTPUT:
${challenge?.expectedOutput}
LANGUAGE:
Javascript
CODE:
${answer.trim()}
`;

  console.log('QUESTION:');
  console.log(question);

  // submit code to llm
  const llmResponse = await runCode(question);

  let parsed: any = {};
  try {
    let content = llmResponse.trim().replace(/\n$/, '');
    parsed = JSON.parse(content);
  } catch (e) {
    console.log(e);
    parsed = {};
  }

  const response = {
    codeOutput: parsed.code_output,
    result: parsed.result,
    syntaxErrors: parsed.syntax_errors,
    feedback: parsed.feedback,
    recommendations: parsed.recommendations,
  };

  res.json(response);
};
