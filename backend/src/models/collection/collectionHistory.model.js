import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * CollectionHistory
 * Stores a snapshot of a collector's finished schedule for a given day.
 * This is denormalized to preserve historical details at the time of completion.
 */
const BinSnapshotSchema = new Schema(
  {
    bin: { type: Schema.Types.ObjectId, ref: "Bin", required: true },
    code: { type: String, required: true },
    type: { type: String, required: true },
    capacityLiters: { type: Number, default: 0 },
    locationDescription: { type: String, default: "" },
    fillLevelPercent: { type: Number, default: 0 },
    weightKg: { type: Number, default: 0 },
    status: { type: String, default: "collected" },
    collectedAt: { type: Date },
  },
  { _id: false }
);

const CollectionHistorySchema = new Schema(
  {
    collector: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    finishedAt: { type: Date, default: Date.now, index: true },
    bins: { type: [BinSnapshotSchema], default: [] },
    summary: {
      totalBins: { type: Number, default: 0 },
      collectedBins: { type: Number, default: 0 },
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("CollectionHistory", CollectionHistorySchema);
