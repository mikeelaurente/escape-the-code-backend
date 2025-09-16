import { Router } from 'express';
import {
  getChallengeHints,
  getStories,
  submitAnswer,
  buyHint,
} from '../controllers/storyController';

const router = Router();

router.get('/', getStories);
router.get('/challenges/:id/hints', getChallengeHints);
router.post('/challenges/:id/answer', submitAnswer);
router.post('/challenges/:id/buy-hint', buyHint);

export default router;
