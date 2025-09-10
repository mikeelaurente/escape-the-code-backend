import { Router } from 'express';
import {
  getChallengeHints,
  getStories,
  submitAnswer,
} from '../controllers/storyController';

const router = Router();

router.get('/', getStories);
router.get('/challenges/:id/hints', getChallengeHints);
router.post('/challenges/:id/answer', submitAnswer);

export default router;
