import WeeklyGoal from '../models/WeeklyGoal.js';
import { isDateKey, isValidRange } from '../utils/dates.js';

const presentGoal = (goal) => {
  const progress = goal.entries.reduce((total, entry) => total + entry.value, 0);
  return {
    ...goal.toObject(),
    progress,
    status: progress >= goal.target ? 'completed' : progress > 0 ? 'in_progress' : 'not_started',
  };
};

export const listGoals = async (req, res) => {
  const query = { user: req.userId };
  if (req.query.startDate || req.query.endDate) {
    const { startDate, endDate } = req.query;
    if (!isDateKey(startDate) || !isDateKey(endDate) || startDate > endDate) {
      return res.status(400).json({ message: 'Provide a valid startDate and endDate range.' });
    }
    query.startDate = { $lte: endDate };
    query.endDate = { $gte: startDate };
  }
  const goals = await WeeklyGoal.find(query).sort({ startDate: 1, createdAt: 1 });
  res.json({ goals: goals.map(presentGoal) });
};

export const createGoal = async (req, res) => {
  const { name, unit, target, startDate, endDate } = req.body;
  if (typeof name !== 'string' || !name.trim() || typeof unit !== 'string' || !unit.trim()) {
    return res.status(400).json({ message: 'Goal name and unit are required.' });
  }
  if (!Number.isFinite(target) || target <= 0) {
    return res.status(400).json({ message: 'Target must be a positive number.' });
  }
  if (!isValidRange(startDate, endDate)) {
    return res.status(400).json({ message: 'Provide a valid startDate and endDate range.' });
  }
  const goal = await WeeklyGoal.create({
    user: req.userId,
    name: name.trim(),
    unit: unit.trim(),
    target,
    startDate,
    endDate,
  });
  res.status(201).json({ goal: presentGoal(goal) });
};

export const updateGoal = async (req, res) => {
  const goal = await WeeklyGoal.findOne({ _id: req.params.goalId, user: req.userId });
  if (!goal) return res.status(404).json({ message: 'Weekly goal not found.' });

  const { name, unit, target, startDate, endDate } = req.body;
  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ message: 'Goal name cannot be empty.' });
    goal.name = name.trim();
  }
  if (unit !== undefined) {
    if (typeof unit !== 'string' || !unit.trim()) return res.status(400).json({ message: 'Unit cannot be empty.' });
    goal.unit = unit.trim();
  }
  if (target !== undefined) {
    if (!Number.isFinite(target) || target <= 0) return res.status(400).json({ message: 'Target must be a positive number.' });
    goal.target = target;
  }
  if (startDate !== undefined) goal.startDate = startDate;
  if (endDate !== undefined) goal.endDate = endDate;
  if (!isValidRange(goal.startDate, goal.endDate)) {
    return res.status(400).json({ message: 'Provide a valid startDate and endDate range.' });
  }
  await goal.save();
  res.json({ goal: presentGoal(goal) });
};

export const deleteGoal = async (req, res) => {
  const goal = await WeeklyGoal.findOneAndDelete({ _id: req.params.goalId, user: req.userId });
  if (!goal) return res.status(404).json({ message: 'Weekly goal not found.' });
  res.json({ message: 'Weekly goal deleted.' });
};

export const setGoalEntry = async (req, res) => {
  const { date } = req.params;
  const { value } = req.body;
  if (!isDateKey(date) || !Number.isFinite(value) || value < 0) {
    return res.status(400).json({ message: 'Provide a valid date and a non-negative numeric value.' });
  }
  const goal = await WeeklyGoal.findOne({ _id: req.params.goalId, user: req.userId });
  if (!goal) return res.status(404).json({ message: 'Weekly goal not found.' });
  if (date < goal.startDate || date > goal.endDate) {
    return res.status(400).json({ message: 'Entry date must fall within the goal date range.' });
  }
  const currentEntries = { $ifNull: ['$entries', []] };
  const dateKeys = { $map: { input: currentEntries, as: 'entry', in: '$$entry.date' } };
  const updatedEntries = {
    $cond: [
      { $in: [date, dateKeys] },
      {
        $map: {
          input: currentEntries,
          as: 'entry',
          in: {
            $cond: [
              { $eq: ['$$entry.date', date] },
              { date, value },
              '$$entry',
            ],
          },
        },
      },
      { $concatArrays: [currentEntries, [{ date, value }]] },
    ],
  };
  const updatedGoal = await WeeklyGoal.findOneAndUpdate(
    { _id: req.params.goalId, user: req.userId },
    [{ $set: { entries: updatedEntries } }],
    { returnDocument: 'after', updatePipeline: true }
  );
  res.json({ goal: presentGoal(updatedGoal) });
};