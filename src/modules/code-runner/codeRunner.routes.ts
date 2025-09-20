import { Router } from 'express';
import * as handlers from './handlers';

const router = Router();

router.post('/run', handlers.runCodeHandler);

export default router;
