import mongoose from 'mongoose';

const todoChecklistSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

todoChecklistSchema.index({ user: 1, date: 1, createdAt: 1 });

const TodoChecklist = mongoose.model('TodoChecklist', todoChecklistSchema);

export default TodoChecklist;