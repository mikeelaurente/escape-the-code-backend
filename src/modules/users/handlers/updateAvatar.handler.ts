import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import { eq } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { resolveAvatar } from '../../../helpers/image.helper';

export const updateAvatarHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.user?.id);
    const avatar = req.file;

    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user) {
      return res.json({
        status: 'errror',
        message: 'User not found',
      });
    }

    const result = await db
      .update(schema.users)
      .set({
        photoUrl: `/uploads/avatars/${avatar?.filename}`,
      })
      .where(eq(schema.users.id, userId));

    return res.json({
      status: 'ok',
      message: 'Profile photo has been updated successfully',
      data: {
        avatar: resolveAvatar(avatar?.filename || 'default'),
      },
    });
  } catch (e) {
    return next(e);
  }
};
