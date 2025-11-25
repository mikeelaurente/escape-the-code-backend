import type * as schema from '../db/schema';
import z from 'zod';
import type { Paginated } from './api';
import { createQueryParamsSchema } from './schema';
import type { Challenge } from './challenge';

export type Section = typeof schema.sections.$inferSelect;
export type SectionId = Section['id'];

export type SectionWithDetails = Section & {
  challenges: Challenge[];
};

export type SectionDto = {
  id: Section['id'];
  chapterId: Section['chapterId'];
  order: Section['order'];
  coverImage: Section['coverImage'];
  title: Section['title'];
  description: Section['description'];
  content: Section['content'];
  runnables: Section['runnables'];
  trivias: Section['trivias'];
  additionalResources: Section['additionalResources'];
  rewardPoints: Section['rewardPoints'];
  creditPoints: Section['creditPoints'];
  createdAt: Section['createdAt'];
  updatedAt: Section['updatedAt'];
};

export const SectionsQueryParamsSchema = createQueryParamsSchema(
  z.object({
    courseId: z.coerce.number().optional(),
    chapterId: z.coerce.number().optional(),
  }),
);

export type SectionsQueryParams = z.infer<typeof SectionsQueryParamsSchema>;

export type SectionsQueryResponse = Paginated<SectionDto>;
