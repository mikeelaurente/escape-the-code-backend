import { Router } from 'express';
import { isAuthenticated } from '../../middlewares/isAuthenticated';
import * as handlers from './handlers';

const router = Router();

router.post('/register', handlers.registerHandler);
router.post('/login', handlers.loginHandler);
router.post('/verification-confirm', handlers.verificationConfirmHandler);
router.post('/verification-resend', handlers.verificationResendHandler);
router.post('/password-reset', handlers.passwordResetHandler);
router.post('/password-confirm', handlers.passwordConfirmHandler);
router.get('/me', isAuthenticated, handlers.getMeHandler);

export default router;
