import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import * as authSchema from '../auth.schema';
import { extractValidationErrors } from '../../../helpers/validation.helper';
import * as jwtHelper from '../../../helpers/jwt.helper';
import { resolveAvatar, resolveBanner } from '../../../helpers/image.helper';

export const loginHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validationResult = await authSchema.loginSchema.safeParseAsync(
      req.body,
    );

    if (!validationResult.success) {
      return res.json({
        status: 'error',
        errors: extractValidationErrors(validationResult),
      });
    }

    const { email, password } = validationResult.data;

    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });

    if (!user) {
      return res.json({
        status: 'error',
        code: 'invalid_credentials',
        error: 'Invalid credentials',
      });
    }

    if (!user.verified) {
      return res.json({
        status: 'error',
        code: 'not_verified',
        error: 'Please verify your account before logging in.',
      });
    }

    if (!(await bcrypt.compare(password, user.hashedPassword!))) {
      return res.json({
        status: 'error',
        code: 'invalid_credentials',
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
          avatar: resolveAvatar(user.photoUrl || 'default'),
          banner: resolveBanner(user.bannerUrl || 'default'),
          credits: user.credits,
          about: user.about,
        },
      },
    });
  } catch (error) {
    console.log('error', error);
    next(error);
  }
};
