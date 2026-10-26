import mongoose from 'mongoose';

const workoutSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    exercise: { type: String, required: true, trim: true, maxlength: 80 },
    category: { type: String, enum: ['Cardio', 'Strength', 'Core', 'Mobility', 'Other'], default: 'Other' },
    details: { type: String, trim: true, maxlength: 160, default: '' },
    amount: { type: Number, required: true, min: 0.01 },
    unit: { type: String, required: true, enum: ['km', 'reps', 'min', 'workouts'] },
    durationMinutes: { type: Number, min: 0, default: 0 },
    calories: { type: Number, min: 0, default: 0 },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

workoutSchema.index({ user: 1, date: -1 });

const Workout = mongoose.model('Workout', workoutSchema);

export default Workout;