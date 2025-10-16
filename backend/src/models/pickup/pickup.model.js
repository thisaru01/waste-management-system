import mongoose from 'mongoose';

const { Schema } = mongoose;

const PickupSchema = new Schema(
  {
    date: {
      type: Date,
      required: [true, 'Pickup date is required'],
      index: true,
    },
    itemType: {
      type: String,
      required: [true, 'Item type is required'],
      trim: true,
    },
    itemWeight: {
      type: String,
      required: [true, 'Item weight/size is required'],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    resident: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Resident reference is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying resident's pickups
PickupSchema.index({ resident: 1, date: -1 });

// Index for querying by status and date
PickupSchema.index({ status: 1, date: 1 });

export default mongoose.model('Pickup', PickupSchema);
