import express from 'express';
import userRoutes from './routes/userRoutes';
import storyRoutes from './routes/storyRoutes';
import { errorHandler } from './middlewares/errorHandler';
import path from 'path';
import { Request, Response } from 'express';

const app = express();

app.use(express.json());
app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, './views'));

app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/stories', storyRoutes);

app.get('/', async (req: Request, res: Response) => {
  res.render('index', {
    title: 'My Express EJS App',
    apiUrl: 'http://localhost:' + process.env.PORT + '/api',
  });
});

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;
