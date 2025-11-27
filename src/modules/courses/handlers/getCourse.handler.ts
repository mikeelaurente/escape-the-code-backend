import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { asc, eq } from 'drizzle-orm';
import { getNextSectionFor } from '../../../db/repositories/story.repository';
import { getUserRanking } from '../../../db/repositories/user.repository';

export const getCourseHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.user?.id);
    const courseId = Number(req.params.id) || 0;
    console.log('*******************************************');
    const story = await db.query.courses.findFirst({
      where: eq(schema.courses.id, courseId),
      with: {
        progress: {
          where: eq(schema.courseProgress.userId, userId),
        },
        chapters: {
          with: {
            sections: {
              columns: {
                id: true,
              },
            },
          },
          orderBy: asc(schema.chapters.order),
        },
      },
    });

    if (!story) {
      return res.json({
        status: 'not_found',
        error: 'Story not found',
      });
    }

    story.chapters.forEach((chapter) => {
      chapter.sections.forEach((section) => {
        (section as any).courseProgress = story.progress
          .filter((p) => p.sectionId == section.id)
          .map((sp) => ({ id: sp.id, createdAt: sp.createdAt }))
          .shift();
      });
    });

    const assignedSection = await getNextSectionFor(userId);
    console.log('assignedSection', assignedSection);

    const response = {
      id: story.id,
      title: story.title,
      description: story.description,
      progress: story.progress,
      chapters: story.chapters.map((c) => ({
        id: c.id,
        order: c.order,
        courseId: c.courseId,
        title: c.title,
        sections: c.sections,
        completed: assignedSection.chapterId
          ? c.id < assignedSection.chapterId
          : true,
        locked: assignedSection.chapterId
          ? c.id > assignedSection.chapterId
          : false,
      })),
    };

    res.json({
      status: 'ok',
      data: response,
    });
  } catch (error) {
    next(error);
  }
};
