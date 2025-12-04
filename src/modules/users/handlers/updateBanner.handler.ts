import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import { eq } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { resolveBanner } from '../../../helpers/image.helper';

export const updateBannerHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.user?.id);
    const banner = req.file;

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
        bannerUrl: `/uploads/banners/${banner?.filename}`,
      })
      .where(eq(schema.users.id, userId));

    return res.json({
      status: 'ok',
      message: 'Banner has been updated successfully',
      data: {
        banner: resolveBanner(banner?.filename || 'banner.png'),
      },
    });
  } catch (e) {
    return next(e);
  }
};
