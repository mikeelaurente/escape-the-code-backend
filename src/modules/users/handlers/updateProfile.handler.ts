import { Request, Response, NextFunction } from 'express';
import * as usersSchema from '../users.schema';
import { extractValidationErrors } from '../../../helpers/validation.helper';
import { db } from '../../../db';
import { eq } from 'drizzle-orm';
import * as schema from '../../../db/schema';

export const updateProfileHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validationResult =
      await usersSchema.updateProfileSchema.safeParseAsync(req.body);

    if (!validationResult.success) {
      return res.json({
        status: 'error',
        errors: extractValidationErrors(validationResult),
      });
    }

    const userId = Number(req.user?.id);

    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user) {
      return res.json({
        status: 'errror',
        message: 'User not found',
      });
    }

    const { firstName, lastName, email, about } = validationResult.data;

    const existingUserByEmail = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });
    if (existingUserByEmail && existingUserByEmail.id !== user.id) {
      return res.json({
        status: 'error',
        code: 'email_taken',
        message: 'Email is already taken',
      });
    }

    const result = await db
      .update(schema.users)
      .set({
        firstName: firstName,
        lastName: lastName,
        email: email,
        about: about || '',
      })
      .where(eq(schema.users.id, userId));

    return res.json({
      status: 'ok',
      message: 'Profile has been updated successfully',
      data: {
        firstName,
        lastName,
        email,
      },
    });
  } catch (e) {
    return next(e);
  }
};
