import { Request, Response, NextFunction } from 'express';
import { getUserRankingFor } from '../../../db/repositories/user.repository';
import { getNextSectionFor } from '../../../db/repositories/story.repository';

export const getUserStatsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.params.id);
    const userRank = await getUserRankingFor(userId);
    const nextSection = await getNextSectionFor(userId);

    res.json({
      status: 'ok',
      data: { rank: userRank, nextSection: nextSection },
    });
  } catch (e) {
    return next(e);
  }
};
