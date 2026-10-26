import LeetGoal from '../models/LeetGoal.js';
import LeetProblem from '../models/LeetProblem.js';
import LeetTopicTarget from '../models/LeetTopicTarget.js';
import User from '../models/User.js';
import { isDateKey, isValidRange } from '../utils/dates.js';

const difficulties = ['Easy', 'Medium', 'Hard'];

export const calculateStreaks = (dateKeys, todayKey) => {
  const solvedDates = new Set(dateKeys);
  const today = new Date(`${todayKey}T00:00:00.000Z`);
  let current = 0;
  const currentCursor = new Date(today);
  if (!solvedDates.has(todayKey)) currentCursor.setUTCDate(currentCursor.getUTCDate() - 1);
  while (solvedDates.has(currentCursor.toISOString().slice(0, 10))) {
    current += 1;
    currentCursor.setUTCDate(currentCursor.getUTCDate() - 1);
  }

  const orderedDates = [...solvedDates].sort();
  let best = 0;
  let run = 0;
  let previous = null;
  for (const dateKey of orderedDates) {
    const date = new Date(`${dateKey}T00:00:00.000Z`);
    const difference = previous ? (date - previous) / 86400000 : 0;
    run = difference === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  return { current, best };
};

const normalizeTopics = (topics) => [...new Set(topics.map((topic) => topic.trim()).filter(Boolean))];

export const getDashboard = async (req, res) => {
  const { startDate, endDate } = req.query;
  const focusDate = req.query.focusDate || new Date().toISOString().slice(0, 10);
  if (!isValidRange(startDate, endDate)) {
    return res.status(400).json({ message: 'Provide a valid startDate and endDate range.' });
  }
  if (!isDateKey(focusDate) || focusDate < startDate || focusDate > endDate) {
    return res.status(400).json({ message: 'focusDate must be within the requested date range.' });
  }

  const [rangeProblems, recentProblems, allSolvedDates, totalSolved, focusSolved, dailyGoals, topicTargets, user, topicRows] = await Promise.all([
    LeetProblem.find({ user: req.userId, date: { $gte: startDate, $lte: endDate } }).sort({ date: -1, createdAt: -1 }).limit(500),
    LeetProblem.find({ user: req.userId }).sort({ date: -1, createdAt: -1 }).limit(12),
    LeetProblem.find({ user: req.userId, status: 'solved' }).distinct('date'),
    LeetProblem.countDocuments({ user: req.userId, status: 'solved' }),
    LeetProblem.countDocuments({ user: req.userId, status: 'solved', date: focusDate }),
    LeetGoal.find({ user: req.userId, date: focusDate }).sort({ createdAt: 1 }),
    LeetTopicTarget.find({ user: req.userId }).sort({ topic: 1 }),
    User.findById(req.userId).select('dailyProblemTarget'),
    LeetProblem.find({ user: req.userId, status: 'solved' }).select('topics').limit(10000),
  ]);

  const solvedInRange = rangeProblems.filter((problem) => problem.status === 'solved');
  const difficultyCounts = Object.fromEntries(difficulties.map((difficulty) => [difficulty, 0]));
  const activityByDate = new Map();
  const topicCounts = new Map();
  for (const problem of solvedInRange) {
    difficultyCounts[problem.difficulty] += 1;
    activityByDate.set(problem.date, (activityByDate.get(problem.date) ?? 0) + 1);
  }
  for (const problem of topicRows) {
    for (const topic of normalizeTopics(problem.topics)) {
      topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
    }
  }

  const targetsByTopic = new Map(topicTargets.map((target) => [target.topic.toLowerCase(), target]));
  const topics = [...topicCounts.entries()]
    .map(([topic, solved]) => {
      const target = targetsByTopic.get(topic.toLowerCase());
      const targetCount = target?.target ?? 20;
      return { topic, solved, target: targetCount, percentage: Math.min(100, Math.round((solved / targetCount) * 100)) };
    })
    .sort((left, right) => right.percentage - left.percentage || right.solved - left.solved)
    .slice(0, 10);

  const streaks = calculateStreaks(allSolvedDates, new Date().toISOString().slice(0, 10));
  res.json({
    problems: rangeProblems,
    recentProblems,
    dailyGoals,
    topics,
    activity: [...activityByDate].map(([date, solved]) => ({ date, solved })).sort((left, right) => left.date.localeCompare(right.date)),
    summary: {
      todaySolved: focusSolved,
      dailyTarget: user?.dailyProblemTarget ?? 10,
      currentStreak: streaks.current,
      bestStreak: streaks.best,
      totalSolved,
      periodSolved: solvedInRange.length,
      attempted: rangeProblems.filter((problem) => problem.status === 'attempted').length,
      difficultyCounts,
      topicCount: topicCounts.size,
    },
  });
};

export const createProblem = async (req, res) => {
  const { title, difficulty, topics = [], platform = 'LeetCode', url = '', notes = '', status = 'solved', date, timeMinutes = 0 } = req.body;
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 140) {
    return res.status(400).json({ message: 'Problem title is required and must be at most 140 characters.' });
  }
  if (!difficulties.includes(difficulty) || !['solved', 'attempted'].includes(status)) {
    return res.status(400).json({ message: 'Choose a valid difficulty and problem status.' });
  }
  if (!Array.isArray(topics) || topics.some((topic) => typeof topic !== 'string') || topics.length > 8) {
    return res.status(400).json({ message: 'Topics must be a list of up to 8 names.' });
  }
  if (!isDateKey(date) || !Number.isFinite(timeMinutes) || timeMinutes < 0 || timeMinutes > 1440) {
    return res.status(400).json({ message: 'Provide a valid date and time in minutes.' });
  }
  if (typeof platform !== 'string' || platform.trim().length > 50 || typeof url !== 'string' || url.length > 500 || typeof notes !== 'string' || notes.length > 2000) {
    return res.status(400).json({ message: 'Platform, URL, or notes exceed the allowed length.' });
  }
  if (url.trim()) {
    try {
      if (!['http:', 'https:'].includes(new URL(url).protocol)) throw new Error('Unsupported URL protocol.');
    } catch {
      return res.status(400).json({ message: 'Problem URL must be a valid HTTP or HTTPS link.' });
    }
  }
  const problem = await LeetProblem.create({
    user: req.userId,
    title: title.trim(),
    difficulty,
    topics: normalizeTopics(topics),
    platform: platform.trim() || 'LeetCode',
    url: url.trim(),
    notes: notes.trim(),
    status,
    date,
    timeMinutes,
  });
  res.status(201).json({ problem });
};

