import TodoChecklist from '../models/TodoChecklist.js';
import TodoTask from '../models/TodoTask.js';
import { isDateKey, isValidRange } from '../utils/dates.js';

const priorities = ['Low', 'Medium', 'High'];
const statuses = ['pending', 'in_progress', 'completed'];

export const summarizeTodo = (tasks, goals, focusDate) => {
  const focusTasks = tasks.filter((task) => task.date === focusDate);
  const completed = focusTasks.filter((task) => task.status === 'completed').length;
  const focusMinutes = focusTasks.reduce((total, task) => total + task.durationMinutes, 0);
  const categoryTotals = new Map();
  const activityTotals = new Map();

  for (const task of tasks) {
    categoryTotals.set(task.category, (categoryTotals.get(task.category) ?? 0) + task.durationMinutes);
    activityTotals.set(task.date, (activityTotals.get(task.date) ?? 0) + 1);
  }

  return {
    summary: {
      totalTasks: focusTasks.length,
      completedTasks: completed,
      inProgressTasks: focusTasks.filter((task) => task.status === 'in_progress').length,
      pendingTasks: focusTasks.filter((task) => task.status === 'pending').length,
      focusMinutes,
      focusHours: Math.round((focusMinutes / 60) * 10) / 10,
      productivityPercent: focusTasks.length ? Math.round((completed / focusTasks.length) * 100) : 0,
      categoryCount: new Set(focusTasks.map((task) => task.category)).size,
    },
    categories: [...categoryTotals].map(([category, minutes]) => ({
      category,
      minutes,
      hours: Math.round((minutes / 60) * 10) / 10,
      percentage: focusMinutes ? Math.round((minutes / focusMinutes) * 100) : 0,
    })).sort((left, right) => right.minutes - left.minutes),
    activity: [...activityTotals].map(([date, tasksCount]) => ({ date, tasks: tasksCount })),
    goals: {
      total: goals.length,
      completed: goals.filter((goal) => goal.completed).length,
      pending: goals.filter((goal) => !goal.completed).length,
    },
  };
};

export const getTodoDashboard = async (req, res) => {
  const { startDate, endDate, focusDate } = req.query;
  if (!isValidRange(startDate, endDate) || !isDateKey(focusDate) || focusDate < startDate || focusDate > endDate) {
    return res.status(400).json({ message: 'Provide a valid date range and a focusDate within that range.' });
  }
  const [tasks, goals] = await Promise.all([
    TodoTask.find({ user: req.userId, date: { $gte: startDate, $lte: endDate } }).sort({ date: 1, startTime: 1, createdAt: 1 }),
    TodoChecklist.find({ user: req.userId, date: focusDate }).sort({ createdAt: 1 }),
  ]);
  res.json({ tasks, dailyGoals: goals, focusDate, ...summarizeTodo(tasks, goals, focusDate) });
};

export const createTask = async (req, res) => {
  const {
    title,
    notes = '',
    date,
    startTime,
    durationMinutes,
    category = 'Personal',
    tags = [],
    priority = 'Medium',
  } = req.body;
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 140) {
    return res.status(400).json({ message: 'Task title is required and must be at most 140 characters.' });
  }
  if (!isDateKey(date) || typeof startTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
    return res.status(400).json({ message: 'Provide a valid task date and start time (HH:mm).'});
  }
  if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 1440) {
    return res.status(400).json({ message: 'Duration must be a whole number between 1 and 1440 minutes.' });
  }
  if (typeof category !== 'string' || !category.trim() || category.trim().length > 40) {
    return res.status(400).json({ message: 'Provide a category of at most 40 characters.' });
  }
  if (!priorities.includes(priority) || typeof notes !== 'string' || notes.length > 1000) {
    return res.status(400).json({ message: 'Provide a valid priority and notes of at most 1000 characters.' });
  }
  if (!Array.isArray(tags) || tags.length > 8 || tags.some((tag) => typeof tag !== 'string' || tag.trim().length > 30)) {
    return res.status(400).json({ message: 'Tags must be a list of up to eight names, each at most 30 characters.' });
  }
  const task = await TodoTask.create({
    user: req.userId,
    title: title.trim(),
    notes: notes.trim(),
    date,
    startTime,
    durationMinutes,
    category: category.trim(),
    tags: [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))],
    priority,
  });
  res.status(201).json({ task });
};

