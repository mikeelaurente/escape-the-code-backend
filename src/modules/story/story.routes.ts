import { Router } from 'express';
import * as handlers from './handlers';

const router = Router();

router.get('/', handlers.getStoryHandler);
router.get('/chapters/:chapter/sections', handlers.getChapterSectionsHandler);
router.get('/challenges/:id/hints', handlers.getChallengeHintsHandler);
router.post('/challenges/:id/answer', handlers.submitAnswerHandler);
router.post('/challenges/:id/buy-hint', handlers.buyHintHandler);
router.get('/sections/:id', handlers.getSectionHandler);
router.get('/next-section', handlers.getNextSectionHandler);
router.get('/progress', handlers.getProgressHandler);

export default router;
