import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../db';
import * as T from '../db/schema';

// ───────────────────────────────────────────────────────────────────────────────
// Utilities
// ───────────────────────────────────────────────────────────────────────────────

function normalizeUTCDate(d: Date) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}
function sameUTC(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}
function prevDayUTC(d: Date) {
  const c = new Date(d);
  c.setUTCDate(c.getUTCDate() - 1);
  return c;
}

// Extract solved answer context once and reuse.
async function getSolvedAnswerContext(answerId: number) {
  const ans = await db.query.challengeAnswers.findFirst({
    where: eq(T.challengeAnswers.id, answerId),
    with: { challenge: true },
  });
  if (!ans) throw new Error('challenge_answers row not found');

  if (ans.status !== 1 /* Completed */ || !ans.completedAt) {
    throw new Error('Answer is not completed');
  }

  const { userId, challengeId, createdAt, completedAt } = ans;
  const ch = await db.query.challenges.findFirst({
    where: eq(T.challenges.id, challengeId!),
    with: { section: { with: { chapter: true } } },
  });
  if (!ch || !ch.section || !ch.section.chapter)
    throw new Error('Challenge relations missing');

  // Wrong attempts for THIS answer
  const wrongAttempts = await db
    .select({ c: sql<number>`COUNT(*)`.as('c') })
    .from(T.challengeAnswerSubmissions)
    .where(
      and(
        eq(T.challengeAnswerSubmissions.challengeAnswerId, answerId),
        eq(T.challengeAnswerSubmissions.result, 'failed'),
      ),
    );

  // Hints used for THIS challenge in the time window of this answer
  const hintsUsedRows = await db
    .select({ c: sql<number>`COUNT(*)`.as('c') })
    .from(T.hintUsages)
    .where(
      and(
        eq(T.hintUsages.userId, userId!),
        eq(T.hintUsages.challengeId, challengeId!),
        // Between createdAt and completedAt for this answer
        sql`created_at >= ${createdAt} AND created_at <= ${completedAt}`,
      ),
    );

  return {
    userId,
    challengeId,
    sectionId: ch.sectionID,
    chapterId: ch.section.chapterId,
    chapterTitle: ch.section.chapter.title,
    createdAt: ans.createdAt,
    completedAt: ans.completedAt!,
    wrongAttempts: Number(wrongAttempts[0]!.c ?? 0),
    usedHints: Number(hintsUsedRows[0]!.c ?? 0),
  };
}

// Award achievement once; give credits; log credit tx.
async function awardAchievementOnce(userId: number, achievementId: number) {
  // Already awarded?
  const existing = await db.query.userAchievements.findFirst({
    where: and(
      eq(T.userAchievements.userId, userId),
      eq(T.userAchievements.achievementId, achievementId),
    ),
  });
  if (existing) return false;

  // Insert award
  await db.insert(T.userAchievements).values({
    userId,
    achievementId,
    awardedAt: new Date(),
  });

  // Pull points to credit wallet + log
  const ach = await db.query.achievements.findFirst({
    where: eq(T.achievements.id, achievementId),
  });
  if (ach && ach.creditPoints > 0) {
    await db.transaction(async (tx) => {
      // increment wallet
      await tx
        .update(T.users)
        .set({ credits: sql`${T.users.credits} + ${ach.creditPoints}` })
        .where(eq(T.users.id, userId));

      // log transaction
      await tx.insert(T.creditTransactions).values({
        userId,
        title: `Achievement: ${ach.title}`,
        type: 'in',
        group: 'reward',
        referenceId: achievementId,
        amount: ach.creditPoints,
      });
    });
  }
  return true;
}

// ───────────────────────────────────────────────────────────────────────────────
// Rule evaluators (use ONLY your existing tables)
// ───────────────────────────────────────────────────────────────────────────────

