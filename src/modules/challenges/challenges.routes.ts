import { Router } from 'express';
import * as handlers from './handlers';

const router = Router();

router.get('/:id/hints', handlers.getChallengeHintsHandler);
router.post('/:id/start', handlers.startChallengeHandler);
router.post('/:id/complete', handlers.completeChallengeHandler);
router.post('/:id/answer', handlers.submitAnswerHandler);
router.post('/:id/buy-hint', handlers.buyHintHandler);

export default router;
