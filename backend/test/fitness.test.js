import assert from 'node:assert/strict';
import { once } from 'node:events';
import test, { after, before } from 'node:test';
process.env.NODE_ENV = 'test';
const { default: app } = await import('../app.js');
import { calculateFitnessGoal } from '../controllers/fitnessController.js';
import { calculateStreaks } from '../controllers/leettrackController.js';
import { isDateKey, isValidRange } from '../utils/dates.js';

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (!server) return;
  server.close();
  await once(server, 'close');
});

test('date keys reject impossible calendar dates', () => {
  assert.equal(isDateKey('2026-10-19'), true);
  assert.equal(isDateKey('2026-02-30'), false);
  assert.equal(isValidRange('2026-10-19', '2026-10-25'), true);
  assert.equal(isValidRange('2026-10-25', '2026-10-19'), false);
});

test('activity goal progress filters by exercise, unit, and goal dates', () => {
  const goal = {
    kind: 'activity',
    exercise: 'Run',
    unit: 'km',
    target: 5,
    startDate: '2026-10-19',
    endDate: '2026-10-25',
  };
  const workouts = [
    { exercise: 'Run', unit: 'km', amount: 2, date: '2026-10-20' },
    { exercise: 'run', unit: 'km', amount: 3, date: '2026-10-24' },
    { exercise: 'Bike', unit: 'km', amount: 8, date: '2026-10-21' },
    { exercise: 'Run', unit: 'km', amount: 10, date: '2026-10-26' },
  ];
  assert.deepEqual(calculateFitnessGoal(goal, workouts, null), {
    progress: 5,
    percentage: 100,
    status: 'completed',
  });
});

test('weight goal reports progress toward a lower target', () => {
  const goal = { kind: 'weight', startValue: 90, target: 80 };
  assert.deepEqual(calculateFitnessGoal(goal, [], { value: 85 }), {
    progress: 85,
    percentage: 50,
    status: 'in_progress',
  });
});

test('fitness routes require a bearer token', async () => {
  const response = await fetch(`${baseUrl}/api/fitness/dashboard?startDate=2026-10-19&endDate=2026-10-25`);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { message: 'Authentication required.' });
});

test('health endpoint remains public', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('CORS preflight allows PUT from the frontend origin', async () => {
  const response = await fetch(`${baseUrl}/api/fitness/measurements/weight/2026-10-20`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:5173',
      'Access-Control-Request-Method': 'PUT',
      'Access-Control-Request-Headers': 'authorization,content-type',
    },
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  assert.match(response.headers.get('access-control-allow-methods'), /PUT/);
});

test('LeetTrack streak counts distinct consecutive solved dates', () => {
  assert.deepEqual(calculateStreaks(['2026-10-17', '2026-10-18', '2026-10-19'], '2026-10-20'), {
    current: 3,
    best: 3,
  });
});

test('LeetTrack dashboard requires a bearer token', async () => {
  const response = await fetch(`${baseUrl}/api/leettrack/dashboard?startDate=2026-10-01&endDate=2026-10-31&focusDate=2026-10-20`);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { message: 'Authentication required.' });
});