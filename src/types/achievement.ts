import type * as schema from '../db/schema';
import z from 'zod';
import type { Paginated } from './api';
import { createQueryParamsSchema } from './schema';

export type Achievement = typeof schema.achievements.$inferSelect;

export type AchievementId = Achievement['id'];

export type AchievementDto = {
  id: Achievement['id'];
  code: Achievement['code'];
  title: Achievement['title'];
  description: Achievement['description'];
  difficulty: Achievement['difficulty'];
  rewardPoints: Achievement['rewardPoints'];
  creditPoints: Achievement['creditPoints'];
  icon: Achievement['icon'];
  rule: Achievement['rule'];
  createdAt: Achievement['createdAt'];
  updatedAt: Achievement['updatedAt'];
};

export const AchievementsQueryParamsSchema = createQueryParamsSchema(
  z.object({
    status: z.enum(['all', 'completed', 'not_completed']).default('all'),
  }),
);
export type AchievementsQueryParams = z.infer<
  typeof AchievementsQueryParamsSchema
>;
export type AchievementsQueryResponse = Paginated<AchievementDto>;
