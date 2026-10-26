# Habbittt frontend

React and Vite single-page application. See the repository [README](../README.md) for local development and Vercel deployment instructions.

## Scripts

- `npm run dev` starts the local Vite development server.
- `npm run lint` runs ESLint.
- `npm run build` creates the production bundle in `dist/`.
- `npm run preview` serves the production bundle locally.

Set `VITE_API_URL` to the API base URL, including `/api`. It defaults to `http://localhost:5000/api` during local development. Vite variables are embedded in the browser bundle and must not contain secrets.
