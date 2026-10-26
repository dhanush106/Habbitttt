import mongoose from 'mongoose';

const leetTopicTargetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topic: { type: String, required: true, trim: true, maxlength: 60 },
    target: { type: Number, required: true, min: 1, max: 1000, default: 20 },
  },
  { timestamps: true }
);

leetTopicTargetSchema.index({ user: 1, topic: 1 }, { unique: true });

const LeetTopicTarget = mongoose.model('LeetTopicTarget', leetTopicTargetSchema);

export default LeetTopicTarget;