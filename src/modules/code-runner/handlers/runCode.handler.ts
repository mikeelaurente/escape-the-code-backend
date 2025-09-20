import { Request, Response, NextFunction } from 'express';
import { runWithDenoWindows } from '../../../runners/deno.runner';
import * as codeRunnerSchema from '../codeRunner.schema';
import { extractValidationErrors } from '../../../helpers/validation.helper';

export const runCodeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const validationResult = await codeRunnerSchema.runCodeSchema.safeParseAsync(
    req.body,
  );

  if (!validationResult.success) {
    return res.json({
      status: 'error',
      errors: extractValidationErrors(validationResult),
    });
  }

  const b64Code = validationResult.data.code;

  const code = decodeURIComponent(atob(b64Code));

  const runnerResponse = await runWithDenoWindows({
    code: code,
    tests: [],
    timeoutMs: 3000,
    heapMb: 256,
    softenCpu: false,
  });

  console.log('runnerResponse', runnerResponse);

  res.json(runnerResponse);
};
