import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { getNextSectionFor } from '../../../db/repositories/story.repository';
import { isFirstSectionGreaterThanOrSame } from '../../../helpers/section.helper';
import { title } from 'process';

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
      chapter: {
        columns: {
          id: true,
          title: true,
        },
      },
      challenges: {
        columns: {
          id: true,
          title: true,
          description: true,
          order: true,
          difficulty: true,
          rewardPoints: true,
          sectionID: true,
        },
        with: {
          answers: {
            where: eq(schema.challengeAnswers.userId, userId),
            columns: {
              createdAt: true,
              completedAt: true,
              feedback: true,
              status: true,
            },
            extras: {
              duration: sql`TIMESTAMPDIFF(SECOND, created_at, completed_at)`.as(
                'duration',
              ),
            },
            with: {
              submissions: {
                columns: {
                  id: true,
                  result: true,
                  code: true,
                  codeOutput: true,
                  metadata: true,
                },
              },
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

  const creditUsages = await db.query.hintUsages.findMany({
    where: and(
      inArray(schema.hintUsages.challengeId, challengeIds),
      eq(schema.hintUsages.userId, userId),
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

  let nextSection = null;

  for (let challenge of selectedSection.challenges) {
    let challengeStatus = 'none';
    if (
      challenge.answers.find(
        (x) =>
          x.status === schema.ChallengeStatus.Ongoing &&
          x.submissions.some((y) => y.result === 'passed'),
      )
    ) {
      challengeStatus = 'solved';
      const ongoingAnswer = challenge.answers.find(
        (x) => x.status === schema.ChallengeStatus.Ongoing,
      );

      const successfulSubmission = ongoingAnswer?.submissions.find(
        (x) => x.result === 'passed',
      );
      (ongoingAnswer as any).submission = {
        ...successfulSubmission,
        metadata: JSON.parse(successfulSubmission?.metadata || ''),
      };
      (challenge as any).ongoingAnswer = ongoingAnswer;
    } else if (
      challenge.answers.find(
        (x) => x.status === schema.ChallengeStatus.Completed,
      )
    ) {
      challengeStatus = 'completed';
      const acceptedAnswer = challenge.answers.find(
        (x) => x.status === schema.ChallengeStatus.Completed,
      );

      const successfulSubmission = acceptedAnswer?.submissions.find(
        (x) => x.result === 'passed',
      );
      (acceptedAnswer as any).submission = successfulSubmission;
      (challenge as any).acceptedAnswer = acceptedAnswer;

      nextSection = await getNextSectionFor(userId);
    } else if (
      challenge.answers.find((x) => x.status === schema.ChallengeStatus.Ongoing)
    ) {
      challengeStatus = 'ongoing';
    }

    (challenge as any).status = challengeStatus;
  }

  res.json({
    status: 'ok',
    data: {
      ...selectedSection,
      creditUsages,
      nextSection: nextSection && {
        id: nextSection.id,
        chapterId: nextSection.chapterId,
        title: nextSection.title,
      },
    },
  });
};
