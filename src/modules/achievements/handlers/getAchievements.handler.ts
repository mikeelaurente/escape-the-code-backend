import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { asc, eq, sql } from 'drizzle-orm';
import { getNextSectionFor } from '../../../db/repositories/story.repository';
import { getUserRanking } from '../../../db/repositories/user.repository';

export const getAchievementsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const achievements = await db.query.achievements.findMany({
      orderBy: sql`
        CASE 
          WHEN difficulty = 'easy' THEN 1
          WHEN difficulty = 'medium' THEN 2
          WHEN difficulty = 'hard' THEN 3
          ELSE 4
        END ASC
        `,
      with: {
        userAchievements: {
          where: eq(schema.userAchievements.userId, Number(req.user?.id)),
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
