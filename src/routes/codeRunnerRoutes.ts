import { Router } from 'express';
import { tryRunCode } from '../controllers/codeRunnerController';

const router = Router();

router.post('/run', tryRunCode);

export default router;
