import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeTodo } from '../controllers/todoController.js';

test('todo metrics reflect selected-day, weekly, monthly, and current-streak task data', () => {
  const tasks = [
    { date: '2026-11-23', title: 'Review notes', category: 'Study', durationMinutes: 60, status: 'completed' },
    { date: '2026-11-23', title: 'Plan project', category: 'Work', durationMinutes: 30, status: 'pending' },
    { date: '2026-11-22', title: 'Walk', category: 'Health', durationMinutes: 30, status: 'completed' },
  ];

  const result = summarizeTodo(tasks, [], '2026-11-23', {
    weekTasks: tasks,
    streakTasks: [
      { date: '2026-11-23', status: 'completed' },
      { date: '2026-11-22', status: 'completed' },
      { date: '2026-11-20', status: 'completed' },
    ],
    today: '2026-11-23',
  });

  assert.deepEqual(result.summary, {
    totalTasks: 2,
    completedTasks: 1,
    inProgressTasks: 0,
    pendingTasks: 1,
    focusMinutes: 90,
    focusHours: 1.5,
    productivityPercent: 50,
    categoryCount: 2,
  });
  assert.deepEqual(result.metrics, {
    currentStreak: 2,
    weekly: { totalTasks: 3, completedTasks: 2, percentage: 67 },
    monthly: { productiveDays: 2, goalDays: 30 },
  });
  assert.deepEqual(result.activity, [
    { date: '2026-11-23', tasks: 2, completed: 1, pending: 1 },
    { date: '2026-11-22', tasks: 1, completed: 1, pending: 0 },
  ]);
});

test('todo current streak carries forward from yesterday when today has no completion', () => {
  const result = summarizeTodo([], [], '2026-11-23', {
    weekTasks: [],
    streakTasks: [
      { date: '2026-11-22', status: 'completed' },
      { date: '2026-11-21', status: 'completed' },
    ],
    today: '2026-11-23',
  });

  assert.equal(result.metrics.currentStreak, 2);
  assert.equal(result.metrics.weekly.percentage, 0);
  assert.equal(result.metrics.monthly.goalDays, 30);
});
