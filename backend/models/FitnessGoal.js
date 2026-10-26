import mongoose from 'mongoose';

const fitnessGoalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    kind: { type: String, required: true, enum: ['activity', 'weight'] },
    exercise: { type: String, trim: true, maxlength: 80, default: '' },
    target: { type: Number, required: true, min: 0.01 },
    unit: { type: String, required: true, enum: ['km', 'reps', 'min', 'workouts', 'kg'] },
    startValue: { type: Number, min: 0 },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
  },
  { timestamps: true }
);

fitnessGoalSchema.index({ user: 1, startDate: 1, endDate: 1 });

const FitnessGoal = mongoose.model('FitnessGoal', fitnessGoalSchema);

export default FitnessGoal;