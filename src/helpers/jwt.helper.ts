import * as jwt from 'jsonwebtoken';

export const generateToken = (userId: number) => {
  const privateKey = process.env.JWT_SECRET!;
  return new Promise<string>((resolve, reject) => {
    jwt.sign(
      { id: userId },
      privateKey,
      { algorithm: 'HS256' },
      function (err, token) {
        if (err) {
          reject(err);
        } else {
          resolve(token!);
        }
      },
    );
  });
};

export const verify = <TReturn = {}>(token: string) => {
  const privateKey = process.env.JWT_SECRET!;
  return new Promise<TReturn>((resolve, reject) => {
    jwt.verify(token, privateKey, function (err, decoded) {
      if (err) {
        reject(err);
      } else {
        resolve(decoded as TReturn);
      }
    });
  });
};