export const updateProblem = async (req, res) => {
  const allowed = ['title', 'difficulty', 'topics', 'platform', 'url', 'notes', 'status', 'date', 'timeMinutes'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  if (!Object.keys(updates).length) return res.status(400).json({ message: 'Provide at least one problem field to update.' });
  if (updates.title !== undefined && (typeof updates.title !== 'string' || !updates.title.trim())) return res.status(400).json({ message: 'Problem title cannot be empty.' });
  if (updates.difficulty !== undefined && !difficulties.includes(updates.difficulty)) return res.status(400).json({ message: 'Invalid difficulty.' });
  if (updates.status !== undefined && !['solved', 'attempted'].includes(updates.status)) return res.status(400).json({ message: 'Invalid problem status.' });
  if (updates.date !== undefined && !isDateKey(updates.date)) return res.status(400).json({ message: 'Invalid problem date.' });
  if (updates.topics !== undefined && (!Array.isArray(updates.topics) || updates.topics.length > 8 || updates.topics.some((topic) => typeof topic !== 'string'))) return res.status(400).json({ message: 'Topics must be a list of up to 8 names.' });
  if (updates.title !== undefined) updates.title = updates.title.trim();
  if (updates.topics !== undefined) updates.topics = normalizeTopics(updates.topics);
  const problem = await LeetProblem.findOneAndUpdate({ _id: req.params.problemId, user: req.userId }, updates, { returnDocument: 'after', runValidators: true });
  if (!problem) return res.status(404).json({ message: 'Problem not found.' });
  res.json({ problem });
};

export const deleteProblem = async (req, res) => {
  const problem = await LeetProblem.findOneAndDelete({ _id: req.params.problemId, user: req.userId });
  if (!problem) return res.status(404).json({ message: 'Problem not found.' });
  res.json({ message: 'Problem deleted.' });
};

export const createDailyGoal = async (req, res) => {
  const { title, date = new Date().toISOString().slice(0, 10) } = req.body;
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 120 || !isDateKey(date)) {
    return res.status(400).json({ message: 'Provide a goal title and valid date.' });
  }
  const goal = await LeetGoal.create({ user: req.userId, title: title.trim(), date });
  res.status(201).json({ goal });
};

export const updateDailyGoal = async (req, res) => {
  if (typeof req.body.completed !== 'boolean') return res.status(400).json({ message: 'completed must be a boolean.' });
  const goal = await LeetGoal.findOneAndUpdate(
    { _id: req.params.goalId, user: req.userId },
    { $set: { completed: req.body.completed } },
    { returnDocument: 'after', runValidators: true }
  );
  if (!goal) return res.status(404).json({ message: 'Daily goal not found.' });
  res.json({ goal });
};

export const deleteDailyGoal = async (req, res) => {
  const goal = await LeetGoal.findOneAndDelete({ _id: req.params.goalId, user: req.userId });
  if (!goal) return res.status(404).json({ message: 'Daily goal not found.' });
  res.json({ message: 'Daily goal deleted.' });
};

export const updateTopicTarget = async (req, res) => {
  const topic = typeof req.params.topic === 'string' ? req.params.topic.trim() : '';
  const { target } = req.body;
  if (!topic || topic.length > 60 || !Number.isInteger(target) || target < 1 || target > 1000) {
    return res.status(400).json({ message: 'Provide a topic and a target from 1 to 1000.' });
  }
  const topicTarget = await LeetTopicTarget.findOneAndUpdate(
    { user: req.userId, topic },
    { $set: { target } },
    { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
  );
  res.json({ topicTarget });
};

export const updateDailyTarget = async (req, res) => {
  const { dailyProblemTarget } = req.body;
  if (!Number.isInteger(dailyProblemTarget) || dailyProblemTarget < 1 || dailyProblemTarget > 100) {
    return res.status(400).json({ message: 'Daily target must be a whole number from 1 to 100.' });
  }
  const user = await User.findByIdAndUpdate(req.userId, { $set: { dailyProblemTarget } }, { returnDocument: 'after', runValidators: true }).select('dailyProblemTarget');
  res.json({ dailyProblemTarget: user.dailyProblemTarget });
};