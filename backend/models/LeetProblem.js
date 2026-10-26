import mongoose from 'mongoose';

const leetProblemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    difficulty: { type: String, required: true, enum: ['Easy', 'Medium', 'Hard'] },
    topics: { type: [String], default: [], validate: [(topics) => topics.length <= 8, 'A problem can have at most 8 topics.'] },
    platform: { type: String, trim: true, maxlength: 50, default: 'LeetCode' },
    url: { type: String, trim: true, maxlength: 500, default: '' },
    notes: { type: String, trim: true, maxlength: 2000, default: '' },
    status: { type: String, required: true, enum: ['solved', 'attempted'], default: 'solved' },
    date: { type: String, required: true },
    timeMinutes: { type: Number, min: 0, max: 1440, default: 0 },
  },
  { timestamps: true }
);

leetProblemSchema.index({ user: 1, date: -1 });
leetProblemSchema.index({ user: 1, status: 1, difficulty: 1 });

const LeetProblem = mongoose.model('LeetProblem', leetProblemSchema);

export default LeetProblem;