import mongoose from 'mongoose';
import app from '../app.js';
import connectDB from '../db/index.js';

let connectionPromise;

async function ensureDatabaseConnection() {
  if (mongoose.connection.readyState === 1) return;
  if (!connectionPromise) {
    connectionPromise = connectDB().catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  }
  await connectionPromise;
}

export default async function handler(req, res) {
  try {
    await ensureDatabaseConnection();
  } catch (error) {
    console.error('Unable to connect to MongoDB for this request:', error.message);
    return res.status(503).json({ message: 'The database is temporarily unavailable.' });
  }
  return app(req, res);
}
