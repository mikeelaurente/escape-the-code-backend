import { Request, Response, NextFunction } from 'express';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import * as storyRepo from '../../../db/repositories/story.repository';

export const getNextSectionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = Number(req.user?.id);

  const nextSection = await storyRepo.getNextSectionFor(userId);
  console.log(nextSection);

  return res.json(nextSection);
};
