import { Request, Response, NextFunction } from 'express';
import * as usersSchema from '../users.schema';
import { extractValidationErrors } from '../../../helpers/validation.helper';
import { db } from '../../../db';
import { eq } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import * as bcrypt from 'bcryptjs';

export const changePasswordHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validationResult =
      await usersSchema.changePasswordSchema.safeParseAsync(req.body);

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

    const { oldPassword, newPassword, confirmPassword } = validationResult.data;

    if (!(await bcrypt.compare(oldPassword, user.hashedPassword!))) {
      return res.json({
        status: 'error',
        error: 'Wrong password.',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.json({
        status: 'error',
        error: 'The password confirmation does not match the new password.',
      });
    }

    let salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db
      .update(schema.users)
      .set({
        hashedPassword: hashedPassword,
      })
      .where(eq(schema.users.id, userId));

    return res.json({
      status: 'ok',
      message: 'Password has been updated successfully',
    });
  } catch (e) {
    return next(e);
  }
};
