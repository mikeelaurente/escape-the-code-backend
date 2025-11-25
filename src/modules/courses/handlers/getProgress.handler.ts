import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { getNextSectionFor } from '../../../db/repositories/story.repository';
import { isFirstSectionGreaterThanOrSame } from '../../../helpers/section.helper';

export const getProgressHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = Number(req.user?.id);

  const progress = await db.query.courseProgress.findMany({
    where: eq(schema.courseProgress.userId, userId),
    orderBy: desc(schema.courseProgress.createdAt),
    columns: {
      id: true,
      createdAt: true,
    },
    with: {
      chapter: {
        columns: {
          id: true,
          title: true,
        },
      },
      section: {
        columns: {
          id: true,
          title: true,
          description: true,
        },
      },
    },
  });

  res.json({
    status: 'ok',
    data: progress,
  });
};
