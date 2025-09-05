import express from 'express';
import itemRoutes from './routes/itemRoutes';
import { errorHandler } from './middlewares/errorHandler';
import path from 'path';
import { Request, Response } from 'express';
import { db } from './db';

const app = express();

app.use(express.json());
app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, './views'));

// Routes
app.use('/api/users', itemRoutes);

app.get('/', async (req: Request, res: Response) => {
  res.render('index', {
    title: 'My Express EJS App',
  });
});

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;
