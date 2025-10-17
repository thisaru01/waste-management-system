import mongoose from 'mongoose';

const { Schema } = mongoose;

const PiMetricSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('PiMetric', PiMetricSchema);
