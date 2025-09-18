import { relations } from 'drizzle-orm';
import {
  datetime,
  timestamp,
  int,
  mysqlTable,
  varchar,
  json,
  text,
} from 'drizzle-orm/mysql-core';
import { createInsertSchema } from 'drizzle-zod';

export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  email: varchar({ length: 255 }).notNull().unique(),
  hashedPassword: varchar({ length: 255 }),
  firstName: varchar({ length: 255 }).notNull(),
  lastName: varchar({ length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const userCredits = mysqlTable('user_credits', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id),
  value: int().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const creditUsage = mysqlTable('credit_usage', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id),
  challengeHintId: int('challengeHint_id').references(() => challengeHints.id),
  challengeId: int('challenge_id').references(() => challenges.id),
  cost: int().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const achievements = mysqlTable('achievements', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar({ length: 255 }).notNull().unique(),
  description: varchar({ length: 1024 }).notNull(),
  rewardPoints: int().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const userAchievements = mysqlTable('user_achievements', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id),
  achievementId: int('achievement_id').references(() => achievements.id),
  awardedAt: datetime().notNull(),
});

export const storyProgress = mysqlTable('story_progress', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id),
  storyId: int('story_id').references(() => stories.id),
  chapterId: int('chapter_id').references(() => chapters.id),
  sectionId: int('section_id').references(() => sections.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const stories = mysqlTable('stories', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar({ length: 255 }).notNull().unique(),
  description: varchar({ length: 2048 }).notNull(),
  rewardOptions: json('reward_options')
    .$type<{
      easy: number;
      medium: number;
      hard: number;
    }>()
    .$default(() => ({
      easy: 10,
      medium: 20,
      hard: 30,
    })),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const chapters = mysqlTable('chapters', {
  id: int('id').autoincrement().primaryKey(),
  storyId: int('story_id').references(() => stories.id),
  order: int().notNull(),
  title: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 2048 }).notNull(),
  rewardOptions: json('reward_options')
    .$type<{
      easy: number;
      medium: number;
      hard: number;
    }>()
    .$default(() => ({
      easy: 10,
      medium: 20,
      hard: 30,
    })),
});

export const sections = mysqlTable('sections', {
  id: int('id').autoincrement().primaryKey(),
  chapterId: int('chapter_id').references(() => chapters.id),
  order: int().notNull(),
  title: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 2048 }).notNull(),
  content: text('content').notNull(),
  runnables: varchar({ length: 2048 }).notNull(),
  rewardOptions: json('reward_options')
    .$type<{
      easy: number;
      medium: number;
      hard: number;
    }>()
    .$default(() => ({
      easy: 10,
      medium: 20,
      hard: 30,
    })),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const challenges = mysqlTable('challenges', {
  id: int('id').autoincrement().primaryKey(),
  sectionID: int('section_id').references(() => sections.id),
  title: varchar({ length: 255 }).notNull().unique(),
  moduleType: varchar({ length: 100 }).notNull(),
  description: varchar({ length: 2048 }).notNull(),
  difficulty: varchar({ length: 50 }).notNull(),
  expectedOutput: varchar({ length: 2048 }).notNull(),
  rewardPoints: int().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const challengeAnswers = mysqlTable('challenge_answers', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id),
  challengeId: int('challenge_id').references(() => challenges.id),
  code: text().notNull(),
  result: text().notNull(),
  metadata: text(),
  codeOutput: text(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const challengeHints = mysqlTable('challenge_hints', {
  id: int('id').autoincrement().primaryKey(),
  challengeId: int('challenge_id').references(() => challenges.id),
  displayText: varchar({ length: 2048 }).notNull(),
  hintText: varchar({ length: 2048 }).notNull(),
  cost: int().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const userRelations = relations(users, ({ one, many }) => ({
  credits: one(userCredits, {
    fields: [users.id],
    references: [userCredits.userId],
  }),
  creditUsage: many(creditUsage),
  achievements: many(userAchievements),
  storyProgress: many(storyProgress),
  challengeAnswers: many(challengeAnswers),
}));

export const creditsRelations = relations(userCredits, ({ one }) => ({
  user: one(users, {
    fields: [userCredits.userId],
    references: [users.id],
  }),
}));

export const challengeAnswersRelations = relations(
  challengeAnswers,
  ({ one }) => ({
    challenge: one(challenges, {
      fields: [challengeAnswers.challengeId],
      references: [challenges.id],
    }),
  }),
);

export const storyRelations = relations(stories, ({ many }) => ({
  chapters: many(chapters),
  progress: many(storyProgress),
}));

export const chapterRelations = relations(chapters, ({ many, one }) => ({
  story: one(stories, {
    fields: [chapters.storyId],
    references: [stories.id],
  }),
  sections: many(sections),
  progress: many(storyProgress),
}));

export const sectionRelations = relations(sections, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [sections.chapterId],
    references: [chapters.id],
  }),
  storyProgress: one(storyProgress, {
    fields: [sections.id],
    references: [storyProgress.sectionId],
  }),
  challenges: many(challenges),
}));

export const challengeRelations = relations(challenges, ({ one, many }) => ({
  section: one(sections, {
    fields: [challenges.sectionID],
    references: [sections.id],
  }),
  answers: many(challengeAnswers),
  hints: many(challengeHints),
}));

export const hintsRelations = relations(challengeHints, ({ one, many }) => ({
  challenge: one(challenges, {
    fields: [challengeHints.challengeId],
    references: [challenges.id],
  }),
  creditUsage: one(creditUsage),
}));

export const creditUsageRelations = relations(creditUsage, ({ one, many }) => ({
  hint: one(challengeHints, {
    fields: [creditUsage.challengeHintId],
    references: [challengeHints.id],
  }),
  creditUsage: one(creditUsage),
}));

export const storyProgressRelations = relations(storyProgress, ({ one }) => ({
  story: one(stories, {
    fields: [storyProgress.storyId],
    references: [stories.id],
  }),
  chapter: one(chapters, {
    fields: [storyProgress.chapterId],
    references: [chapters.id],
  }),
  section: one(sections, {
    fields: [storyProgress.sectionId],
    references: [sections.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users);
