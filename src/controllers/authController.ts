import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';
import * as jwtHelper from '../helpers/jwt.helper';

const createUserSchema = z.object({
  firstName: z.string().nonempty('Firstname is required'),
  lastName: z
    .string({
      error: 'Lastname is required',
    })
    .nonempty('Lastname is required'),
  email: z.email().nonempty(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.email().nonempty('Email is required'),
  password: z.string().min(3),
});

// User CRUD operations
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validationResult = await createUserSchema.safeParseAsync(req.body);

    if (!validationResult.success) {
      return res.json({
        status: 'error',
        errors: validationResult.error.issues.reduce(
          (acc, cur) => ({
            ...acc,
            [cur.path.join('.')]: cur.message,
          }),
          {},
        ),
      });
    }

    const email = validationResult.data.email;
    const password = validationResult.data.password;
    const firstName = validationResult.data.firstName;
    const lastName = validationResult.data.lastName;

    const existingUser = await db().query.users.findFirst({
      where: eq(schema.users.email, email),
    });

    if (existingUser) {
      return res.json({
        status: 'conflict',
        error: 'Email is already registered',
      });
    }

    let salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await db().insert(schema.users).values({
      email,
      hashedPassword,
      firstName,
      lastName,
    });

    return res.json({
      status: 'ok',
      message: 'You are now registered!',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = Number(req.user?.id);
  const user = await db().query.users.findFirst({
    where: eq(schema.users.id, userId),
  });

  if (!user) {
    return res.status(401).json({
      message: 'Unauthorized',
    });
  }

  return res.json({
    status: 'ok',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    },
  });
};

// User CRUD operations
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validationResult = await loginSchema.safeParseAsync(req.body);

    if (!validationResult.success) {
      return res.json({
        status: 'error',
        errors: validationResult.error.issues.reduce(
          (acc, cur) => ({
            ...acc,
            [cur.path.join('.')]: cur.message,
          }),
          {},
        ),
      });
    }

    const email = validationResult.data.email;
    const password = validationResult.data.password;

    const user = await db().query.users.findFirst({
      where: eq(schema.users.email, email),
    });

    console.log('user', user);

    if (!user) {
      return res.json({
        status: 'invalid',
        error: 'Invalid credentials',
      });
    }

    if (!(await bcrypt.compare(password, user.hashedPassword!))) {
      return res.json({
        status: 'invalid',
        error: 'Invalid credentials',
      });
    }

    const accessToken = await jwtHelper.generateToken(user.id);

    return res.json({
      status: 'ok',
      message: 'Welcome to EscapeTheCode!',
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
    });
  } catch (error) {
    console.log('error', error);
    next(error);
  }
};
