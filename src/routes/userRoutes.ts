import { Router } from 'express';
import {
  createUser,
  getUsers,
  getUserById,
} from '../controllers/userController';

const router = Router();

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', createUser);

export default router;
