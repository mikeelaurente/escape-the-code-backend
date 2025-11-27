import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { and, asc, desc, eq, like, or, SQL } from 'drizzle-orm';
import { getNextSectionFor } from '../../../db/repositories/story.repository';
import { CourseDto, CoursesQueryParamsSchema } from '../../../types/course';
import { extractValidationErrors } from '../../../helpers/validation.helper';
import QueryString from 'qs';

export const getCoursesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.user?.id);

    const url = new URL(req.host + req.originalUrl);
    const queryParams = QueryString.parse(url?.searchParams.toString() || '');

    const result = CoursesQueryParamsSchema.safeParse(queryParams);
    if (!result.success) {
      return res.json({
        status: 'error',
        errors: extractValidationErrors(result),
      });
    }

    const query = result.data;
    const sql: SQL<unknown>[] = [];
    let order = desc(schema.courses.id);

    if (query.sort && query.sort.name && query.sort.name.trim().length > 0) {
      const whitelisted = {
        id: schema.courses.id,
        title: schema.courses.title,
      };
      type keys = keyof typeof whitelisted;
      if (Object.keys(whitelisted).includes(query.sort.name)) {
        const k = query.sort.name as keys;
        order =
          query.sort.order === 'asc'
            ? asc(whitelisted[k])
            : desc(whitelisted[k]);
      }
    }

    if (query.search && query.search.trim().length > 0) {
      sql.push(
        or(like(schema.courses.title, `%${query.search}%`)) as SQL<unknown>,
      );
    }

    const total = await db.$count(schema.courses, and(...sql));

    const offset = Number(query.limit * (query.page - 1));
    const courses = await db.query.courses.findMany({
      with: {
        progress: {
          where: eq(schema.courseProgress.userId, userId),
        },
        chapters: true,
      },
      where: and(...sql),
      orderBy: order,
      limit: Number(query.limit ?? 5),
      offset: offset,
    });

    courses.forEach((course) =>
      course.chapters.forEach((chapter) => {
        (chapter as any).courseProgress = course.progress
          .filter((p) => p.chapterId == chapter.id)
          .map((sp) => ({ id: sp.id, createdAt: sp.createdAt }))
          .shift();
      }),
    );

    const assignedSection = await getNextSectionFor(userId);

    const response = courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      progress: course.progress,
      chapters: course.chapters.map((c) => ({
        ...c,
        completed: assignedSection.id ? c.id < assignedSection.chapterId : true,
        locked: assignedSection.id ? c.id > assignedSection.chapterId : false,
      })),
    }));

    res.json({
      status: 'ok',
      data: response,
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
