import z from 'zod';

export const registerUserSchema = z.object({
  firstName: z.string().nonempty('Firstname is required'),
  lastName: z
    .string({
      error: 'Lastname is required',
    })
    .nonempty('Lastname is required'),
  email: z.email().nonempty(),
  password: z.string().min(6),
});

export const loginSchema = z.object({
  email: z.email().nonempty('Email is required'),
  password: z.string().min(3),
});
