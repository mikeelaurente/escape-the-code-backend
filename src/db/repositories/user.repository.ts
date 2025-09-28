import { sql, eq, sum, and } from 'drizzle-orm';
import { db, EscapeTheCodeTransaction } from '../../db';
import * as schema from '../../db/schema';
import config from '../../config/config';

type UserRanking = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  points: number;
  completed: number;
  photoUrl: string;
  total: number;
};

async function getUserTotalTransactionsBy(
  userId: number,
  type: 'in' | 'out',
  tx?: EscapeTheCodeTransaction,
): Promise<number> {
  const theDb = tx ? tx : db;
  const [credits] = await theDb
    .select({
      value: sql`IFNULL(SUM(amount), 0)`,
    })
    .from(schema.creditTransactions)
    .where(
      and(
        eq(schema.creditTransactions.userId, userId),
        eq(schema.creditTransactions.type, type),
      ),
    );

  return credits ? Number(credits.value) : 0;
}

export async function updateUserBalance(
  uid: number,
  tx?: EscapeTheCodeTransaction,
) {
  const theDb = tx ? tx : db;
  const user = await theDb.query.users.findFirst({
    where: eq(schema.users.id, uid),
  });

  if (!user) {
    return;
  }

  const incomingCredits = await getUserTotalTransactionsBy(user.id, 'in', tx);
  const outgoingCredits = await getUserTotalTransactionsBy(user.id, 'out', tx);

  const newCredit = incomingCredits - outgoingCredits;

  await theDb
    .update(schema.users)
    .set({
      credits: newCredit,
    })
    .where(eq(schema.users.id, uid));
}

export const getUserRanking = async (): Promise<UserRanking[]> => {
  const query = sql`
        SELECT 
            u.id,
            u.email,
            u.firstName,
            u.lastName,
            u.photoUrl,
            SUM(rewardPoints) AS points,
            (SELECT COUNT(*) FROM story_progress sp WHERE sp.user_id = u.id) completed,
            (SELECT COUNT(*) FROM sections) total
            FROM challenge_answers ca
            JOIN users u ON u.id = ca.user_id
        WHERE \`status\` = 1
        GROUP BY u.id
        ORDER BY points DESC;
    `;
  const [result, _] = await db.execute<UserRanking>(query);
  const ranking = result as any as UserRanking[];
  const port = config.port;
  return [
    ...ranking.map((rank, idx) => ({
      ...rank,
      rank: idx + 1,
      points: Number(rank.points),
      photoUrl: `http://localhost:${port}/avatars/${rank.photoUrl}`,
    })),
  ];
};

export const getUserRankingFor = async (userId: number) => {
  const query = sql`
        SELECT 
            u.id,
            u.email,
            u.firstName,
            u.lastName,
            u.about,
            u.photoUrl,
            SUM(rewardPoints) AS points,
            (SELECT COUNT(*) FROM story_progress sp WHERE sp.user_id = u.id) completed,
            (SELECT COUNT(*) FROM sections) total
            FROM challenge_answers ca
            JOIN users u ON u.id = ca.user_id
        WHERE \`status\` = 1 AND u.id = ${userId}
        GROUP BY u.id
        ORDER BY points DESC;
    `;
  const [result, _] = await db.execute<UserRanking>(query);
  const ranking = result as any as UserRanking[];
  const port = config.port;
  const userRank = [
    ...ranking.map((rank, idx) => ({
      ...rank,
      rank: idx + 1,
      points: Number(rank.points),
      photoUrl: `http://localhost:${port}/avatars/${rank.photoUrl}`,
    })),
  ];

  return userRank.shift();
};
