import { Request, Response, NextFunction } from 'express';
import {
  getSectionAnswersWithHints,
  getUserRankingFor,
} from '../../../db/repositories/user.repository';

export const getDashboardHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.user?.id);
    const ranking = await getUserRankingFor(userId);
    const sectionAnswersWithHints = await getSectionAnswersWithHints(userId);

    return res.json({
      status: 'ok',
      data: {
        ranking: ranking,
        progress: {
          data: sectionAnswersWithHints.data,
          grouped: Object.values(sectionAnswersWithHints.grouped),
        },
      },
    });
  } catch (e) {
    return next(e);
  }
};
