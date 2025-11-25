import z from 'zod';

export type QueryParams<ValidFilters = Record<string, unknown>> = {
  search: string;
  filters: ValidFilters;
  limit: number;
  page: number;
  sort: { name: string; order: 'asc' | 'desc' };
};

export function createQueryParamsSchema<ItemType extends z.ZodTypeAny>(
  itemSchema: ItemType,
) {
  return z.object({
    search: z.string().optional(),
    filters: itemSchema.optional(),
    sort: z
      .object({
        name: z.string(),
        order: z.enum(['asc', 'desc']),
      })
      .optional(),
    page: z.coerce.number().optional().default(1),
    limit: z.coerce.number().optional().default(10),
  });
}
