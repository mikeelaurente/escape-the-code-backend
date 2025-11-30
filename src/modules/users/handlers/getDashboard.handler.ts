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

    return res.json({
      status: 'ok',
      data: {
        courses,
        ranking: ranking,
      },
    });
  } catch (e) {
    return next(e);
  }
};
