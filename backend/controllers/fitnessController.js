import BodyMeasurement from '../models/BodyMeasurement.js';
import FitnessGoal from '../models/FitnessGoal.js';
import Workout from '../models/Workout.js';
import { isDateKey, isValidRange } from '../utils/dates.js';

const measurementUnits = { weight: 'kg', bmi: 'kg/m2', bodyFat: '%', muscleMass: 'kg', waterIntake: 'L' };
const workoutUnits = ['km', 'reps', 'min', 'workouts'];

export const calculateFitnessGoal = (goal, workouts, latestWeight) => {
  if (goal.kind === 'weight') {
    const current = latestWeight?.value ?? goal.startValue ?? 0;
    const start = goal.startValue ?? current;
    const span = Math.abs(start - goal.target);
    const moved = goal.target <= start ? start - current : current - start;
    const percentage = span ? Math.max(0, Math.min(100, (moved / span) * 100)) : 0;
    const completed = goal.target <= start ? current <= goal.target : current >= goal.target;
    return { progress: current, percentage: Math.round(percentage), status: completed ? 'completed' : 'in_progress' };
  }

  const matching = workouts.filter((workout) =>
    workout.date >= goal.startDate && workout.date <= goal.endDate &&
    (!goal.exercise || workout.exercise.toLowerCase() === goal.exercise.toLowerCase())
  );
  const progress = goal.unit === 'workouts'
    ? matching.length
    : matching.reduce((total, workout) => total + (workout.unit === goal.unit ? workout.amount : 0), 0);
  return {
    progress,
    percentage: Math.min(100, Math.round((progress / goal.target) * 100)),
    status: progress >= goal.target ? 'completed' : progress > 0 ? 'in_progress' : 'not_started',
  };
};

export const getFitnessDashboard = async (req, res) => {
  const { startDate, endDate } = req.query;
  if (!isValidRange(startDate, endDate)) {
    return res.status(400).json({ message: 'Provide a valid startDate and endDate range.' });
  }
  const historyStart = new Date(`${endDate}T00:00:00.000Z`);
  historyStart.setUTCDate(historyStart.getUTCDate() - 365);
  const historyStartKey = historyStart.toISOString().slice(0, 10);
  const [workouts, measurements, goals] = await Promise.all([
    Workout.find({ user: req.userId, date: { $gte: startDate, $lte: endDate } }).sort({ date: -1, createdAt: -1 }).limit(100),
    BodyMeasurement.find({ user: req.userId, date: { $gte: historyStartKey, $lte: endDate } }).sort({ date: -1, createdAt: -1 }).limit(1000),
    FitnessGoal.find({
      user: req.userId,
      $or: [{ kind: 'weight' }, { startDate: { $lte: endDate }, endDate: { $gte: startDate } }],
    }).sort({ createdAt: 1 }),
  ]);

  const latestByType = {};
  for (const measurement of measurements) {
    if (!latestByType[measurement.type]) latestByType[measurement.type] = measurement;
  }
  const dailyActivity = new Map();
  for (const workout of workouts) {
    const daily = dailyActivity.get(workout.date) ?? { date: workout.date, workouts: 0, calories: 0, durationMinutes: 0 };
    daily.workouts += 1;
    daily.calories += workout.calories;
    daily.durationMinutes += workout.durationMinutes;
    dailyActivity.set(workout.date, daily);
  }
  res.json({
    workouts,
    measurements: Object.values(latestByType),
    weightHistory: measurements.filter((measurement) => measurement.type === 'weight').reverse(),
    goals: goals.map((goal) => ({ ...goal.toObject(), ...calculateFitnessGoal(goal, workouts, latestByType.weight) })),
    summary: {
      workouts: workouts.length,
      calories: workouts.reduce((total, workout) => total + workout.calories, 0),
      activeDays: dailyActivity.size,
      durationMinutes: workouts.reduce((total, workout) => total + workout.durationMinutes, 0),
      dailyActivity: [...dailyActivity.values()].sort((a, b) => a.date.localeCompare(b.date)),
    },
  });
};

