import { relations } from 'drizzle-orm';
import {
  tinyint,
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
  credits: int().notNull().default(0),
  about: text(),
  photoUrl: varchar({ length: 255 }).default('user.png'),
  verified: tinyint('verified', { unsigned: true }).default(0),
  verificationToken: varchar('verification_token', { length: 200 }).unique(),
  verifiedAt: timestamp('verified_at'),
  passwordResetToken: varchar('password_reset_token', { length: 200 }),
  passwordResetExpiration: timestamp('password_reset_expiration'),
  bannerUrl: varchar({ length: 255 }).default('banner.png'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const hintUsages = mysqlTable('hint_usages', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id),
  challengeHintId: int('challengeHint_id').references(() => challengeHints.id),
  challengeId: int('challenge_id').references(() => challenges.id),
  cost: int().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const creditTransactions = mysqlTable('credit_transactions', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id),
  title: varchar({ length: 255 }).notNull(),
  type: varchar({ length: 30 }).notNull().$type<'in' | 'out'>(),
  referenceId: int('reference_id'),
  group: varchar({ length: 30 }).$type<'hint' | 'reward'>(),
  amount: int().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export type AchievementRule =
  | {
      type: 'streak';
      length: number;
      withoutWrong?: boolean;
      chapterOrder: number;
    }
  | {
      type: 'no_hints_streak';
      length: number;
    }
  | {
      type: 'no_hints_total';
      count: number;
    }
  | {
      type: 'time_to_solve_under_seconds';
      seconds: number;
      chapterOrder?: number;
    }
  | {
      type: 'chapter_perfect';
      chapterTitle: string;
    }
  | {
      type: 'daily_active_streak';
      days: number;
    }
  | {
      type: 'community_solution_shared';
      approved: boolean;
      count: number;
    }
  | {
      type: 'limited_hints_per_challenge';
      maxHints: number;
      count: number;
    };

export type Difficulty = 'easy' | 'medium' | 'hard';

export const achievements = mysqlTable('achievements', {
  id: int('id').autoincrement().primaryKey(),
  code: varchar('code', { length: 64 }).notNull(),
  title: varchar('title', { length: 255 }).notNull().unique(),
  description: varchar('description', { length: 1024 }).notNull(),
  difficulty: varchar('difficulty', { length: 30 })
    .notNull()
    .$type<Difficulty>(),
  rewardPoints: int('reward_points').notNull(),
  creditPoints: int('credit_points').notNull().default(0),
  icon: varchar('icon', { length: 64 }).notNull().default('tabler:award'),
  rule: json('rule').$type<AchievementRule>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const userAchievements = mysqlTable('user_achievements', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id),
  achievementId: int('achievement_id').references(() => achievements.id),
  awardedAt: datetime().notNull(),
});

export const courseProgress = mysqlTable('course_progress', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id),
  courseId: int('course_id').references(() => courses.id),
  chapterId: int('chapter_id').references(() => chapters.id),
  sectionId: int('section_id').references(() => sections.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const courses = mysqlTable('courses', {
  id: int('id').autoincrement().primaryKey(),
  coverImage: varchar('cover_image', { length: 255 }),
  title: varchar({ length: 255 }).notNull().unique(),
  description: varchar({ length: 2048 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const chapters = mysqlTable('chapters', {
  id: int('id').autoincrement().primaryKey(),
  courseId: int('course_id')
    .notNull()
    .references(() => courses.id),
  title: varchar('title', { length: 255 }).notNull().unique(),
  description: varchar('description', { length: 2048 }).notNull(),
  order: int('order').notNull(),
  coverImage: varchar('cover_image', { length: 512 }),
  rewardPoints: int('reward_points').notNull().default(0),
  creditPoints: int('credit_points').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const sections = mysqlTable('sections', {
  id: int('id').autoincrement().primaryKey(),
  chapterId: int('chapter_id')
    .notNull()
    .references(() => chapters.id),
  order: int('order').notNull(),
  coverImage: varchar('cover_image', { length: 255 }),
  title: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 2048 }).notNull(),
  content: text('content').notNull(),
  runnables: varchar({ length: 2048 }).notNull(),
  trivias: text(),
  additionalResources: text('additional_resources'),
  rewardPoints: int('reward_points').default(0),
  creditPoints: int('credit_points').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const challenges = mysqlTable('challenges', {
  id: int('id').autoincrement().primaryKey(),
  sectionID: int('section_id').references(() => sections.id),
  title: varchar({ length: 255 }).notNull().unique(),
  order: int().default(0),
  moduleType: varchar({ length: 100 }).notNull(),
  description: varchar({ length: 2048 }).notNull(),
  difficulty: varchar({ length: 50 }).notNull().$type<Difficulty>(),
  durationLimitMinutes: int('duration_limit_minutes', {
    unsigned: true,
  }).default(0),
  expectedOutput: varchar({ length: 2048 }).notNull(),
  creditPoints: int().notNull(),
  rewardPoints: int().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export enum ChallengeStatus {
  Ongoing = 0,
  Completed = 1,
  Cancelled = 2,
  Expired = 3,
  Skipped = 4,
}

export const challengeAnswers = mysqlTable('challenge_answers', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id),
  challengeId: int('challenge_id').references(() => challenges.id),
  durationLimitMinutes: int('duration_limit_minutes', {
    unsigned: true,
  }).default(0),
  feedback: text(),
  status: tinyint('status', { unsigned: true })
    .default(ChallengeStatus.Ongoing)
    .$type<ChallengeStatus>(),
  creditPoints: int().default(0),
  rewardPoints: int().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  cancelledAt: timestamp('cancelled_at'),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const challengeAnswerSubmissions = mysqlTable(
  'challenge_answer_submissions',
  {
    id: int('id').autoincrement().primaryKey(),
    userId: int('user_id').references(() => users.id),
    challengeId: int('challenge_id').references(() => challenges.id),
    challengeAnswerId: int('answer_id').references(() => challengeAnswers.id),
    code: text().notNull(),
    result: text().notNull().$type<'passed' | 'failed'>(),
    metadata: text(),
    codeOutput: text(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
);

export const challengeHints = mysqlTable('challenge_hints', {
  id: int('id').autoincrement().primaryKey(),
  challengeId: int('challenge_id').references(() => challenges.id),
  displayText: varchar({ length: 2048 }).notNull(),
  hintText: varchar({ length: 2048 }).notNull(),
  cost: int().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const userRelations = relations(users, ({ many }) => ({
  creditUsage: many(hintUsages),
  achievements: many(userAchievements),
  courseProgress: many(courseProgress),
  challengeAnswers: many(challengeAnswers),
}));

export const achievementRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementRelations = relations(
  userAchievements,
  ({ one }) => ({
    achievement: one(achievements, {
      fields: [userAchievements.achievementId],
      references: [achievements.id],
    }),
  }),
);

export const challengeAnswersRelations = relations(
  challengeAnswers,
  ({ one, many }) => ({
    challenge: one(challenges, {
      fields: [challengeAnswers.challengeId],
      references: [challenges.id],
    }),
    submissions: many(challengeAnswerSubmissions),
  }),
);
export const challengeAnswerSubmissionsRelations = relations(
  challengeAnswerSubmissions,
  ({ one }) => ({
    challenge: one(challenges, {
      fields: [challengeAnswerSubmissions.challengeId],
      references: [challenges.id],
    }),
    challengeAnswer: one(challengeAnswers, {
      fields: [challengeAnswerSubmissions.challengeAnswerId],
      references: [challengeAnswers.id],
    }),
  }),
);

export const courseRelations = relations(courses, ({ many }) => ({
  chapters: many(chapters),
  progress: many(courseProgress),
}));

export const chapterRelations = relations(chapters, ({ many, one }) => ({
  course: one(courses, {
    fields: [chapters.courseId],
    references: [courses.id],
  }),
  sections: many(sections),
  progress: many(courseProgress),
}));

export const sectionRelations = relations(sections, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [sections.chapterId],
    references: [chapters.id],
  }),
  courseProgress: one(courseProgress, {
    fields: [sections.id],
    references: [courseProgress.sectionId],
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

export const hintsRelations = relations(challengeHints, ({ one }) => ({
  challenge: one(challenges, {
    fields: [challengeHints.challengeId],
    references: [challenges.id],
  }),
  creditUsage: one(hintUsages),
}));

export const creditUsageRelations = relations(hintUsages, ({ one }) => ({
  hint: one(challengeHints, {
    fields: [hintUsages.challengeHintId],
    references: [challengeHints.id],
  }),
  creditUsage: one(hintUsages),
}));

export const courseProgressRelations = relations(courseProgress, ({ one }) => ({
  course: one(courses, {
    fields: [courseProgress.courseId],
    references: [courses.id],
  }),
  chapter: one(chapters, {
    fields: [courseProgress.chapterId],
    references: [chapters.id],
  }),
  section: one(sections, {
    fields: [courseProgress.sectionId],
    references: [sections.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users);
export type Section = typeof sections.$inferSelect;

export enum VerificationStatus {
  NotVerified = 0,
  Verified = 1,
}
