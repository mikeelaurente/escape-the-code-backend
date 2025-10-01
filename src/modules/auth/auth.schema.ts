import z from 'zod';

export const registerUserSchema = z.object({
  firstName: z.string().nonempty('Firstname is required'),
  lastName: z
    .string({
      error: 'Lastname is required',
    })
    .nonempty('Lastname is required'),
  email: z.email().nonempty('Email is required'),
  password: z
    .string()
    .min(6)
    .nonempty('Password must be at least 6 characters long'),
});

export const loginSchema = z.object({
  email: z.email().nonempty('Email is required'),
  password: z
    .string()
    .min(6)
    .nonempty('Password must be at least 6 characters long'),
});

export const verifyEmailSchema = z.object({
  token: z.string().nonempty('Token is required'),
});

export const resendVerificaionSchema = z.object({
  email: z.email().nonempty('Email is required'),
});

export const passwordResetSchema = z.object({
  email: z.email().nonempty('Email is required'),
});

export const passwordConfirmSchema = z
  .object({
    email: z.email().nonempty('Email is required'),
    token: z.string().nonempty('Token is required'),
    newPassword: z
      .string()
      .min(6, { error: 'Password must be at least 6 characters long.' })
      .nonempty('Password is required'),
    passwordConfirmation: z
      .string()
      .nonempty('Password confirmation is required'),
  })
  .superRefine((props, ctx) => {
    if (props.newPassword !== props.passwordConfirmation) {
      ctx.addIssue({
        code: 'custom',
        message: 'Password confirmation must match the new password',
        path: ['passwordConfirmation'],
      });
    }
  });
