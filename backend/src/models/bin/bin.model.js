import mongoose from 'mongoose';

const { Schema } = mongoose;

const BinSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['household', 'business', 'public'],
      default: 'public',
      index: true,
    },
    capacityLiters: {
      type: Number,
      default: 120,
      min: 1,
    },
    location: {
      description: { type: String, default: '' },
    },
    owner: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    fillLevelPercent: { type: Number, default: 0, min: 0, max: 100 },
    weightKg: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['normal', 'needs-collection', 'collected', 'unauthorized-collection', 'overflow'],
      default: 'normal',
      index: true,
    },
    lastReadingAt: { type: Date },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// Helpful virtual: flagged if >= 85%
BinSchema.virtual('flagged').get(function flagged() {
  return (this.fillLevelPercent || 0) >= 85;
});

export default mongoose.model('Bin', BinSchema);
