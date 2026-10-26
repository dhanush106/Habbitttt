import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    category: { type: String, trim: true, maxlength: 40, default: 'Personal' },
    completedDates: { type: [String], default: [] },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

habitSchema.index({ user: 1, createdAt: -1 });

const Habit = mongoose.model('Habit', habitSchema);

export default Habit;