import { Request, Response, NextFunction } from 'express';
import { getUserRankingFor } from '../../../db/repositories/user.repository';
import { getNextSectionFor } from '../../../db/repositories/story.repository';
import * as schema from '../../../db/schema';
import { eq, asc } from 'drizzle-orm';
import { db } from '../../../db';

export const getUserStatsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.params.id);
    const userRank = await getUserRankingFor(userId);
    const nextSection = null;

    const achievements = await db.query.userAchievements.findMany({
      where: eq(schema.userAchievements.userId, userId),
      orderBy: asc(schema.userAchievements.awardedAt),
      with: {
        achievement: {
          columns: {
            icon: true,
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
      data: { rank: userRank, nextSection: nextSection, achievements },
    });
  } catch (e) {
    return next(e);
  }
};
