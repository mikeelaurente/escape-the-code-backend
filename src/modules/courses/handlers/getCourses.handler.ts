import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { and, asc, desc, eq, like, or, SQL } from 'drizzle-orm';
import { getNextSectionFor } from '../../../db/repositories/story.repository';
import { CourseDto, CoursesQueryParamsSchema } from '../../../types/course';
import { extractValidationErrors } from '../../../helpers/validation.helper';
import QueryString from 'qs';
import {
  resolveChapterImage,
  resolveCourseImage,
  resolveImage,
} from '../../../helpers/image.helper';

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
    let order = asc(schema.courses.id);

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
      columns: {
        id: true,
        title: true,
        description: true,
        coverImage: true,
        createdAt: true,
        updatedAt: true,
      },
      with: {
        progress: {
          where: eq(schema.courseProgress.userId, userId),
        },
        chapters: {
          columns: {
            id: true,
            title: true,
            description: true,
            coverImage: true,
            order: true,
            rewardPoints: true,
            creditPoints: true,
            tags: true,
            courseId: true,
          },
        },
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

    const assignedSections: any = {};
    for (const cour of courses) {
      const assignedSection = await getNextSectionFor(userId, cour.id);
      assignedSections[cour.id] = assignedSection;
    }

    const response = courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      coverImage: resolveCourseImage(course.coverImage || 'default'),
      progress: course.progress,
      chapters: course.chapters.map((c) => ({
        ...c,
        coverImage: resolveChapterImage(c.coverImage || 'default'),
        completed: assignedSections[course.id].chapterId
          ? c.id < assignedSections[course.id].chapterId
          : true,
        locked: assignedSections[course.id].chapterId
          ? c.id > assignedSections[course.id].chapterId
          : false,
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
