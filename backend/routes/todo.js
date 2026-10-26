import { Router } from 'express';
import {
  createDailyGoal,
  createTask,
  deleteDailyGoal,
  deleteTask,
  getTodoDashboard,
  updateDailyGoal,
  updateTask,
} from '../controllers/todoController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/dashboard', getTodoDashboard);
router.post('/tasks', createTask);
router.patch('/tasks/:taskId', updateTask);
router.delete('/tasks/:taskId', deleteTask);
router.post('/goals', createDailyGoal);
router.patch('/goals/:goalId', updateDailyGoal);
router.delete('/goals/:goalId', deleteDailyGoal);

export default router;