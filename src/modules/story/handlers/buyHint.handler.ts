import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { and, eq } from 'drizzle-orm';

export const buyHintHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const hintId = req.body.hintId;
  const currentUserId = Number(req.user?.id);

  const challengeHint = await db.query.challengeHints.findFirst({
    where: eq(schema.challengeHints.id, hintId),
  });

  if (!challengeHint) {
    res.json({ status: 'error', message: 'Hint not found' });
    return;
  }

  const usedHint = await db.query.creditUsage.findFirst({
    where: and(
      eq(schema.creditUsage.userId, currentUserId),
      eq(schema.creditUsage.challengeHintId, hintId),
    ),
  });

  if (usedHint) {
    return res.json({
      status: 'ok',
      alreadyUsed: true,
      hint: challengeHint,
    });
  }

  const userCredits = await db.query.userCredits.findFirst({
    where: eq(schema.userCredits.userId, currentUserId),
  });

  if (!userCredits) {
    res.json({ status: 'error', message: 'Credits not found' });
    return;
  }
  if (userCredits?.value < challengeHint.cost) {
    res.json({ status: 'error', message: 'Not enough credits' });
    return;
  }

  const newCredit = userCredits?.value - challengeHint.cost;

  await db
    .update(schema.userCredits)
    .set({
      value: newCredit,
    })
    .where(eq(schema.userCredits.userId, currentUserId));

  await db.insert(schema.creditUsage).values({
    userId: currentUserId,
    challengeHintId: hintId,
    challengeId: challengeHint.challengeId,
    cost: challengeHint.cost,
  });

  const creditUsage = await db.query.creditUsage.findFirst({
    where: and(
      eq(schema.creditUsage.userId, currentUserId),
      eq(schema.creditUsage.challengeHintId, challengeHint.id),
    ),
    with: {
      hint: {
        columns: {
          id: true,
          hintText: true,
        },
      },
    },
  });

  res.json({
    status: 'ok',
    remainingCredits: newCredit,
    purchasedHint: challengeHint,
    creditUsage,
  });
};
