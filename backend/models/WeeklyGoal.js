import mongoose from 'mongoose';

const goalEntrySchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    value: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const weeklyGoalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    unit: { type: String, required: true, trim: true, maxlength: 30 },
    target: { type: Number, required: true, min: 0.01 },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    entries: { type: [goalEntrySchema], default: [] },
  },
  { timestamps: true }
);

weeklyGoalSchema.index({ user: 1, startDate: 1 });

const WeeklyGoal = mongoose.model('WeeklyGoal', weeklyGoalSchema);

export default WeeklyGoal;