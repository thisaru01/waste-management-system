import mongoose from 'mongoose';

const { Schema } = mongoose;

const CollectionRecordSchema = new Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    hour: { type: Number, required: true }, // 0-23
    truckedKg: { type: Number, required: true },
    truckId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('CollectionRecord', CollectionRecordSchema);
