import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { asc, eq } from 'drizzle-orm';
import { getNextSectionFor } from '../../../db/repositories/story.repository';

export const getStoryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.user?.id);
    const story = await db.query.stories.findFirst({
      with: {
        progress: {
          where: eq(schema.storyProgress.userId, userId),
        },
        chapters: {
          with: {
            sections: {
              columns: {
                id: true,
              },
              with: {
                storyProgress: {
                  columns: {
                    id: true,
                    createdAt: true,
                  },
                },
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

    const assignedSection = await getNextSectionFor(userId);

    const response = {
      id: story.id,
      title: story.title,
      description: story.description,
      progress: story.progress,
      chapters: story.chapters.map((c) => ({
        id: c.id,
        order: c.order,
        storyId: c.storyId,
        title: c.title,
        sections: c.sections,
        rewardOptions: c.rewardOptions,
        completed: c.id < assignedSection.chapterId,
        locked: c.id > assignedSection.chapterId,
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
