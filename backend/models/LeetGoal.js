import mongoose from 'mongoose';

const leetGoalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    date: { type: String, required: true },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

leetGoalSchema.index({ user: 1, date: 1, createdAt: 1 });

const LeetGoal = mongoose.model('LeetGoal', leetGoalSchema);

export default LeetGoal;