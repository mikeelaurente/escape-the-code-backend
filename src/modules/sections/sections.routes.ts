import { Router } from 'express';
import * as handlers from './handlers';

const router = Router();

router.get('/', handlers.getSectionsHandler);
router.get('/:id', handlers.getSectionHandler);

export default router;
