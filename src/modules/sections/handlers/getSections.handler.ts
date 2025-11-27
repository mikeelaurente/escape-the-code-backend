import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { and, asc, desc, eq, like, or, SQL } from 'drizzle-orm';
import { getNextSectionFor } from '../../../db/repositories/story.repository';
import { extractValidationErrors } from '../../../helpers/validation.helper';
import { SectionsQueryParamsSchema } from '../../../types/section';
import QueryString from 'qs';
import { isFirstSectionGreaterThanOrSame } from '../../../helpers/section.helper';

export const getSectionsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.user?.id);

    const url = new URL(req.host + req.originalUrl);
    const queryParams = QueryString.parse(url?.searchParams.toString() || '');

    const result = SectionsQueryParamsSchema.safeParse(queryParams);
    if (!result.success) {
      return res.json({
        status: 'error',
        errors: extractValidationErrors(result),
      });
    }

    console.log('data', result.data);

    const query = result.data;
    const sql: SQL<unknown>[] = [];
    let order = desc(schema.sections.id);

    if (query.sort && query.sort.name && query.sort.name.trim().length > 0) {
      const whitelisted = {
        id: schema.sections.id,
        title: schema.sections.title,
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
        or(like(schema.sections.title, `%${query.search}%`)) as SQL<unknown>,
      );
    }

    if (query.filters?.chapterId && query.filters.chapterId > 0) {
      sql.push(eq(schema.sections.chapterId, query.filters.chapterId));
    }

    const total = await db.$count(schema.sections, and(...sql));

    const offset = Number(query.limit * (query.page - 1));
    const sections = await db.query.sections.findMany({
      where: and(...sql),
      orderBy: order,
      limit: Number(query.limit ?? 5),
      offset: offset,
    });

    const progress = await db.query.courseProgress.findMany({
      where: and(
        eq(schema.courseProgress.userId, userId),
        query.filters?.courseId
          ? eq(schema.courseProgress.courseId, Number(query.filters?.courseId))
          : undefined,
      ),
    });

    const completedSections = progress.map((p) => p.sectionId);
    const assignedSection = await getNextSectionFor(userId);

    const allSections = sections.map((s) => {
      const modifiedSection = {
        ...s,
        locked: true,
        completed: completedSections.includes(s.id),
      };

      if (isFirstSectionGreaterThanOrSame(assignedSection, s)) {
        modifiedSection.locked = false;
      }

      return {
        id: modifiedSection.id,
        title: modifiedSection.title,
        locked: assignedSection.id ? modifiedSection.locked : false,
        completed: assignedSection.id ? modifiedSection.completed : true,
        description: modifiedSection.description,
        chapterId: s.chapterId,
      };
    });

    res.json({
      status: 'ok',
      data: allSections,
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
