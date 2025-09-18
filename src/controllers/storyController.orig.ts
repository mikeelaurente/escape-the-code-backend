import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import * as schema from '../db/schema';
import { and, asc, eq } from 'drizzle-orm';
import { runWithDenoWindows, CodeTest } from '../runners/deno.runner';
import { createSelectSchema } from 'drizzle-zod';
import z from 'zod';

export const createStories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const title = req.body.title;
    const description = req.body.description;
    const rewardOptions = req.body.rewardOptions;
  } catch (error) {
    next(error);
  }
};

export const getStories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.session.userId);
    const story = await db().query.stories.findFirst({
      with: {
        progress: {
          where: eq(schema.storyProgress.userId, userId),
        },
        chapters: {
          with: {
            sections: {
              with: {
                challenges: true,
              },
              orderBy: asc(schema.sections.order),
            },
          },
          orderBy: asc(schema.chapters.order),
        },
      },
    });

    if (!story) {
      return res.json([]);
    }

    type Section = typeof schema.sections.$inferInsert & {
      locked: boolean;
      completed: boolean;
    };
    type Chapter = typeof schema.chapters.$inferInsert & {
      sections: Section[];
    };
    type Story = typeof schema.stories.$inferSelect & { chapters: Chapter[] };

    const completedSections = story.progress.map((p) => p.sectionId);
    const allSections: Section[] = story.chapters
      .map((c) =>
        c.sections.map((s) => ({
          ...s,
          locked: true,
          completed: completedSections.includes(s.id),
        })),
      )
      .flat();
    const allChapters = story.chapters;

    const completedSectionsWithDetails = story.progress.map((c) => {
      const section = allSections.find((s) => s.id === c.sectionId);
      if (section) {
        const sectionDetails = section;
        return {
          progress: c,
          details: sectionDetails,
        };
      }
    });

    let lastCompleted = completedSectionsWithDetails
      .map((c) => Number(`${c?.details?.chapterId}.${c?.details?.order}`))
      .reduce((a, b) => Math.max(a, b), 0);

    let nextSectionChapter = story.chapters
      .map((c) => c.id)
      .reduceRight((a, b) => Math.min(a, b));
    let nextSectionOrder = 1;
    if (lastCompleted > 0) {
      const sectionParts = lastCompleted.toString().split('.');
      nextSectionChapter = Number(sectionParts[0]);
      nextSectionOrder = Number(sectionParts[1]) + 1;
      const chapter = allChapters.find((c) => c.id === nextSectionChapter);
      if (chapter) {
        if (chapter.sections.length <= nextSectionOrder) {
          nextSectionOrder = 1;
          nextSectionChapter += 1;
        }
      }
    }

    const nextSection = allSections.find((s) => {
      return s.order == nextSectionOrder && s.chapterId == nextSectionChapter;
    });

    for (let section of Object.values(allSections)) {
      if (
        !(
          nextSection &&
          (Number(section.chapterId) > Number(nextSection.chapterId) ||
            (nextSection.order < section.order &&
              nextSection.chapterId == section.chapterId))
        )
      ) {
        section.locked = false;
      }
    }

    type StoryDto = {
      id: Story['id'];
      title: Story['title'];
      description: Story['description'];
      chapters: ChapterDto[];
    };

    type ChapterDto = {
      id: Chapter['id'];
      storyId: Chapter['storyId'];
      order: Chapter['order'];
      title: Chapter['title'];
      sections: SectionDto[];
    };

    type SectionDto = {
      id: Section['id'];
      chapterId: Section['chapterId'];
      order: Section['order'];
      title: Section['title'];
      locked: boolean;
      completed: boolean;
    };

    const response: StoryDto = {
      id: story.id,
      title: story.title,
      description: story.description,
      chapters: story.chapters.map((c) => ({
        id: c.id,
        order: c.order,
        storyId: c.storyId,
        title: c.title,
        sections: c.sections.map((s): SectionDto => {
          const modifiedSection = allSections.find((x) => x.id == s.id);
          if (modifiedSection) {
            return {
              id: modifiedSection.id,
              chapterId: modifiedSection.chapterId,
              order: modifiedSection.order,
              title: modifiedSection.title,
              locked: modifiedSection.locked,
              completed: modifiedSection.completed,
            };
          }
          return {
            id: s.id,
            chapterId: s.chapterId,
            order: s.order,
            title: s.title,
            locked: true,
            completed: false,
          };
        }),
      })),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getChallengeHints = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const challengeId = parseInt(req.params.id || '');

  const challengeHints = await db().query.challengeHints.findMany({
    where: eq(schema.challengeHints.challengeId, challengeId),
    columns: {
      challengeId: true,
      cost: true,
      displayText: true,
      id: true,
    },
  });

  if (!challengeHints) {
    res.status(404).json({ message: 'Hints not found' });
    return;
  }
  res.json(challengeHints);
};

