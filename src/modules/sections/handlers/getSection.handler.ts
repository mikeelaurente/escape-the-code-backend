import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { getNextSectionFor } from '../../../db/repositories/story.repository';
import { isFirstSectionGreaterThanOrSame } from '../../../helpers/section.helper';
import { resolveSectionImage } from '../../../helpers/image.helper';

export const getSectionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const sectionId = parseInt(req.params.id || '');
  const userId = Number(req.user?.id);

  const selectedSection = await db.query.sections.findFirst({
    where: eq(schema.sections.id, sectionId),
    columns: {
      id: true,
      title: true,
      description: true,
      coverImage: true,
      content: true,
      order: true,
      runnables: true,
      trivias: true,
      additionalResources: true,
      rewardPoints: true,
      creditPoints: true,
      chapterId: true,
      createdAt: true,
      updatedAt: true,
    },
    with: {
      chapter: {
        columns: {
          id: true,
          title: true,
          courseId: true,
          coverImage: true,
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
          type: true,
          choices: true,
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
      courseProgress: true,
    },
  });

  if (!selectedSection) {
    res.status(404).json({ status: 'error', message: 'Section not found' });
    return;
  }

  const courseId = selectedSection?.chapter.courseId!;
  const assignedSection = await getNextSectionFor(userId, courseId);

  if (
    assignedSection.id &&
    !isFirstSectionGreaterThanOrSame(assignedSection, selectedSection)
  ) {
    return res.json({
      status: 'error',
      message: selectedSection?.title + ' is locked',
    });
  }

  (selectedSection as any).locked = false;

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

    // Parse and shuffle choices if challenge is multiple choice
    if (challenge.type === 'multiple_choice' && challenge.choices) {
      try {
        let parsedChoices = JSON.parse(challenge.choices);

        // Remove isCorrect property from each choice
        parsedChoices = parsedChoices.map((choice: any) => {
          const { isCorrect, ...rest } = choice;
          return rest;
        });

        // Shuffle the choices using Fisher-Yates algorithm
        for (let i = parsedChoices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [parsedChoices[i], parsedChoices[j]] = [
            parsedChoices[j],
            parsedChoices[i],
          ];
        }

        (challenge as any).choices = parsedChoices;
      } catch (error) {
        console.error('Error parsing choices:', error);
        (challenge as any).choices = null;
      }
    }

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

      nextSection = await getNextSectionFor(userId, courseId);
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
      coverImage: resolveSectionImage(selectedSection.coverImage || 'default'),
      creditUsages,
      nextSection: nextSection && {
        id: nextSection.id,
        chapterId: nextSection.chapterId,
        title: nextSection.title,
      },
    },
  });
};
