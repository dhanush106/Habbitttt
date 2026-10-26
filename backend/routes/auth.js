import { Router } from 'express';
import {
  changePassword,
  getCurrentUser,
  login,
  register,
  updateProfile,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getCurrentUser);
router.patch('/me', requireAuth, updateProfile);
router.patch('/password', requireAuth, changePassword);

export default router;