export const getSection = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const sectionId = parseInt(req.params.id || '');
  const userId = Number(req.session.userId);

  const section = await db().query.sections.findFirst({
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
        // with: {
        //   answers: {
        //     where: eq(schema.challengeAnswers.userId, userId),
        //     columns: {
        //       createdAt: true,
        //       result: true,
        //     },
        //   },
        // },
      },
      storyProgress: true,
    },
  });

  if (!section) {
    res.status(404).json({ message: 'Section not found' });
    return;
  }
  res.json(section);
};

export const buyHint = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const hintId = req.body.hintId;
  const currentUserId = Number(req.session.userId);

  const challengeHint = await db().query.challengeHints.findFirst({
    where: eq(schema.challengeHints.id, hintId),
  });

  if (!challengeHint) {
    res.status(404).json({ message: 'Hint not found' });
    return;
  }

  const usedHint = await db().query.creditUsage.findFirst({
    where: and(
      eq(schema.creditUsage.userId, currentUserId),
      eq(schema.creditUsage.challengeHintId, hintId),
    ),
  });

  if (usedHint) {
    return res.json({
      alreadyUsed: true,
      hint: challengeHint,
    });
  }

  const userCredits = await db().query.userCredits.findFirst({
    where: eq(schema.userCredits.userId, currentUserId),
  });

  if (!userCredits) {
    res.status(404).json({ message: 'Credits not found' });
    return;
  }
  if (userCredits?.value < challengeHint.cost) {
    res.status(404).json({ message: 'Not enough credits' });
    return;
  }

  const newCredit = userCredits?.value - challengeHint.cost;

  await db()
    .update(schema.userCredits)
    .set({
      value: newCredit,
    })
    .where(eq(schema.userCredits.userId, currentUserId));

  await db().insert(schema.creditUsage).values({
    userId: currentUserId,
    challengeHintId: hintId,
    cost: challengeHint.cost,
  });

  res.json({
    remainingCredits: newCredit,
    purchasedHint: challengeHint,
  });
};

export const submitAnswer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const challengeId = parseInt(req.params.id || '');
  const answer = decodeURIComponent(req.body.answer);
  const userId = Number(req.session.userId);

  const challenge = await db().query.challenges.findFirst({
    where: eq(schema.challenges.id, challengeId),
  });

  const codeTests = JSON.parse(challenge?.expectedOutput || '[]') as CodeTest[];

  const runnerResponse = await runWithDenoWindows({
    code: answer,
    tests: codeTests,
    timeoutMs: 3000,
    heapMb: 256,
    softenCpu: false,
  });

  console.log('runnerResponse', runnerResponse);

  const passed =
    runnerResponse.status === 'ok' && runnerResponse.results.every((x) => x.ok);

  let codeOutput = '';

  if (runnerResponse.status === 'ok') {
    codeOutput = JSON.stringify(runnerResponse.results);
  } else if (runnerResponse.status === 'crash') {
    codeOutput = runnerResponse.detail || 'error';
  } else if (
    runnerResponse.status === 'killed' ||
    runnerResponse.status === 'timeout'
  ) {
    codeOutput = runnerResponse.detail || 'timeout';
  } else if (runnerResponse.status === 'oom') {
    codeOutput = runnerResponse.detail || 'out of memory';
  } else if (runnerResponse.status === 'parse_error') {
    codeOutput = runnerResponse.detail || 'syntax error';
  }

  await db()
    .insert(schema.challengeAnswers)
    .values({
      userId,
      challengeId,
      code: answer,
      result: passed ? 'passed' : 'failed',
      metadata: JSON.stringify(runnerResponse),
      codeOutput,
    });

  if (passed) {
    const challengeWithDetails = await db().query.challenges.findFirst({
      where: eq(schema.challenges.id, challengeId),
      with: {
        section: {
          with: {
            chapter: {
              with: {
                story: true,
              },
            },
          },
        },
      },
    });
    // check if already inserted to story progress
    const inserted = await db().query.storyProgress.findFirst({
      where: and(
        eq(schema.storyProgress.userId, userId),
        eq(
          schema.storyProgress.sectionId,
          Number(challengeWithDetails?.sectionID),
        ),
      ),
    });
    if (!inserted) {
      await db().insert(schema.storyProgress).values({
        storyId: challengeWithDetails?.section?.chapter?.storyId,
        chapterId: challengeWithDetails?.section?.chapterId,
        sectionId: challengeWithDetails?.sectionID,
        userId,
      });
    }
  }

  res.json(runnerResponse);
};
