import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/habbittt_db';
    await mongoose.connect(mongoUri);
    console.log(`Connected to MongoDB: ${mongoose.connection.name}`);
    return mongoose.connection;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    throw error;
  }
};

export default connectDB;