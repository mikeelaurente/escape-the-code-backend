import { Request, Response, NextFunction } from 'express';
import {
  getSectionAnswersWithHints,
  getUserRankingFor,
} from '../../../db/repositories/user.repository';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { and, desc, eq } from 'drizzle-orm';

export const getDashboardHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.user?.id);
    const ranking = await getUserRankingFor(userId);
    const sectionAnswersWithHints = await getSectionAnswersWithHints(userId);
    const transactions = await db.query.creditTransactions.findMany({
      where: and(eq(schema.creditTransactions.userId, userId)),
      orderBy: desc(schema.creditTransactions.createdAt),
    });

    return res.json({
      status: 'ok',
      data: {
        ranking: ranking,
        progress: {
          data: sectionAnswersWithHints.data,
          grouped: Object.values(sectionAnswersWithHints.grouped),
        },
        transactions: transactions,
      },
    });
  } catch (e) {
    return next(e);
  }
};
