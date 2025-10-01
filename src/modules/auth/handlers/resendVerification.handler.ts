import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import * as authSchema from '../auth.schema';
import { extractValidationErrors } from '../../../helpers/validation.helper';
import { Mailer } from '../../../services/mailer.service';
import randomstring from 'randomstring';

export const verificationResendHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validationResult =
      await authSchema.resendVerificaionSchema.safeParseAsync(req.body);

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
          'If that email address is in our database, we will send you an email to verify your account.',
      });
    }

    if (!user.verificationToken) {
      const verificationToken = randomstring.generate({
        length: 50,
      });

      await db
        .update(schema.users)
        .set({
          verificationToken: verificationToken,
        })
        .where(eq(schema.users.id, user.id));

      user.verificationToken = verificationToken;
    }

    await Mailer.sendVerificationEmail(user);

    return res.json({
      status: 'ok',
      message:
        'If that email address is in our database, we will send you an email to verify your account.',
    });
  } catch (error) {
    next(error);
  }
};
