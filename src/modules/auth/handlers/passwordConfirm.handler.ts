import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { and, eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import * as authSchema from '../auth.schema';
import { extractValidationErrors } from '../../../helpers/validation.helper';
import { Mailer } from '../../../services/mailer.service';
import randomstring from 'randomstring';
import dayjs from 'dayjs';
import config from '../../../config/config';

export const passwordConfirmHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validationResult =
      await authSchema.passwordConfirmSchema.safeParseAsync(req.body);

    if (!validationResult.success) {
      return res.json({
        status: 'error',
        errors: extractValidationErrors(validationResult),
      });
    }

    const { email, token, newPassword } = validationResult.data;

    const user = await db.query.users.findFirst({
      where: and(
        eq(schema.users.email, email),
        eq(schema.users.passwordResetToken, token),
      ),
    });

    if (!user) {
      return res.json({
        status: 'error',
        error: 'Invalid request',
      });
    }

    if (!user.passwordResetExpiration) {
      return res.json({
        status: 'error',
        error: 'Invalid request.',
      });
    }

    const expiration = user.passwordResetExpiration;
    const now = new Date();
    const diff = now.getTime() - expiration.getTime();
    if (diff <= 0) {
      return res.json({
        status: 'error',
        message: 'The password reset token has expired.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db
      .update(schema.users)
      .set({
        hashedPassword: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiration: null,
      })
      .where(eq(schema.users.id, user.id));

    return res.json({
      status: 'ok',
      message: 'Password reset successful',
    });
  } catch (error) {
    next(error);
  }
};