async function eval_streak(
  userId: number,
  length: number,
  withoutWrong?: boolean,
  chapterOrder?: number,
) {
  // Latest N completed answers (any chapter)
  const rows = await db
    .select({
      id: T.challengeAnswers.id,
      challengeId: T.challengeAnswers.challengeId,
      createdAt: T.challengeAnswers.createdAt,
      completedAt: T.challengeAnswers.completedAt,
    })
    .from(T.challengeAnswers)
    .where(
      and(
        eq(T.challengeAnswers.userId, userId),
        eq(T.challengeAnswers.status, 1), // Completed
      ),
    )
    .orderBy(desc(T.challengeAnswers.completedAt))
    .limit(length);

  if (rows.length < length) return false;

  if (chapterOrder) {
    const firstRow = rows[0];
    const challengeAnswerChapterId = await db
      .select({ chapterId: T.chapters.id })
      .from(T.challenges)
      .leftJoin(T.sections, eq(T.challenges.sectionID, T.sections.id))
      .leftJoin(T.chapters, eq(T.sections.chapterId, T.chapters.id))
      .where(eq(T.challenges.id, firstRow!.challengeId!))
      .limit(1);

    const chapterId = challengeAnswerChapterId[0]!.chapterId;
    const chapter = await db.query.chapters.findFirst({
      where: eq(T.chapters.order, chapterOrder),
    });
    if (chapter?.id !== chapterId) {
      return false;
    }
  }

  if (withoutWrong) {
    // Ensure each of the N had zero failures before completion
    for (const r of rows) {
      const fails = await db
        .select({ c: sql<number>`COUNT(*)`.as('c') })
        .from(T.challengeAnswerSubmissions)
        .where(
          and(
            eq(T.challengeAnswerSubmissions.challengeAnswerId, r.id),
            eq(T.challengeAnswerSubmissions.result, 'failed'),
          ),
        );
      if (Number(fails[0]!.c ?? 0) > 0) return false;
    }
  }
  return true;
}

async function eval_no_hints_streak(userId: number, length: number) {
  // Latest N completed answers; ensure 0 hints for their challenge during that answer window
  const answers = await db
    .select({
      id: T.challengeAnswers.id,
      challengeId: T.challengeAnswers.challengeId,
      createdAt: T.challengeAnswers.createdAt,
      completedAt: T.challengeAnswers.completedAt,
    })
    .from(T.challengeAnswers)
    .where(
      and(
        eq(T.challengeAnswers.userId, userId),
        eq(T.challengeAnswers.status, 1),
      ),
    )
    .orderBy(desc(T.challengeAnswers.completedAt))
    .limit(length);

  if (answers.length < length) return false;

  for (const a of answers) {
    const hints = await db
      .select({ c: sql<number>`COUNT(*)`.as('c') })
      .from(T.hintUsages)
      .where(
        and(
          eq(T.hintUsages.userId, userId),
          eq(T.hintUsages.challengeId, a.challengeId!),
          sql`created_at >= ${a.createdAt} AND created_at <= ${a.completedAt}`,
        ),
      );
    if (Number(hints[0]!.c ?? 0) !== 0) return false;
  }
  return true;
}

async function eval_no_hints_total(userId: number, count: number) {
  // Count completed answers with zero hints in their window
  const answers = await db
    .select({
      id: T.challengeAnswers.id,
      challengeId: T.challengeAnswers.challengeId,
      createdAt: T.challengeAnswers.createdAt,
      completedAt: T.challengeAnswers.completedAt,
    })
    .from(T.challengeAnswers)
    .where(
      and(
        eq(T.challengeAnswers.userId, userId),
        eq(T.challengeAnswers.status, 1),
      ),
    );

  let good = 0;
  for (const a of answers) {
    const hints = await db
      .select({ c: sql<number>`COUNT(*)`.as('c') })
      .from(T.hintUsages)
      .where(
        and(
          eq(T.hintUsages.userId, userId),
          eq(T.hintUsages.challengeId, a.challengeId!),
          sql`created_at >= ${a.createdAt} AND created_at <= ${a.completedAt}`,
        ),
      );
    if (Number(hints[0]!.c ?? 0) === 0) good++;
    if (good >= count) return true;
  }
  return false;
}

