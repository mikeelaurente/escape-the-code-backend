import { Request, Response, NextFunction } from 'express';
import * as jwtHelper from '../helpers/jwt.helper';

export async function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization || '';
  const parts = authorization.split(' ');
  if (parts.length !== 2) {
    return res.status(401).json({
      status: 'unauthorized',
      error: 'Unauthorized',
    });
  }
  const accessToken = parts[1];
  if (!accessToken || accessToken.length === 0) {
    return res.status(401).json({
      status: 'unauthorized',
      error: 'Unauthorized',
    });
  }

  try {
    const decoded = await jwtHelper.verify<{ id: number }>(accessToken);
    console.log('decode', decoded);

    req.user = {
      id: decoded.id,
      email: '',
    };

    return next();
  } catch (e) {
    console.log(e);
  }
  return res.status(401).json({
    status: 'unauthorized',
    error: 'Unauthorized',
  });
}
