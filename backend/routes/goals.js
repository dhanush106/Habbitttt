import { Router } from 'express';
import {
  createGoal,
  deleteGoal,
  listGoals,
  setGoalEntry,
  updateGoal,
} from '../controllers/goalController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.route('/').get(listGoals).post(createGoal);
router.put('/:goalId/entries/:date', setGoalEntry);
router.route('/:goalId').patch(updateGoal).delete(deleteGoal);

export default router;