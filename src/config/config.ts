import * as dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  domainName: string;
  frontendUrl: string;
  mail: {
    from: string;
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string | undefined;
      password: string | undefined;
    };
  };
  passwordReset: {
    expirationInMinutes: number;
  };
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || '',
  domainName:
    process.env.DOMAIN_NAME || 'http://localhost:' + (process.env.PORT || 3000),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5000',
  mail: {
    host: process.env.MAIL_HOST || 'localhost',
    port: process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : 1025,
    from: process.env.MAIL_FROM || 'admin@escapethecode.com',
    secure: process.env.MAIL_SECURE ? process.env.MAIL_SECURE == 'true' : false,
    auth: {
      user: process.env.MAIL_USER,
      password: process.env.MAIL_PASSWORD,
    },
  },
  passwordReset: {
    expirationInMinutes: process.env.PASSWORD_RESET_EXPIRATION_IN_MINUTES
      ? Number(process.env.PASSWORD_RESET_EXPIRATION_IN_MINUTES)
      : 30,
  },
};

export default config;
