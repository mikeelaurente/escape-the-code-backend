import { mysqlTable, int, varchar, timestamp } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  email: varchar({ length: 255 }).notNull().unique(),
  hashedPassword: varchar({ length: 255 }),
  firstName: varchar({ length: 255 }).notNull(),
  lastName: varchar({ length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});
