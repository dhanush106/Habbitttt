import { Router } from 'express';
import {
  createDailyGoal,
  createProblem,
  deleteDailyGoal,
  deleteProblem,
  getDashboard,
  updateDailyGoal,
  updateDailyTarget,
  updateProblem,
  updateTopicTarget,
} from '../controllers/leettrackController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/dashboard', getDashboard);
router.patch('/preferences', updateDailyTarget);
router.post('/problems', createProblem);
router.patch('/problems/:problemId', updateProblem);
router.delete('/problems/:problemId', deleteProblem);
router.post('/goals', createDailyGoal);
router.patch('/goals/:goalId', updateDailyGoal);
router.delete('/goals/:goalId', deleteDailyGoal);
router.put('/topics/:topic/target', updateTopicTarget);

export default router;