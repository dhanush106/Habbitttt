# Habbittt API

Express and MongoDB API for user accounts, daily habit tracking, and weekly goals.

## Run locally

1. Install dependencies with `npm install`.
2. Configure `MONGODB_URI`, `JWT_SECRET`, `PORT`, and `CORS_ORIGIN` in `backend/.env`.
3. Start MongoDB, then run `npm run dev` or `npm start` from this directory.
4. Check `GET /api/health` for the service status.

`JWT_SECRET` must be a unique random value of at least 32 characters. Development generates a process-only key if it is missing, so tokens are invalidated on restart. Production refuses to start without an explicit key. Keep `.env` private. `CORS_ORIGIN` accepts a comma-separated list of frontend origins and defaults to `http://localhost:5173`.

## Deploy to Vercel

Create a Vercel project for this repository with `backend` as its Root Directory and the Framework Preset set to **Other**. Vercel serves the API through `api/[...path].js`; configure production `MONGODB_URI`, `JWT_SECRET`, and `CORS_ORIGIN` environment variables before deploying. The backend requires `CORS_ORIGIN` to exactly match the frontend origin. Verify the deployment at `/api/health`.

See the repository [README](../README.md) for the complete two-project Vercel setup.

## Authentication

Registration and login return `{ user, token }`. Send the token on protected requests as `Authorization: Bearer <token>`. Passwords are hashed with bcrypt and are never returned by the API. Tokens expire after seven days.

- `POST /api/auth/register` - `{ name, email, password, age? }`
- `POST /api/auth/login` - `{ email, password }`
- `GET /api/auth/me` - current account
- `PATCH /api/auth/me` - update `{ name?, age? }`
- `PATCH /api/auth/password` - `{ currentPassword, newPassword }`

## Habits

All habit endpoints require authentication. Completion dates use `YYYY-MM-DD` date keys, so entries are independent of server timezone.

- `GET /api/habits` - list active habits; `?archived=true` includes archived habits
- `POST /api/habits` - `{ name, category? }`
- `PATCH /api/habits/:habitId` - update `{ name?, category?, archived? }`
- `DELETE /api/habits/:habitId`
- `PATCH /api/habits/:habitId/completions` - `{ date, completed }`

## Weekly goals

Goal date ranges are inclusive. Each goal response includes computed `progress` and `status` (`not_started`, `in_progress`, or `completed`).

- `GET /api/goals` - list goals; optionally filter with `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- `POST /api/goals` - `{ name, unit, target, startDate, endDate }`
- `PATCH /api/goals/:goalId` - update `{ name?, unit?, target?, startDate?, endDate? }`
- `DELETE /api/goals/:goalId`
- `PUT /api/goals/:goalId/entries/:date` - set that day's `{ value }` (use zero to clear progress)

Every habit and goal query is scoped to the authenticated account. Errors use JSON `{ message }` responses.

## Fitness

All fitness endpoints require authentication. Dashboard summaries are calculated from the signed-in user's dated records.

- `GET /api/fitness/dashboard?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - workouts, measurement snapshots, weight history, goals, and activity summaries
- `POST /api/fitness/workouts` - `{ exercise, category?, details?, amount, unit, durationMinutes?, calories?, date }`
- `DELETE /api/fitness/workouts/:workoutId`
- `PUT /api/fitness/measurements/:type/:date` - `{ value }`; supported types are `weight`, `bmi`, `bodyFat`, `muscleMass`, and `waterIntake`
- `DELETE /api/fitness/measurements/:measurementId`
- `POST /api/fitness/goals` - activity or weight goal
- `DELETE /api/fitness/goals/:goalId`