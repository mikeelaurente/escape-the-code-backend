import { Request, Response, NextFunction } from 'express';
import {
  getSectionAnswersWithHints,
  getUserRankingFor,
} from '../../../db/repositories/user.repository';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';

export const getDashboardHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.user?.id);
    const ranking = await getUserRankingFor(userId);
    const coursesIds = (
      await db.query.courseProgress.findMany({
        columns: {
          courseId: true,
        },
        where: eq(schema.courseProgress.userId, userId),
      })
    ).map((c) => Number(c.courseId));

    const courses = await db.query.courses.findMany({
      where: inArray(schema.courses.id, coursesIds),
    });
    const transactions = await db.query.creditTransactions.findMany({
      where: and(eq(schema.creditTransactions.userId, userId)),
      orderBy: desc(schema.creditTransactions.createdAt),
    });

    return res.json({
      status: 'ok',
      data: {
        courses,
        ranking: ranking,
        transactions: transactions,
      },
    });
  } catch (e) {
    return next(e);
  }
};
