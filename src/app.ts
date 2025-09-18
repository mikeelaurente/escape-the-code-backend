declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
      };
    }
  }
}

import express from 'express';

import userRoutes from './routes/userRoutes';
import storyRoutes from './routes/storyRoutes';
import codeRunnerRoutes from './routes/codeRunnerRoutes';
import authRoutes from './routes/authRoutes';
import { errorHandler } from './middlewares/errorHandler';
import path from 'path';
import { Request, Response } from 'express';
import { isAuthenticated } from './middlewares/isAuthenticated';
import { createUser, loginUser } from './controllers/userController';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, './views'));

app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
// app.use('/api/users', isAuthenticated, userRoutes);
app.use('/api/story', isAuthenticated, storyRoutes);
app.use('/api/runner', isAuthenticated, codeRunnerRoutes);

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;
