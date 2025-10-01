import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { resolveAvatar, resolveBanner } from '../../../helpers/image.helper';

export const getMeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = Number(req.user?.id);
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
  });

  if (!user) {
    return res.status(401).json({
      status: 'error',
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
        avatar: resolveAvatar(user.photoUrl || ''),
        banner: resolveBanner(user.bannerUrl || ''),
        about: user.about,
      },
    },
  });
};
