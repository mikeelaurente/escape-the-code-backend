import z from 'zod';

export const runCodeSchema = z.object({
  code: z.string().nonempty('Code cannot be empty.'),
});
