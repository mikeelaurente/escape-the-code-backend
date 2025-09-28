import {
  drizzle,
  MySql2PreparedQueryHKT,
  MySql2QueryResultHKT,
} from 'drizzle-orm/mysql2';
import * as schema from './db/schema';
import { MySqlTransaction } from 'drizzle-orm/mysql-core';
import { ExtractTablesWithRelations } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL!, {
  mode: 'default',
  schema: schema,
});

export type EscapeTheCodeTransaction = MySqlTransaction<
  MySql2QueryResultHKT,
  MySql2PreparedQueryHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export { db };
