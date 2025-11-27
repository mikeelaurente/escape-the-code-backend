import { Request, Response, NextFunction } from 'express';
import {
  getSectionAnswersWithHints,
  getUserRankingFor,
} from '../../../db/repositories/user.repository';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { and, desc, eq } from 'drizzle-orm';

export const getCourseProgressHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.user?.id);
    const courseId = Number(req.params.course);

    const course = await db.query.courses.findFirst({
      where: eq(schema.courses.id, courseId),
    });

    if (!course) {
      return res.json({
        status: 'error',
        message: 'Course not found',
      });
    }

    const sectionAnswersWithHints = await getSectionAnswersWithHints(
      userId,
      courseId,
    );

    return res.json({
      status: 'ok',
      data: {
        progress: {
          data: sectionAnswersWithHints.data,
          grouped: Object.values(sectionAnswersWithHints.grouped),
        },
        course,
      },
    });
  } catch (e) {
    return next(e);
  }
};
