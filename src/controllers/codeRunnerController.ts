import { Request, Response, NextFunction } from 'express';
import { runWithDenoWindows } from '../runners/deno.runner';

export const tryRunCode = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const b64Code = req.body.code;

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
