import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { asc, eq, and } from 'drizzle-orm';
import { getNextSectionFor } from '../../../db/repositories/story.repository';
import { isFirstSectionGreaterThanOrSame } from '../../../helpers/section.helper';

export const getChapterSectionsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.user?.id);
    const chapterId = Number(req.params.chapter);
    const story = await db.query.stories.findFirst({});
    const progress = await db.query.storyProgress.findMany({
      where: and(
        eq(schema.storyProgress.userId, userId),
        eq(schema.storyProgress.storyId, Number(story?.id)),
      ),
      with: {
        section: true,
      },
    });
    const chapter = await db.query.chapters.findFirst({
      where: eq(schema.chapters.id, chapterId),
      with: {
        sections: {
          orderBy: asc(schema.sections.order),
        },
      },
    });

    if (!chapter) {
      return res.json({
        status: 'not_found',
        error: 'Chapter not found',
      });
    }

    const completedSections = progress.map((p) => p.sectionId);
    const assignedSection = await getNextSectionFor(userId);

    const allSections = chapter.sections.map((s) => {
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
        locked: modifiedSection.locked,
        completed: modifiedSection.completed,
        description: modifiedSection.description,
      };
    });

    res.json({
      status: 'ok',
      data: {
        ...chapter,
        sections: allSections,
      },
    });
  } catch (error) {
    next(error);
  }
};
