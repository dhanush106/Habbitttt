import express from 'express';
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './db/index.js';
import authRoutes from './routes/auth.js';
import fitnessRoutes from './routes/fitness.js';
import habitRoutes from './routes/habits.js';
import goalRoutes from './routes/goals.js';
import leettrackRoutes from './routes/leettrack.js';
import todoRoutes from './routes/todo.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { configureEnvironment } from './utils/environment.js';

configureEnvironment();

const app = express();
let connectionPromise;

app.disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
//   .split(',')
//   .map((origin) => origin.trim());

const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) : ['http://localhost:5173'];

app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin && !allowedOrigins.includes(origin)) {
    console.warn(`[CORS] Rejected ${req.method} ${req.originalUrl} from origin ${origin}`);
    return res.status(403).json({ message: 'This origin is not allowed to access the API.' });
  }
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

if (process.env.VERCEL === '1') {
  app.use('/api', async (req, res, next) => {
    if (mongoose.connection.readyState === 1) return next();
    if (!connectionPromise) {
      connectionPromise = connectDB().catch((error) => {
        connectionPromise = undefined;
        throw error;
      });
    }

    try {
      await connectionPromise;
      next();
    } catch (error) {
      console.error('Unable to connect to MongoDB for this request:', error.message);
      res.status(503).json({ message: 'The database is temporarily unavailable.' });
    }
  });
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/fitness', fitnessRoutes);
app.use('/api/leettrack', leettrackRoutes);
app.use('/api/todo', todoRoutes);
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test' && process.env.VERCEL !== '1') {
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((error) => {
      console.error('Unable to start server:', error.message);
      process.exit(1);
    });
}

export default app;
