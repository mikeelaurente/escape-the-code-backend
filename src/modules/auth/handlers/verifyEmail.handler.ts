import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import * as authSchema from '../auth.schema';
import { extractValidationErrors } from '../../../helpers/validation.helper';
import * as jwtHelper from '../../../helpers/jwt.helper';
import { resolveAvatar, resolveBanner } from '../../../helpers/image.helper';

export const verificationConfirmHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validationResult = await authSchema.verifyEmailSchema.safeParseAsync(
      req.body,
    );

    if (!validationResult.success) {
      return res.json({
        status: 'error',
        errors: extractValidationErrors(validationResult),
      });
    }

    const { token } = validationResult.data;

    const user = await db.query.users.findFirst({
      where: eq(schema.users.verificationToken, token),
    });

    console.log('user', user);

    if (!user) {
      return res.json({
        status: 'error',
        error: 'Invalid Token',
      });
    }

    await db
      .update(schema.users)
      .set({
        verified: schema.VerificationStatus.Verified,
        verifiedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id));

    return res.json({
      status: 'ok',
      message: 'Email has been verified!',
    });
  } catch (error) {
    console.log('error', error);
    next(error);
  }
};
