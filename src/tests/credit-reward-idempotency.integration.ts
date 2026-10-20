import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';

function countRewardRowsByEventKey(
  db: Awaited<typeof import('../db.js')>['db'],
  schema: Awaited<typeof import('../db/schema.js')>,
  userId: number,
  rewardEventKey: string,
) {
  return db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(schema.creditTransactions)
    .where(
      and(
        eq(schema.creditTransactions.userId, userId),
        eq(schema.creditTransactions.group, 'reward'),
        eq(schema.creditTransactions.type, 'in'),
        eq(schema.creditTransactions.rewardEventKey, rewardEventKey),
      ),
    );
}

async function insertRewardWithUpsert(
  db: Awaited<typeof import('../db.js')>['db'],
  schema: Awaited<typeof import('../db/schema.js')>,
  values: {
    amount: number;
    title: string;
    type: 'in' | 'out';
    group: 'hint' | 'reward';
    referenceId: number | null;
    rewardEventKey?: string | null;
    userId: number;
  },
) {
  await db
    .insert(schema.creditTransactions)
    .values(values)
    .onDuplicateKeyUpdate({
      set: {
        rewardEventKey: sql`${schema.creditTransactions.rewardEventKey}`,
      },
    });
}

async function run() {
  if (!process.env.DATABASE_URL) {
    console.log('SKIP: DATABASE_URL is not configured');
    return;
  }

  const { db } = await import('../db.js');
  const schema = await import('../db/schema.js');

  const email = `integration-${randomUUID()}@example.com`;
  const [userIdResult] = await db
    .insert(schema.users)
    .values({
      email,
      firstName: 'Integration',
      lastName: 'Test',
      userType: 'user',
      status: 'active',
    })
    .$returningId();

  const userId = userIdResult?.id;
  assert.ok(userId, 'user id should be created');

  const sharedReferenceId = Math.floor(Math.random() * 1000000) + 1;
  const otherReferenceId = sharedReferenceId + 1;

  try {
    // identical challenge reward attempts (same user + same answer)
    await insertRewardWithUpsert(db, schema, {
      amount: 100,
      title: 'Reward: Challenge A',
      type: 'in',
      group: 'reward',
      referenceId: sharedReferenceId,
      rewardEventKey: `challenge-answer:${sharedReferenceId}`,
      userId,
    });
    await insertRewardWithUpsert(db, schema, {
      amount: 100,
      title: 'Reward: Challenge A duplicate',
      type: 'in',
      group: 'reward',
      referenceId: sharedReferenceId,
      rewardEventKey: `challenge-answer:${sharedReferenceId}`,
      userId,
    });
    const [challengeDuplicateCount] = await countRewardRowsByEventKey(
      db,
      schema,
      userId,
      `challenge-answer:${sharedReferenceId}`,
    );
    assert.equal(
      Number(challengeDuplicateCount?.count ?? 0),
      1,
      'identical challenge reward attempts should produce one transaction',
    );

    // different reward sources with same numeric reference must not collide
    await insertRewardWithUpsert(db, schema, {
      amount: 10,
      title: 'Reward: Achievement',
      type: 'in',
      group: 'reward',
      referenceId: sharedReferenceId,
      rewardEventKey: `achievement:${sharedReferenceId}`,
      userId,
    });
    const [challengeCount] = await countRewardRowsByEventKey(
      db,
      schema,
      userId,
      `challenge-answer:${sharedReferenceId}`,
    );
    const [achievementCount] = await countRewardRowsByEventKey(
      db,
      schema,
      userId,
      `achievement:${sharedReferenceId}`,
    );
    assert.equal(
      Number(challengeCount?.count ?? 0),
      1,
      'challenge reward should still exist after achievement insertion',
    );
    assert.equal(
      Number(achievementCount?.count ?? 0),
      1,
      'achievement reward with shared numeric reference should be inserted',
    );

    // different legitimate reward events for same user
    await insertRewardWithUpsert(db, schema, {
      amount: 20,
      title: 'Reward: Challenge B',
      type: 'in',
      group: 'reward',
      referenceId: otherReferenceId,
      rewardEventKey: `challenge-answer:${otherReferenceId}`,
      userId,
    });
    const [challengeBCount] = await countRewardRowsByEventKey(
      db,
      schema,
      userId,
      `challenge-answer:${otherReferenceId}`,
    );
    assert.equal(
      Number(challengeBCount?.count ?? 0),
      1,
      'a different reward event should insert normally',
    );

    // non-reward transactions may repeat reference IDs
    await db.insert(schema.creditTransactions).values({
      amount: 5,
      title: 'Hint charge 1',
      type: 'out',
      group: 'hint',
      referenceId: sharedReferenceId,
      userId,
    });
    await db.insert(schema.creditTransactions).values({
      amount: 5,
      title: 'Hint charge 2',
      type: 'out',
      group: 'hint',
      referenceId: sharedReferenceId,
      userId,
    });
    const [hintCount] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(schema.creditTransactions)
      .where(
        and(
          eq(schema.creditTransactions.userId, userId),
          eq(schema.creditTransactions.group, 'hint'),
          eq(schema.creditTransactions.type, 'out'),
          eq(schema.creditTransactions.referenceId, sharedReferenceId),
        ),
      );
    assert.equal(
      Number(hintCount?.count ?? 0),
      2,
      'non-reward transactions must allow repeated references',
    );

    // concurrent attempts for the same reward event
    await Promise.all([
      insertRewardWithUpsert(db, schema, {
        amount: 35,
        title: 'Reward: Concurrency Test',
        type: 'in',
        group: 'reward',
        referenceId: 999001,
        rewardEventKey: 'challenge-answer:999001',
        userId,
      }),
      insertRewardWithUpsert(db, schema, {
        amount: 35,
        title: 'Reward: Concurrency Test duplicate',
        type: 'in',
        group: 'reward',
        referenceId: 999001,
        rewardEventKey: 'challenge-answer:999001',
        userId,
      }),
    ]);

    const [concurrentCount] = await countRewardRowsByEventKey(
      db,
      schema,
      userId,
      'challenge-answer:999001',
    );
    assert.equal(
      Number(concurrentCount?.count ?? 0),
      1,
      'concurrent inserts must keep one reward transaction',
    );

    const rewardRows = await db
      .select({
        rewardEventKey: schema.creditTransactions.rewardEventKey,
      })
      .from(schema.creditTransactions)
      .where(
        and(
          eq(schema.creditTransactions.userId, userId),
          eq(schema.creditTransactions.group, 'reward'),
          eq(schema.creditTransactions.type, 'in'),
        ),
      );
    assert.ok(
      rewardRows.length >= 4,
      'expected all unique reward events to exist for the user',
    );
  } finally {
    await db
      .delete(schema.creditTransactions)
      .where(eq(schema.creditTransactions.userId, userId));
    await db.delete(schema.users).where(eq(schema.users.id, userId));
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
