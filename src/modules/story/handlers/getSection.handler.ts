import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { getNextSectionFor } from '../../../db/repositories/story.repository';
import { isFirstSectionGreaterThanOrSame } from '../../../helpers/section.helper';

export const getSectionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const sectionId = parseInt(req.params.id || '');
  const userId = Number(req.user?.id);

  const assignedSection = await getNextSectionFor(userId);

  const selectedSection = await db.query.sections.findFirst({
    where: eq(schema.sections.id, sectionId),
    with: {
      challenges: {
        columns: {
          id: true,
          title: true,
          description: true,
          difficulty: true,
          rewardPoints: true,
          sectionID: true,
        },
        with: {
          answers: {
            where: eq(schema.challengeAnswers.userId, userId),
            columns: {
              createdAt: true,
              result: true,
            },
          },
        },
      },
      storyProgress: true,
    },
  });

  if (!selectedSection) {
    res.status(404).json({ status: 'error', message: 'Section not found' });
    return;
  }

  if (!isFirstSectionGreaterThanOrSame(assignedSection, selectedSection)) {
    return res.json({
      status: 'error',
      message: selectedSection?.title + ' is locked',
    });
  }

  const challengeIds =
    selectedSection?.challenges.map((c) => Number(c.id)) ?? [];

  const creditUsages = await db.query.creditUsage.findMany({
    where: and(
      inArray(schema.creditUsage.challengeId, challengeIds),
      eq(schema.creditUsage.userId, userId),
    ),
    with: {
      hint: {
        columns: {
          id: true,
          hintText: true,
        },
      },
    },
  });

  res.json({
    status: 'ok',
    data: {
      ...selectedSection,
      creditUsages,
    },
  });
};
