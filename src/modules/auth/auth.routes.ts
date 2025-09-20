import { Router } from 'express';
import { isAuthenticated } from '../../middlewares/isAuthenticated';
import * as handlers from './handlers';

const router = Router();

router.post('/register', handlers.registerHandler);
router.post('/login', handlers.loginHandler);
router.get('/me', isAuthenticated, handlers.getMeHandler);

export default router;
