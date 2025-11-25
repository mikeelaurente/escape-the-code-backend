import { Request, Response, NextFunction } from 'express';
import { getUserRanking } from '../../../db/repositories/user.repository';

export const getUserRanksHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log('###################################');
    const ranking = await getUserRanking();

    res.json({
      status: 'ok',
      data: ranking,
    });
  } catch (error) {
    next(error);
  }
};
