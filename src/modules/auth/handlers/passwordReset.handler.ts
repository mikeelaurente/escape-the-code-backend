import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import * as authSchema from '../auth.schema';
import { extractValidationErrors } from '../../../helpers/validation.helper';
import { Mailer } from '../../../services/mailer.service';
import randomstring from 'randomstring';
import dayjs from 'dayjs';
import config from '../../../config/config';

export const passwordResetHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validationResult =
      await authSchema.passwordResetSchema.safeParseAsync(req.body);

    if (!validationResult.success) {
      return res.json({
        status: 'error',
        errors: extractValidationErrors(validationResult),
      });
    }

    const { email } = validationResult.data;

    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });

    if (!user) {
      return res.json({
        status: 'ok',
        message:
          'If that email address is in our database, we will send you an email to reset your password.',
      });
    }

    let passwordResetToken = user.passwordResetToken;
    const currentPasswordResetExpiration = user.passwordResetExpiration;
    let expiration: Date | null = currentPasswordResetExpiration;
    if (currentPasswordResetExpiration) {
      const now = new Date();
      const diff = now.getTime() - currentPasswordResetExpiration.getTime();
      if (diff <= 0) {
        passwordResetToken = randomstring.generate({
          length: 50,
        });
        expiration = dayjs()
          .add(config.passwordReset.expirationInMinutes, 'minutes')
          .toDate();
      }
    }
    if (!passwordResetToken) {
      passwordResetToken = randomstring.generate({
        length: 50,
      });
    }

    await db
      .update(schema.users)
      .set({
        passwordResetToken: passwordResetToken,
        passwordResetExpiration: expiration,
      })
      .where(eq(schema.users.id, user.id));

    const updatedUser = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });

    if (!updatedUser) {
      return res.json({
        status: 'error',
        error: 'Invalid request',
      });
    }

    await Mailer.sendPasswordResetEmail(updatedUser);

    return res.json({
      status: 'ok',
      message:
        'If that email address is in our database, we will send you an email to reset your password.',
    });
  } catch (error) {
    next(error);
  }
};
