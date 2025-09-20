import z from 'zod';

export const submitAnswerSchema = z.object({
  answer: z.string().nonempty('Please provide an answer.'),
});