export const updateTask = async (req, res) => {
  const allowed = ['title', 'notes', 'date', 'startTime', 'durationMinutes', 'category', 'tags', 'priority', 'status'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  if (!Object.keys(updates).length) return res.status(400).json({ message: 'Provide at least one task field to update.' });
  if (updates.title !== undefined && (typeof updates.title !== 'string' || !updates.title.trim())) return res.status(400).json({ message: 'Task title cannot be empty.' });
  if (updates.date !== undefined && !isDateKey(updates.date)) return res.status(400).json({ message: 'Task date is invalid.' });
  if (updates.startTime !== undefined && (typeof updates.startTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(updates.startTime))) return res.status(400).json({ message: 'Task time must use HH:mm.' });
  if (updates.durationMinutes !== undefined && (!Number.isInteger(updates.durationMinutes) || updates.durationMinutes < 1 || updates.durationMinutes > 1440)) return res.status(400).json({ message: 'Duration must be between 1 and 1440 minutes.' });
  if (updates.priority !== undefined && !priorities.includes(updates.priority)) return res.status(400).json({ message: 'Task priority is invalid.' });
  if (updates.status !== undefined && !statuses.includes(updates.status)) return res.status(400).json({ message: 'Task status is invalid.' });
  if (updates.title !== undefined) updates.title = updates.title.trim();
  if (updates.notes !== undefined) {
    if (typeof updates.notes !== 'string' || updates.notes.length > 1000) return res.status(400).json({ message: 'Task notes must be at most 1000 characters.' });
    updates.notes = updates.notes.trim();
  }
  if (updates.category !== undefined) {
    if (typeof updates.category !== 'string' || !updates.category.trim() || updates.category.trim().length > 40) return res.status(400).json({ message: 'Task category is invalid.' });
    updates.category = updates.category.trim();
  }
  if (updates.tags !== undefined && (!Array.isArray(updates.tags) || updates.tags.length > 8 || updates.tags.some((tag) => typeof tag !== 'string' || tag.trim().length > 30))) return res.status(400).json({ message: 'Task tags are invalid.' });
  if (updates.status !== undefined) updates.completedAt = updates.status === 'completed' ? new Date() : null;

  const task = await TodoTask.findOneAndUpdate(
    { _id: req.params.taskId, user: req.userId },
    { $set: updates },
    { returnDocument: 'after', runValidators: true }
  );
  if (!task) return res.status(404).json({ message: 'Task not found.' });
  res.json({ task });
};

export const deleteTask = async (req, res) => {
  const task = await TodoTask.findOneAndDelete({ _id: req.params.taskId, user: req.userId });
  if (!task) return res.status(404).json({ message: 'Task not found.' });
  res.json({ message: 'Task deleted.' });
};

export const createDailyGoal = async (req, res) => {
  const { title, date } = req.body;
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 140 || !isDateKey(date)) {
    return res.status(400).json({ message: 'Provide a goal title and valid date.' });
  }
  const goal = await TodoChecklist.create({ user: req.userId, title: title.trim(), date });
  res.status(201).json({ goal });
};

export const updateDailyGoal = async (req, res) => {
  if (typeof req.body.completed !== 'boolean') return res.status(400).json({ message: 'completed must be a boolean.' });
  const goal = await TodoChecklist.findOneAndUpdate(
    { _id: req.params.goalId, user: req.userId },
    { $set: { completed: req.body.completed } },
    { returnDocument: 'after', runValidators: true }
  );
  if (!goal) return res.status(404).json({ message: 'Daily goal not found.' });
  res.json({ goal });
};

export const deleteDailyGoal = async (req, res) => {
  const goal = await TodoChecklist.findOneAndDelete({ _id: req.params.goalId, user: req.userId });
  if (!goal) return res.status(404).json({ message: 'Daily goal not found.' });
  res.json({ message: 'Daily goal deleted.' });
};