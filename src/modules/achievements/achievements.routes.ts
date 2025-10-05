import { Router } from 'express';
import * as handlers from './handlers';

const router = Router();
router.get('/', handlers.getAchievementsHandler);
router.get('/user', handlers.getUserAchievementsHandler);

export default router;
