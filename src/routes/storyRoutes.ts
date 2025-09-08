import { Router } from 'express';
import { getStories } from '../controllers/storyController';

const router = Router();

router.get('/', getStories);

export default router;
