import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    age: { type: Number, min: 13, max: 120 },
    dailyProblemTarget: { type: Number, min: 1, max: 100, default: 10 },
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform(_document, result) {
    delete result.password;
    delete result.__v;
    return result;
  },
});

const User = mongoose.model('User', userSchema);

export default User;