import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import {
  and,
  asc,
  desc,
  eq,
  exists,
  inArray,
  like,
  notExists,
  notInArray,
  or,
  SQL,
  sql,
} from 'drizzle-orm';
import { getNextSectionFor } from '../../../db/repositories/story.repository';
import { getUserRanking } from '../../../db/repositories/user.repository';
import QueryString from 'qs';
import { extractValidationErrors } from '../../../helpers/validation.helper';
import { AchievementsQueryParamsSchema } from '../../../types/achievement';

export const getAchievementsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.user?.id);

    const url = new URL(req.host + req.originalUrl);
    const queryParams = QueryString.parse(url?.searchParams.toString() || '');

    console.log('queryParams', queryParams);

    const result = AchievementsQueryParamsSchema.safeParse(queryParams);
    if (!result.success) {
      return res.json({
        status: 'error',
        errors: extractValidationErrors(result),
      });
    }

    const query = result.data;
    const sqlQuery: SQL<unknown>[] = [];

    if (query.search && query.search.trim().length > 0) {
      sqlQuery.push(
        or(
          like(schema.achievements.title, `%${query.search}%`),
        ) as SQL<unknown>,
      );
    }

    if (query.filters?.status !== 'all') {
      const userAchievementIds = (
        await db.query.userAchievements.findMany({
          columns: {
            achievementId: true,
          },
          where: eq(schema.userAchievements.userId, userId),
        })
      ).map((a) => Number(a.achievementId));

      const inList =
        query.filters?.status === 'completed' ? inArray : notInArray;
      sqlQuery.push(inList(schema.achievements.id, userAchievementIds));
    }

    const total = await db.$count(schema.achievements, and(...sqlQuery));

    const offset = Number(query.limit * (query.page - 1));
    const achievements = await db.query.achievements.findMany({
      with: {
        userAchievements: {
          where: eq(schema.userAchievements.userId, Number(userId)),
        },
      },
      where: and(...sqlQuery),
      orderBy: sql`
        CASE 
          WHEN difficulty = 'easy' THEN 1
          WHEN difficulty = 'medium' THEN 2
          WHEN difficulty = 'hard' THEN 3
          ELSE 4
        END ASC
        `,
      limit: Number(query.limit ?? 5),
      offset: offset,
    });

    res.json({
      status: 'ok',
      data: achievements,
      meta: {
        total,
        limit: result.data.limit,
        page: result.data.page,
        offset,
      },
    });
  } catch (error) {
    next(error);
  }
};
