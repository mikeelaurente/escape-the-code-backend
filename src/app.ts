import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: number | null;
    message?: string;
    error?: string;
    userInfo?: {
      email: string;
      firstName: string;
      lastName: string;
    };
  }
}

import express from 'express';
import userRoutes from './routes/userRoutes';
import storyRoutes from './routes/storyRoutes';
import codeRunnerRoutes from './routes/codeRunnerRoutes';
import { errorHandler } from './middlewares/errorHandler';
import path from 'path';
import { Request, Response } from 'express';
import session from 'express-session';
import { isAuthenticated } from './middlewares/isAuthenticated';
import { createUser, loginUser } from './controllers/userController';
import { validateData } from './middlewares/validationMiddleware';
import { insertUserSchema } from './db/schema';

const MySQLStore = require('express-mysql-session')(session);

const app = express();

const sessionStoreOptions = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  clearExpired: true,
  checkExpirationInterval: 900000, // How frequently expired sessions will be cleared (in milliseconds)
  expiration: 86400000,
};

const sessionStore = new MySQLStore(sessionStoreOptions);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default_session_secret', // A strong secret for signing the session ID cookie
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
      maxAge: 86400000, // Cookie expiration in milliseconds (1 day)
    },
  }),
);

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, './views'));

app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/users', isAuthenticated, userRoutes);
app.use('/api/stories', isAuthenticated, storyRoutes);
app.use('/api/runner', isAuthenticated, codeRunnerRoutes);

app.get('/', isAuthenticated, async (req: Request, res: Response) => {
  const message = req.session.message;
  req.session.message = '';
  res.render('index', {
    title: 'EscapeTheCode',
    apiUrl: 'http://localhost:' + process.env.PORT + '/api',
    userInfo: req.session.userInfo,
    message: message,
  });
});
app.get('/story', isAuthenticated, async (req: Request, res: Response) => {
  const message = req.session.message;
  req.session.message = '';
  res.render('story', {
    title: 'EscapeTheCode',
    apiUrl: 'http://localhost:' + process.env.PORT + '/api',
    message: message,
    userInfo: req.session.userInfo,
  });
});

app.get('/register', async (req: Request, res: Response) => {
  res.render('register', {
    title: 'EscapeTheCode',
    apiUrl: 'http://localhost:' + process.env.PORT + '/api',
    errors: {},
    data: {},
  });
});

app.get('/login', async (req: Request, res: Response) => {
  res.render('login', {
    title: 'EscapeTheCode',
    apiUrl: 'http://localhost:' + process.env.PORT + '/api',
    message: req.session.message || '',
    errors: {},
    data: {},
    errorMessage: '',
  });
});

app.post('/register', createUser);
app.post('/login', loginUser);

app.get('/logout', async (req: Request, res: Response) => {
  req.session.userId = null;
  const destroyed = new Promise<void>((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) {
        reject();
      } else {
        resolve();
      }
    });
  });

  await destroyed;
  res.redirect('/login');
});

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;
