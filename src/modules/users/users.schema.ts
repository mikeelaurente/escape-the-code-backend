import z from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().nonempty('Firstname is required.'),
  lastName: z.string().nonempty('Lastname is required.'),
  email: z.email().nonempty('Email is required'),
  about: z.string().max(500, { message: 'Too long.' }),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().nonempty('Old password is required.'),
  newPassword: z.string().nonempty('New password is required.'),
  confirmPassword: z.string().nonempty('Please confirm password.'),
});
