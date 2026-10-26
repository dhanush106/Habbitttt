import mongoose from 'mongoose';

const bodyMeasurementSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true, enum: ['weight', 'bmi', 'bodyFat', 'muscleMass', 'waterIntake'] },
    value: { type: Number, required: true, min: 0.01 },
    unit: { type: String, required: true, enum: ['kg', 'kg/m2', '%', 'L'] },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

bodyMeasurementSchema.index({ user: 1, type: 1, date: 1 }, { unique: true });
bodyMeasurementSchema.index({ user: 1, date: -1 });

const BodyMeasurement = mongoose.model('BodyMeasurement', bodyMeasurementSchema);

export default BodyMeasurement;