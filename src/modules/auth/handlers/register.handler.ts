import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import * as authSchema from '../auth.schema';
import { extractValidationErrors } from '../../../helpers/validation.helper';
import { Mailer } from '../../../services/mailer.service';
import randomstring from 'randomstring';

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
        status: 'error',
        code: 'email_taken',
        error: 'Email is already registered',
      });
    }

    let salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationToken = randomstring.generate({
      length: 50,
    });

    await db.insert(schema.users).values({
      email,
      hashedPassword,
      firstName,
      lastName,
      verificationToken,
      verified: schema.VerificationStatus.NotVerified,
    });

    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });

    if (!user) {
      return res.json({
        status: 'error',
        message: 'Registration failed.',
      });
    }

    await Mailer.sendVerificationEmail(user);

    return res.json({
      status: 'ok',
      message: 'Please check your email to verify your account',
    });
  } catch (error) {
    next(error);
  }
};
