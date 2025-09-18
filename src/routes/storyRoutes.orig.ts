import { Router } from 'express';
import {
  getChallengeHints,
  getStory,
  submitAnswer,
  buyHint,
  getSection,
} from '../controllers/storyController';

const router = Router();

router.get('/', getStory);
router.get('/challenges/:id/hints', getChallengeHints);
router.post('/challenges/:id/answer', submitAnswer);
router.post('/challenges/:id/buy-hint', buyHint);
router.get('/sections/:id', getSection);

export default router;
