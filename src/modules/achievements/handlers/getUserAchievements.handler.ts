import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { asc, eq, sql } from 'drizzle-orm';
import { getNextSectionFor } from '../../../db/repositories/story.repository';
import { getUserRanking } from '../../../db/repositories/user.repository';

export const getUserAchievementsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.user?.id);

    const achievements = await db.query.userAchievements.findMany({
      where: eq(schema.userAchievements.userId, userId),
      orderBy: asc(schema.userAchievements.awardedAt),
      with: {
        achievement: {
          columns: {
            title: true,
            description: true,
            difficulty: true,
            code: true,
          },
        },
      },
    });

    res.json({
      status: 'ok',
      data: achievements,
    });
  } catch (error) {
    next(error);
  }
};
