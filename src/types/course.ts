import type * as schema from '../db/schema';
import z from 'zod';
import type { Paginated } from './api';
import { createQueryParamsSchema } from './schema';
import type { Chapter } from './chapter';

export type Course = typeof schema.courses.$inferSelect;
export type CourseWithChapters = Course & {
  chapters: Chapter[];
};

export type CourseId = Course['id'];

export type CourseDto = {
  id: Course['id'];
  coverImage: Course['coverImage'];
  title: Course['title'];
  description: Course['description'];
  createdAt: Course['createdAt'];
  updatedAt: Course['updatedAt'];
};

export const CoursesQueryParamsSchema = createQueryParamsSchema(z.object());
export type CoursesQueryParams = z.infer<typeof CoursesQueryParamsSchema>;
export type CoursesQueryResponse = Paginated<CourseDto>;

export const CreateCourseSchema = z.object({
  title: z.string('Title is required').min(5, 'Too short'),
  description: z.string().optional(),
});

export type CreateCourseRequest = z.infer<typeof CreateCourseSchema>;
