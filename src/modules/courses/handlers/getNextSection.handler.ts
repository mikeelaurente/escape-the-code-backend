import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import * as storyRepo from '../../../db/repositories/story.repository';

export const getNextSectionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = Number(req.user?.id);

  const userCourses = await db.query.courseProgress.findMany({
    where: eq(schema.courseProgress.userId, userId),
    columns: {
      courseId: true,
    },
  });

  const coursesIds = userCourses.map((c) => Number(c.courseId));

  const nextSection = [];
  for (const courseId of coursesIds) {
    const section = await storyRepo.getNextSectionFor(userId, courseId);
    if (section) {
      nextSection.push(section);
    }
  }

  return res.json(nextSection);
};
