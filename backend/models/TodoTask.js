import mongoose from 'mongoose';

const todoTaskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    notes: { type: String, trim: true, maxlength: 1000, default: '' },
    date: { type: String, required: true },
    startTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    durationMinutes: { type: Number, required: true, min: 1, max: 1440 },
    category: { type: String, required: true, trim: true, maxlength: 40, default: 'Personal' },
    tags: { type: [String], default: [] },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

todoTaskSchema.index({ user: 1, date: 1, startTime: 1 });

const TodoTask = mongoose.model('TodoTask', todoTaskSchema);

export default TodoTask;