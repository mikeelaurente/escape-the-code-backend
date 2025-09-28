import { Router } from 'express';
import * as handlers from './handlers';

const router = Router();

router.get('/', handlers.getStoryHandler);
router.get('/chapters/:chapter/sections', handlers.getChapterSectionsHandler);
router.get('/sections/:id', handlers.getSectionHandler);
router.get('/next-section', handlers.getNextSectionHandler);
router.get('/progress', handlers.getProgressHandler);
router.get('/ranking', handlers.getUserRanksHandler);
router.get('/user-stats/:id', handlers.getUserStatsHandler);

export default router;
