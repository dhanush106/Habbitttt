import { Router } from 'express';
import {
  createFitnessGoal,
  createWorkout,
  deleteFitnessGoal,
  deleteMeasurement,
  deleteWorkout,
  getFitnessDashboard,
  upsertMeasurement,
} from '../controllers/fitnessController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/dashboard', getFitnessDashboard);
router.post('/workouts', createWorkout);
router.delete('/workouts/:workoutId', deleteWorkout);
router.put('/measurements/:type/:date', upsertMeasurement);
router.delete('/measurements/:measurementId', deleteMeasurement);
router.post('/goals', createFitnessGoal);
router.delete('/goals/:goalId', deleteFitnessGoal);

export default router;