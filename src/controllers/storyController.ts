import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';

export const createStories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const title = req.body.title;
    const description = req.body.description;
    const rewardOptions = req.body.rewardOptions;
  } catch (error) {
    next(error);
  }
};

export const getStories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const stories = await db().query.stories.findMany({
      with: {
        chapters: {
          with: {
            sections: {
              with: {
                challenges: true,
              },
            },
          },
        },
      },
    });
    res.json(stories);
  } catch (error) {
    next(error);
  }
};
