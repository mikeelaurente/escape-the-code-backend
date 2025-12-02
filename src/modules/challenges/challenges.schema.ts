import z from 'zod';

export const submitAnswerSchema = z.object({
  answer: z
    .string()
    .max(1000, { error: 'Your answer is too long.' })
    .nonempty('Please provide an answer.'),
});

export const answerChallengeSchema = z.object({
  answer: z.string().nonempty('Please select an answer.'),
});
