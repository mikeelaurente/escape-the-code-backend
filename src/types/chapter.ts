import z from 'zod';
import type * as schema from '../db/schema';
import { createQueryParamsSchema } from './schema';
import type { Paginated } from './api';
import type { Section } from './section';

export type Chapter = typeof schema.chapters.$inferSelect;
export type ChapterWithSections = Chapter & {
  sections: Section[];
};
export type ChapterId = Chapter['id'];

export type ChapterDto = {
  id: Chapter['id'];
  courseId: Chapter['courseId'];
  title: Chapter['title'];
  description: Chapter['description'];
  order: Chapter['order'];
  coverImage: Chapter['coverImage'];
  rewardPoints: Chapter['rewardPoints'];
  creditPoints: Chapter['creditPoints'];
  createdAt: Chapter['createdAt'];
  updatedAt: Chapter['updatedAt'];
};

export const ChaptersQueryParamsSchema = createQueryParamsSchema(
  z.object({
    courseId: z.coerce.number().optional(),
  }),
);

export type ChaptersQueryParams = z.infer<typeof ChaptersQueryParamsSchema>;

export type ChaptersQueryResponse = Paginated<ChapterDto>;

export const CreateChapterSchema = z.object({
  courseId: z.number(),
  title: z.string('Title is required').min(5, 'Too short'),
  description: z.string().optional(),
});

export type CreateChapterRequest = z.infer<typeof CreateChapterSchema>;
