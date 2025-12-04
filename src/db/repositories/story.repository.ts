import { sql } from 'drizzle-orm';
import { db, EscapeTheCodeTransaction } from '../../db';
import * as schema from '../../db/schema';

export const getNextSectionFor = async (
  studentId: number,
  courseId: number,
  tx?: EscapeTheCodeTransaction,
) => {
  const query = sql`
        SELECT 
            s.id,
            s.chapter_id as chapterId,
            s.\`order\`,
            s.title,
            s.description,
            s.content,
            s.runnables,
            s.reward_points as rewardPoints,
            s.credit_points as creditPoints
        FROM sections s
            JOIN chapters c ON s.chapter_id = c.id
            LEFT JOIN course_progress sp ON s.id = sp.section_id
                AND sp.user_id = ${studentId}
        WHERE sp.section_id IS NULL 
                AND c.course_id = ${courseId}
        ORDER BY c.order, s.order
        LIMIT 1;
    `;
  const theDb = tx ?? db;
  const [result, _] = await theDb.execute(query);
  const [nextSection] = result as any;
  return { ...(nextSection as any as typeof schema.sections.$inferSelect) };
};
