import express from 'express';

import coursesRoutes from './modules/courses/courses.routes';
import sectionsRoutes from './modules/sections/sections.routes';
import userRoutes from './modules/users/users.routes';
import codeRunnerRoutes from './modules/code-runner/codeRunner.routes';
import authRoutes from './modules/auth/auth.routes';
import challengesRoutes from './modules/challenges/challenges.routes';
import achievementsRoutes from './modules/achievements/achievements.routes';
import { errorHandler } from './middlewares/errorHandler';
import path from 'path';
import { isAuthenticated } from './middlewares/isAuthenticated';
import cors from 'cors';
import { setRootPath } from './helpers/template.helper';

setRootPath(__dirname);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../', 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', isAuthenticated, userRoutes);
app.use('/api/courses', isAuthenticated, coursesRoutes);
app.use('/api/sections', isAuthenticated, sectionsRoutes);
app.use('/api/challenges', isAuthenticated, challengesRoutes);
app.use('/api/runner', isAuthenticated, codeRunnerRoutes);
app.use('/api/achievements', isAuthenticated, achievementsRoutes);

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;
