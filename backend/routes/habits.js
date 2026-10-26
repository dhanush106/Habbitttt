import { Router } from 'express';
import {
  createHabit,
  deleteHabit,
  listHabits,
  setHabitCompletion,
  updateHabit,
} from '../controllers/habitController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.route('/').get(listHabits).post(createHabit);
router.patch('/:habitId/completions', setHabitCompletion);
router.route('/:habitId').patch(updateHabit).delete(deleteHabit);

export default router;