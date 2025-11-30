import { Request, Response, NextFunction } from 'express';
import { getUserRanking, RankingRequestSchema } from '../../../db/repositories/user.repository';
import QueryString from 'qs';
import { extractValidationErrors } from '../../../helpers/validation.helper';

export const getUserRanksHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {

    const url = new URL(req.host + req.originalUrl);
    const queryParams = QueryString.parse(url?.searchParams.toString() || '');

    const result = RankingRequestSchema.safeParse(queryParams);
    if (!result.success) {
      return res.json({
        status: 'error',
        errors: extractValidationErrors(result),
      });
    }

    const ranking = await getUserRanking(result.data);

    res.json({
      status: 'ok',
      data: ranking.data,
      meta: {
        limit: ranking.limit,
        page: ranking.page,
        total: ranking.total,
        offset: (ranking.page - 1) * ranking.limit
      }
    });
  } catch (error) {
    next(error);
  }
};
