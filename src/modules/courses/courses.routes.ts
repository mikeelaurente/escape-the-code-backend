import { Router } from 'express';
import * as handlers from './handlers';

const router = Router();

router.get('/', handlers.getCoursesHandler);
router.get('/:course/progress', handlers.getCourseProgressHandler);
router.get('/chapters/:chapter/sections', handlers.getChapterSectionsHandler);
router.get('/next-section', handlers.getNextSectionHandler);
router.get('/progress', handlers.getProgressHandler);
router.get('/ranking', handlers.getUserRanksHandler);
router.get('/user-stats/:id', handlers.getUserStatsHandler);
router.get('/:id', handlers.getCourseHandler);

export default router;
