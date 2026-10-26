# Habbittt

A habit, goals, fitness, LeetCode, and to-do tracker with a React frontend and an Express/MongoDB API.

## Local development

Requirements: Node.js 20 or newer and MongoDB.

1. Install each application's dependencies:

   ```sh
   npm --prefix backend install
   npm --prefix frontend install
   ```

2. Copy `backend/.env.example` to `backend/.env`, then set `MONGODB_URI` and a unique `JWT_SECRET` of at least 32 characters. `CORS_ORIGIN` defaults to `http://localhost:5173` for local development.
3. Copy `frontend/.env.example` to `frontend/.env` if you need a non-default API URL.
4. Start the API and frontend in separate terminals:

   ```sh
   npm --prefix backend run dev
   npm --prefix frontend run dev
   ```

5. The API health check is at `http://localhost:5000/api/health`.

## Deploy to Vercel

Create two Vercel projects from this repository, both connected to the `main` branch:

### Backend project

- Set **Root Directory** to `backend`.
- Set **Framework Preset** to **Other**. The API catch-all function is in `backend/api/`.
- Configure these production environment variables:
  - `MONGODB_URI`: your production MongoDB connection string.
  - `JWT_SECRET`: a unique random secret of at least 32 characters.
  - `CORS_ORIGIN`: the exact deployed frontend origin (for example, `https://your-app.vercel.app`); separate multiple origins with commas.
- Deploy, then verify `https://<backend-domain>/api/health` returns `{"status":"ok"}`.

### Frontend project

- Set **Root Directory** to `frontend`.
- Use the Vite preset, build command `npm run build`, and output directory `dist`.
- Set `VITE_API_URL` to `https://<backend-domain>/api` before deploying. Vite embeds this value at build time.
- Deploy and verify that page refreshes on routes such as `/tracker` work.

Ensure your MongoDB provider permits connections from the deployed backend. Do not commit `.env` files or put secrets in frontend `VITE_*` variables; frontend variables are public.

## Checks

```sh
npm --prefix backend test
npm --prefix frontend run lint
npm --prefix frontend run build
```
