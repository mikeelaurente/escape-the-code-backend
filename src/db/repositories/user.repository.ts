import { sql, eq, sum, and } from 'drizzle-orm';
import { db, EscapeTheCodeTransaction } from '../../db';
import z from 'zod';
import * as schema from '../../db/schema';
import config from '../../config/config';
import { resolveAvatar, resolveBanner } from '../../helpers/image.helper';
import { Paginated } from '../../types';
import { createQueryParamsSchema } from '../../types/schema';
import { count } from 'drizzle-orm';

type UserRanking = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  points: number;
  completed: number;
  photoUrl: string;
  bannerUrl: string;
  total: number;
};

export const RankingRequestSchema = createQueryParamsSchema(z.object());
export type RankingRequest = z.infer<typeof RankingRequestSchema>;

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

export const getUserRanking = async (
  options: RankingRequest,
): Promise<Paginated<UserRanking>> => {
  let search = options.search ?? '';
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const offset = (page - 1) * limit;

  let searchSql = sql`WHERE 1 = 1`;
  if (search.length > 0) {
    searchSql = sql`WHERE
        y.email LIKE CONCAT('%', ${search}, '%')
        OR y.firstName LIKE CONCAT('%', ${search}, '%')
        OR y.lastName LIKE CONCAT('%', ${search}, '%')
    `;
  }

  const query = sql`
      SELECT * FROM (
          SELECT
          @rownum := @rownum + 1 AS \`rank\`,
          x.*
        FROM (
          SELECT
            u.id,
            u.email,
            u.first_name AS firstName,
            u.last_name AS lastName,
            u.photo_url AS photoUrl,
            SUM(rewardPoints) AS points,
            (SELECT COUNT(*) FROM course_progress sp WHERE sp.user_id = u.id) completed,
            (SELECT COUNT(*) FROM sections) total
            FROM challenge_answers ca
            JOIN users u ON u.id = ca.user_id
          WHERE ca.\`status\` = 1
          GROUP BY u.id
          ORDER BY points DESC
        ) x,
        (SELECT @rownum := 0) r
        ORDER BY points DESC, x.completed DESC
      ) y
      ${searchSql}
    `;

  const [total] = await db.execute<{ cnt: number }>(sql`
    SELECT COUNT(*) as cnt
    FROM (${query}) t
    `);
  const [result] = await db.execute<UserRanking>(sql`
    ${query}
    LIMIT ${limit}
    OFFSET ${offset}
  `);
  const rankings = result as any as UserRanking[];
  const data = [
    ...rankings.map((rank, idx) => ({
      ...rank,
      points: Number(rank.points),
      photoUrl: resolveAvatar(rank.photoUrl || 'default'),
    })),
  ];

  return {
    data: data,
    limit: limit,
    page: page,
    total: (total as any as { cnt: number }[])[0]?.cnt ?? 0,
  };
};

export const getUserRankingFor = async (userId: number) => {
  const query = sql`
        WITH ranking AS (
            SELECT
              @rownum := @rownum + 1 AS \`rank\`,
              x.*
            FROM (
              SELECT
                  u.id,
                  SUM(rewardPoints) AS points
                  FROM challenge_answers ca
                  JOIN users u ON u.id = ca.user_id
              WHERE ca.\`status\` = 1
              GROUP BY u.id
              ORDER BY points DESC
            ) x,
            (SELECT @rownum := 0) r
        )
        SELECT
            u.id,
            u.email,
            u.first_name AS firstName,
            u.last_name AS lastName,
            u.about,
            u.photo_url AS photoUrl,
            u.banner_url AS bannerUrl,
            r.\`rank\`,
            r.points,
            (SELECT COUNT(*) FROM course_progress sp WHERE sp.user_id = u.id) completed,
            (SELECT COUNT(*) FROM sections) total,
            (SELECT MIN(TIMESTAMPDIFF(SECOND, created_at, completed_at)) AS duration
              FROM challenge_answers ca WHERE ca.status = 1 AND user_id = ${userId}
              GROUP BY user_id
            ) shortestTime,
            (SELECT MAX(TIMESTAMPDIFF(SECOND, created_at, completed_at)) AS duration
              FROM challenge_answers ca WHERE ca.status = 1 AND user_id = ${userId}
              GROUP BY user_id
            ) longestTime
            FROM users u
            LEFT JOIN ranking r ON r.id = u.id
        WHERE u.id = ${userId}
    `;
  const [result, _] = await db.execute<UserRanking>(query);
  const ranking = result as any as UserRanking[] & {
    shortestTime: number;
    longestTime: number;
  };
  const port = config.port;
  const userRank = [
    ...ranking.map((rank, idx) => ({
      ...rank,
      points: Number(rank.points),
      photoUrl: resolveAvatar(rank.photoUrl || 'default'),
      banner: resolveBanner(rank.bannerUrl || 'default'),
    })),
  ];

  return userRank.shift();
};

