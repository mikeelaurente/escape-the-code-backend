import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const getChallengeHintsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const challengeId = parseInt(req.params.id || '');

  const challengeHints = await db.query.challengeHints.findMany({
    where: eq(schema.challengeHints.challengeId, challengeId),
    columns: {
      challengeId: true,
      cost: true,
      displayText: true,
      id: true,
    },
  });

  if (!challengeHints) {
    res.status(404).json({ status: 'error', message: 'Hints not found' });
    return;
  }
  res.json({
    status: 'ok',
    data: challengeHints,
  });
};
