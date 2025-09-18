import { Router } from 'express';
import { registerUser, loginUser, getMe } from '../controllers/authController';
import { isAuthenticated } from '../middlewares/isAuthenticated';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', isAuthenticated, getMe);

export default router;