async function eval_time_under_seconds(
  answerId: number,
  seconds: number,
  chapterOrder?: number,
) {
  const a = await db.query.challengeAnswers.findFirst({
    where: eq(T.challengeAnswers.id, answerId),
  });
  if (!a || !a.completedAt) return false;
  const dur = (a.completedAt.getTime() - a.createdAt.getTime()) / 1000;
  if (chapterOrder) {
    const challengeAnswerChapterId = await db
      .select({ chapterId: T.chapters.id })
      .from(T.challenges)
      .leftJoin(T.sections, eq(T.challenges.sectionID, T.sections.id))
      .leftJoin(T.chapters, eq(T.sections.chapterId, T.chapters.id))
      .where(eq(T.challenges.id, a.challengeId!))
      .limit(1);

    const chapterId = challengeAnswerChapterId[0]!.chapterId;
    const chapter = await db.query.chapters.findFirst({
      where: eq(T.chapters.order, chapterOrder),
    });
    if (chapter?.id !== chapterId) {
      return false;
    }
  }

  return dur <= seconds;
}

async function eval_chapter_perfect(userId: number, chapterTitle: string) {
  // All challenges in the chapter completed with 0 wrong and 0 hints in their windows
  const chapter = await db.query.chapters.findFirst({
    where: eq(T.chapters.title, chapterTitle),
    with: { sections: { with: { challenges: true } } },
  });
  if (!chapter) return false;

  const chIds = chapter.sections.flatMap((s) => s.challenges.map((c) => c.id));
  if (chIds.length === 0) return false;

  // For each challenge, find a completed answer and verify constraints
  for (const cid of chIds) {
    const ans = await db
      .select()
      .from(T.challengeAnswers)
      .where(
        and(
          eq(T.challengeAnswers.userId, userId),
          eq(T.challengeAnswers.challengeId, cid),
          eq(T.challengeAnswers.status, 1),
        ),
      )
      .orderBy(desc(T.challengeAnswers.completedAt))
      .limit(1);

    if (ans.length === 0) return false;
    const a = ans[0];
    // wrong attempts for this answer
    const fails = await db
      .select({ c: sql<number>`COUNT(*)`.as('c') })
      .from(T.challengeAnswerSubmissions)
      .where(
        and(
          eq(T.challengeAnswerSubmissions.challengeAnswerId, a!.id),
          eq(T.challengeAnswerSubmissions.result, 'failed'),
        ),
      );
    if (Number(fails[0]!.c ?? 0) > 0) return false;

    // hints during this answer window
    const hints = await db
      .select({ c: sql<number>`COUNT(*)`.as('c') })
      .from(T.hintUsages)
      .where(
        and(
          eq(T.hintUsages.userId, userId),
          eq(T.hintUsages.challengeId, cid),
          sql`created_at >= ${a!.createdAt} AND created_at <= ${a!.completedAt}`,
        ),
      );
    if (Number(hints[0]!.c ?? 0) > 0) return false;
  }
  return true;
}

async function eval_limited_hints_per_challenge(
  userId: number,
  maxHints: number,
  count: number,
) {
  // Count completed answers where hints used in the window <= maxHints
  const answers = await db
    .select({
      id: T.challengeAnswers.id,
      challengeId: T.challengeAnswers.challengeId,
      createdAt: T.challengeAnswers.createdAt,
      completedAt: T.challengeAnswers.completedAt,
    })
    .from(T.challengeAnswers)
    .where(
      and(
        eq(T.challengeAnswers.userId, userId),
        eq(T.challengeAnswers.status, 1),
      ),
    );

  let ok = 0;
  for (const a of answers) {
    const hints = await db
      .select({ c: sql<number>`COUNT(*)`.as('c') })
      .from(T.hintUsages)
      .where(
        and(
          eq(T.hintUsages.userId, userId),
          eq(T.hintUsages.challengeId, a.challengeId!),
          sql`created_at >= ${a.createdAt} AND created_at <= ${a.completedAt}`,
        ),
      );
    if (Number(hints[0]!.c ?? 0) <= maxHints) {
      ok++;
      if (ok >= count) return true;
    }
  }
  return false;
}