export const createWorkout = async (req, res) => {
  const { exercise, category = 'Other', details = '', amount, unit, durationMinutes = 0, calories = 0, date } = req.body;
  if (typeof exercise !== 'string' || !exercise.trim() || exercise.length > 80) {
    return res.status(400).json({ message: 'Exercise name is required and must be at most 80 characters.' });
  }
  if (!Number.isFinite(amount) || amount <= 0 || !workoutUnits.includes(unit)) {
    return res.status(400).json({ message: 'Provide a positive amount and supported unit.' });
  }
  if (!['Cardio', 'Strength', 'Core', 'Mobility', 'Other'].includes(category)) {
    return res.status(400).json({ message: 'Choose a supported workout category.' });
  }
  if (!isDateKey(date) || !Number.isFinite(durationMinutes) || durationMinutes < 0 || !Number.isFinite(calories) || calories < 0) {
    return res.status(400).json({ message: 'Provide a valid date, duration, and calorie count.' });
  }
  const workout = await Workout.create({
    user: req.userId,
    exercise: exercise.trim(),
    category,
    details: typeof details === 'string' ? details.trim() : '',
    amount,
    unit,
    durationMinutes,
    calories,
    date,
  });
  res.status(201).json({ workout });
};

export const deleteWorkout = async (req, res) => {
  const workout = await Workout.findOneAndDelete({ _id: req.params.workoutId, user: req.userId });
  if (!workout) return res.status(404).json({ message: 'Workout not found.' });
  res.json({ message: 'Workout deleted.' });
};

export const upsertMeasurement = async (req, res) => {
  const { type, date } = req.params;
  const { value } = req.body;
  const unit = measurementUnits[type];
  if (!unit || !isDateKey(date) || !Number.isFinite(value) || value <= 0) {
    return res.status(400).json({ message: 'Provide a supported measurement, valid date, and positive value.' });
  }
  const measurement = await BodyMeasurement.findOneAndUpdate(
    { user: req.userId, type, date },
    { $set: { value, unit } },
    { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
  );
  res.json({ measurement });
};

export const deleteMeasurement = async (req, res) => {
  const measurement = await BodyMeasurement.findOneAndDelete({ _id: req.params.measurementId, user: req.userId });
  if (!measurement) return res.status(404).json({ message: 'Measurement not found.' });
  res.json({ message: 'Measurement deleted.' });
};

export const createFitnessGoal = async (req, res) => {
  const { name, kind = 'activity', exercise = '', target, unit, startDate, endDate } = req.body;
  if (typeof name !== 'string' || !name.trim() || !Number.isFinite(target) || target <= 0) {
    return res.status(400).json({ message: 'Goal name and a positive target are required.' });
  }
  if (!isValidRange(startDate, endDate)) {
    return res.status(400).json({ message: 'Provide a valid goal date range.' });
  }

  if (kind === 'weight') {
    if (unit !== 'kg' || !['weight', 'kg'].includes(exercise)) {
      return res.status(400).json({ message: 'Weight goals use kg and exercise "weight".' });
    }
    const latestWeight = await BodyMeasurement.findOne({ user: req.userId, type: 'weight' }).sort({ date: -1 });
    if (!latestWeight) return res.status(400).json({ message: 'Log a weight measurement before setting a weight goal.' });
    const goal = await FitnessGoal.create({ user: req.userId, name: name.trim(), kind, exercise: 'weight', target, unit, startValue: latestWeight.value, startDate, endDate });
    return res.status(201).json({ goal: { ...goal.toObject(), ...calculateFitnessGoal(goal, [], latestWeight) } });
  }
  if (kind !== 'activity' || !workoutUnits.includes(unit) || (exercise && typeof exercise !== 'string')) {
    return res.status(400).json({ message: 'Provide a supported activity goal and unit.' });
  }
  const goal = await FitnessGoal.create({ user: req.userId, name: name.trim(), kind, exercise: exercise.trim(), target, unit, startDate, endDate });
  res.status(201).json({ goal: { ...goal.toObject(), progress: 0, percentage: 0, status: 'not_started' } });
};

export const deleteFitnessGoal = async (req, res) => {
  const goal = await FitnessGoal.findOneAndDelete({ _id: req.params.goalId, user: req.userId });
  if (!goal) return res.status(404).json({ message: 'Fitness goal not found.' });
  res.json({ message: 'Fitness goal deleted.' });
};