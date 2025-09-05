import { drizzle, MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from './db/schema';

let drizzleDb: MySql2Database<typeof schema> | undefined;

function db() {
  if (!drizzleDb) {
    drizzleDb = drizzle(process.env.DATABASE_URL!, {
      mode: 'default',
      schema: schema,
    });
  }
  console.log('DB initialized');
  return drizzleDb;
}

export { db };
