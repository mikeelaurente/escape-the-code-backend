import { sql } from 'drizzle-orm';
import { db } from '../../db';
import * as schema from '../../db/schema';

export const getNextSectionFor = async (studentId: number) => {
  const query = sql`
        SELECT 
            s.id,
            s.chapter_id as chapterId,
            s.\`order\`,
            s.title,
            s.description,
            s.content,
            s.runnables,
            s.reward_options
        FROM sections s
            JOIN chapters c ON s.chapter_id = c.id
            LEFT JOIN story_progress sp ON s.id = sp.section_id
                AND sp.user_id = ${studentId}
        WHERE sp.section_id IS NULL 
        ORDER BY c.order, s.order
        LIMIT 1;
    `;
  const [result, _] = await db.execute(query);
  const [nextSection] = result as any;
  return { ...(nextSection as any as typeof schema.sections.$inferSelect) };
};
