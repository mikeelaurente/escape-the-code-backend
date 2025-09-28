import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { and, eq } from 'drizzle-orm';
import { updateUserBalance } from '../../../db/repositories/user.repository';

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

  const usedHint = await db.query.hintUsages.findFirst({
    where: and(
      eq(schema.hintUsages.userId, currentUserId),
      eq(schema.hintUsages.challengeHintId, hintId),
    ),
  });

  if (usedHint) {
    return res.json({
      status: 'ok',
      alreadyUsed: true,
      hint: challengeHint,
    });
  }

  await updateUserBalance(currentUserId);
  const currentUser = await db.query.users.findFirst({
    where: eq(schema.users.id, currentUserId),
  });
  if (!currentUser) {
    return res.json({
      status: 'error',
      message: 'User not found',
    });
  }

  if (currentUser.credits < challengeHint.cost) {
    res.json({ status: 'error', message: 'Not enough credits' });
    return;
  }

  await db.insert(schema.hintUsages).values({
    userId: currentUserId,
    challengeHintId: hintId,
    challengeId: challengeHint.challengeId,
    cost: challengeHint.cost,
  });

  const creditUsage = await db.query.hintUsages.findFirst({
    where: and(
      eq(schema.hintUsages.userId, currentUserId),
      eq(schema.hintUsages.challengeHintId, challengeHint.id),
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

  await db.insert(schema.creditTransactions).values({
    amount: Number(creditUsage?.cost),
    title: 'Buy Hint: ' + challengeHint.displayText,
    type: 'out',
    group: 'hint',
    referenceId: creditUsage?.id,
    userId: currentUserId,
  });

  await updateUserBalance(currentUser.id);

  const updatedUser = await db.query.users.findFirst({
    where: eq(schema.users.id, currentUserId),
  });

  res.json({
    status: 'ok',
    remainingCredits: updatedUser?.credits,
    purchasedHint: challengeHint,
    creditUsage,
  });
};
