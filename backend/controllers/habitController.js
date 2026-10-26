import Habit from '../models/Habit.js';
import { isDateKey } from '../utils/dates.js';

export const listHabits = async (req, res) => {
  const query = { user: req.userId };
  if (req.query.archived !== 'true') query.archived = false;
  const habits = await Habit.find(query).sort({ createdAt: 1 });
  res.json({ habits });
};

export const createHabit = async (req, res) => {
  const { name, category } = req.body;
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'Habit name is required.' });
  }
  const habit = await Habit.create({ user: req.userId, name: name.trim(), category });
  res.status(201).json({ habit });
};

export const updateHabit = async (req, res) => {
  const updates = {};
  if (typeof req.body.name === 'string') updates.name = req.body.name.trim();
  if (typeof req.body.category === 'string') updates.category = req.body.category.trim();
  if (typeof req.body.archived === 'boolean') updates.archived = req.body.archived;
  if (!Object.keys(updates).length) return res.status(400).json({ message: 'No valid fields to update.' });

  const habit = await Habit.findOneAndUpdate(
    { _id: req.params.habitId, user: req.userId },
    updates,
    { returnDocument: 'after', runValidators: true }
  );
  if (!habit) return res.status(404).json({ message: 'Habit not found.' });
  res.json({ habit });
};

export const deleteHabit = async (req, res) => {
  const habit = await Habit.findOneAndDelete({ _id: req.params.habitId, user: req.userId });
  if (!habit) return res.status(404).json({ message: 'Habit not found.' });
  res.json({ message: 'Habit deleted.' });
};

export const setHabitCompletion = async (req, res) => {
  const { date, completed } = req.body;
  if (!isDateKey(date) || typeof completed !== 'boolean') {
    return res.status(400).json({ message: 'Provide a valid date (YYYY-MM-DD) and completed boolean.' });
  }
  const update = completed
    ? { $addToSet: { completedDates: date } }
    : { $pull: { completedDates: date } };
  const habit = await Habit.findOneAndUpdate(
    { _id: req.params.habitId, user: req.userId },
    update,
    { returnDocument: 'after' }
  );
  if (!habit) return res.status(404).json({ message: 'Habit not found.' });
  res.json({ habit });
};