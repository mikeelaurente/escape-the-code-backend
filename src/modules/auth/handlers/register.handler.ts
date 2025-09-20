import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import * as authSchema from '../auth.schema';
import { extractValidationErrors } from '../../../helpers/validation.helper';

export const registerHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validationResult = await authSchema.registerUserSchema.safeParseAsync(
      req.body,
    );

    if (!validationResult.success) {
      return res.json({
        status: 'error',
        errors: extractValidationErrors(validationResult),
      });
    }

    const { email, password, firstName, lastName } = validationResult.data;

    const existingUser = await db.query.users.findFirst({
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

    await db.insert(schema.users).values({
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
