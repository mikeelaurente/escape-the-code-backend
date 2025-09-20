import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from './db/schema';

const db = drizzle(process.env.DATABASE_URL!, {
  mode: 'default',
  schema: schema,
});

export { db };