async function eval_daily_active_streak(userId: number, daysRequired: number) {
  // Distinct UTC dates with any challenge_answers row
  const raw = await db.execute(sql`
    SELECT DISTINCT DATE(CONVERT_TZ(created_at, '+00:00', '+00:00')) AS d
    FROM challenge_answers
    WHERE user_id = ${userId}
    ORDER BY d DESC
  `);
  const dates = raw.map((r: any) => new Date(r.d));
  if (dates.length === 0) return false;

  // current streak counting back from most-recent day
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = dates[i - 1];
    const cur = dates[i];
    const want = prevDayUTC(prev!);
    if (sameUTC(cur!, prev!)) continue; // safety for duplicates
    if (sameUTC(cur!, want)) {
      streak++;
    } else {
      break;
    }
  }
  return streak >= daysRequired;
}

// ───────────────────────────────────────────────────────────────────────────────
// Orchestration
// ───────────────────────────────────────────────────────────────────────────────

export async function onChallengeCompleted(answerId: number) {
  const ctx = await getSolvedAnswerContext(answerId);

  // Pull ALL achievements (each has a single rule)
  const all = await db.select().from(T.achievements);
  const achievementsAwarded: string[] = [];

  for (const a of all) {
    const r = a.rule;
    if (!r) continue;

    let satisfied = false;
    switch (r.type) {
      case 'streak':
        satisfied = await eval_streak(
          ctx.userId!,
          r.length,
          r.withoutWrong,
          r.chapterOrder,
        );
        break;

      case 'no_hints_streak':
        satisfied = await eval_no_hints_streak(ctx.userId!, r.length);
        break;

      case 'no_hints_total':
        satisfied = await eval_no_hints_total(ctx.userId!, r.count);
        break;

      case 'time_to_solve_under_seconds':
        satisfied = await eval_time_under_seconds(
          answerId,
          r.seconds,
          r.chapterOrder,
        );
        break;

      case 'chapter_perfect':
        satisfied = await eval_chapter_perfect(ctx.userId!, r.chapterTitle);
        break;

      case 'limited_hints_per_challenge':
        satisfied = await eval_limited_hints_per_challenge(
          ctx.userId!,
          r.maxHints,
          r.count,
        );
        break;

      case 'daily_active_streak':
        // Only award on “activity” (this solve counts as activity)
        satisfied = await eval_daily_active_streak(ctx.userId!, r.days);
        break;

      case 'community_solution_shared':
        // Not evaluated here. Use onCommunitySolutionApproved.
        satisfied = false;
        break;
    }

    if (satisfied) {
      const awarded = await awardAchievementOnce(ctx.userId!, a.id);
      if (awarded) {
        achievementsAwarded.push(a.code);
      }
    }
  }

  return achievementsAwarded;
}

// Community approval: pass updated approved count (since there’s no dedicated table)
export async function onCommunitySolutionApproved(args: {
  userId: number;
  approvedTotalCount: number;
}) {
  const all = await db.select().from(T.achievements);
  for (const a of all) {
    const r = a.rule;
    if (!r || r.type !== 'community_solution_shared') continue;
    if (r.approved && args.approvedTotalCount >= r.count) {
      await awardAchievementOnce(args.userId, a.id);
    }
  }
}

// Leaderboard points (no new table needed)
export async function getUserTotalRewardPoints(userId: number) {
  // Sum achievements reward points (earned)
  const achRows = await db.execute(sql`
    SELECT COALESCE(SUM(a.reward_points), 0) AS rp
    FROM user_achievements ua
    JOIN achievements a ON a.id = ua.achievement_id
    WHERE ua.user_id = ${userId}
  `);
  const achPoints = Number((achRows[0] as any).rp ?? 0);

  // Sum challengeAnswers.rewardPoints (you already store them there)
  const chRows = await db.execute(sql`
    SELECT COALESCE(SUM(reward_points), 0) AS rp
    FROM challenge_answers
    WHERE user_id = ${userId} AND status = 1
  `);
  const challengePoints = Number((chRows[0] as any).rp ?? 0);

  // If you also give chapter/section bonuses, sum them from credit_transactions or create a small table.
  return achPoints + challengePoints;
}