export const getUserDashboard = async (userId: number) => {
  const query = sql`
        SELECT
            u.id,
            u.email,
            u.first_name AS firstName,
            u.last_name AS lastName,
            u.about,
            u.photoUrl,
            u.bannerUrl,
            SUM(rewardPoints) AS points,
            (SELECT COUNT(*) FROM course_progress sp WHERE sp.user_id = u.id) completed,
            (SELECT COUNT(*) FROM sections) total
            FROM users u
            LEFT JOIN challenge_answers ca ON u.id = ca.user_id
              AND ca.\`status\` = 1
        WHERE u.id = ${userId}
        GROUP BY u.id
        ORDER BY points DESC;
    `;
  const [result, _] = await db.execute<UserRanking>(query);
  const ranking = result as any as UserRanking[];
  const userRank = [
    ...ranking.map((rank, idx) => ({
      ...rank,
      rank: idx + 1,
      points: Number(rank.points),
      photoUrl: resolveAvatar(rank.photoUrl || 'default'),
      banner: resolveBanner(rank.bannerUrl || 'default'),
    })),
  ];

  return userRank.shift();
};

export const getSectionAnswersWithHints = async (
  userId: number,
  courseId: number,
) => {
  const query = sql`
          WITH hint_records AS (
            WITH used_hints AS (
              SELECT
              challenge_id,
              JSON_ARRAYAGG(
                  JSON_OBJECT(
                    'id', id,
                    'created_at', created_at,
                    'cost', cost
                  )
                ) AS records
              FROM hint_usages
              WHERE user_id = ${userId}
              GROUP BY challenge_id
            ),
            submissions AS (
              SELECT
              cas.answer_id,
              JSON_ARRAYAGG(
                  JSON_OBJECT(
                    'id', cas.id,
                    'code', cas.\`code\`,
                    'result', cas.result,
                    'metadata', cas.metadata,
                    'codeOutput', cas.codeOutput,
                    'created_at', cas.created_at
                  )
                ) AS submissions
              FROM challenge_answer_submissions cas
              JOIN challenge_answers ca ON ca.id = cas.answer_id
                AND cas.user_id = ${userId}
              JOIN challenges c ON c.id = ca.challenge_id
              JOIN sections s ON s.id = c.section_id
              JOIN chapters ch ON ch.id = s.chapter_id
                AND ch.course_id = ${courseId}
              GROUP BY answer_id
            )
            SELECT
              s.chapter_id,
              s.id AS section_id,
              JSON_ARRAYAGG(
                  JSON_OBJECT(
                    'id', ca.id,
                    'created_at', ca.created_at,
                    'completed_at', ca.completed_at,
                    'challenge_id', ca.challenge_id,
                    'feedback', ca.feedback,
                    'time_taken', TIMESTAMPDIFF(SECOND, ca.created_at, ca.completed_at),
                    'status', ca.\`status\`,
                    'usages', uh.records,
                    'submissions', sub.submissions
                  )
                ) AS answers
            FROM challenges c
            JOIN sections s
              ON s.id = c.section_id
            JOIN chapters ch
              ON ch.id = s.chapter_id
              AND ch.course_id = ${courseId}
            JOIN challenge_answers ca
              ON c.id = ca.challenge_id
                AND ca.\`status\` = 1
                AND ca.user_id = ${userId}
            LEFT JOIN used_hints uh ON ca.challenge_id = uh.challenge_id
            LEFT JOIN submissions sub ON sub.answer_id = ca.id
            GROUP BY s.chapter_id, s.id
          ),
          section_challenges AS (
            SELECT
              c.section_id,
              JSON_ARRAYAGG(
                  JSON_OBJECT(
                    'id', c.id,
                    'title', c.title,
                    'difficulty', c.difficulty
                  )
                ) AS sect_challenges
            FROM challenges c
            JOIN sections s
              ON s.id = c.section_id
            JOIN chapters ch
              ON ch.id = s.chapter_id
              AND ch.course_id = ${courseId}
            GROUP BY c.section_id
          )
          SELECT
            s.chapter_id AS chapterId,
            c.\`order\` AS chapterOrder,
            c.title as chapterTitle,
            s.id AS sectionId,
            s.\`order\` AS sectionOrder,
            s.title as sectionTitle,
            uh.answers,
            sc.sect_challenges as challenges
          FROM sections s
          JOIN chapters c ON c.id = s.chapter_id
            AND c.course_id = ${courseId}
          JOIN section_challenges sc ON s.id = sc.section_id
          LEFT JOIN hint_records uh
            ON s.chapter_id = uh.chapter_id
              AND s.id = uh.section_id
          ORDER BY c.\`order\`, s.\`order\` ASC;
    `;

  const [result, _] = await db.execute(query);
  const data = result as any as {
    chapterId: number;
    chapterOrder: number;
    chapterTitle: string;
    sectionId: number;
    sectionTitle: string;
    sectionOrder: number;
    challenges: string;
    answers: string;
  }[];

  const grouped = data.reduce(
    (agg, cur) => {
      if (!(cur.chapterId in agg)) {
        agg[cur.chapterId] = {
          id: cur.chapterId,
          title: cur.chapterTitle,
          order: cur.chapterOrder,
          sections: [],
        };
      }

      if (typeof agg[cur.chapterId] !== 'undefined') {
        agg[cur.chapterId]?.sections.push({
          id: cur.sectionId,
          title: cur.sectionTitle,
          order: cur.sectionOrder,
          challenges: cur.challenges,
          answers: cur.answers,
        });
      }

      return agg;
    },
    {} as Record<
      string,
      {
        id: number;
        title: string;
        order: number;
        sections: {
          id: number;
          order: number;
          title: string;
          answers: string;
          challenges: string;
        }[];
      }
    >,
  );

  return {
    data,
    grouped,
  };
};
