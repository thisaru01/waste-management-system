import Bin from "../models/bin/bin.model.js";

export class BinRepository {
  async list(filter = {}, projection = null) {
    return Bin.find(filter, projection)
      .populate("owner", "firstName lastName email roles")
      .populate("assignedCollector", "firstName lastName email roles")
      .lean();
  }

  async findById(id) {
    return Bin.findById(id);
  }

  async findByCode(code) {
    return Bin.findOne({ code: code.trim() });
  }

  async create(data, options) {
    if (options?.session) {
      const doc = new Bin(data);
      await doc.save(options);
      return doc;
    }
    return Bin.create(data);
  }

  async updateSensor(id, { fillLevelPercent, weightKg, status }) {
    const update = { lastReadingAt: new Date() };
    if (typeof fillLevelPercent === "number")
      update.fillLevelPercent = Math.max(0, Math.min(100, fillLevelPercent));
    if (typeof weightKg === "number") update.weightKg = Math.max(0, weightKg);
    if (typeof status === "string") update.status = status;
    return Bin.findByIdAndUpdate(id, update, { new: true });
  }

  async assignCollector(id, collectorId) {
    // Fetch current bin to decide whether to change status
    const bin = await Bin.findById(id);
    if (!bin) return null;

    const update = {
      assignedCollector: collectorId,
      assignedAt: new Date(),
    };

    // If the bin currently needs collection or is overflowed, set status to 'assigned'
    if (bin.status === "needs-collection" || bin.status === "overflow") {
      update.status = "assigned";
    }

    return Bin.findByIdAndUpdate(id, update, { new: true })
      .populate("owner", "firstName lastName email roles")
      .populate("assignedCollector", "firstName lastName email roles");
  }

  async clearAssignment(id) {
    const update = { assignedCollector: null, assignedAt: null };
    return Bin.findByIdAndUpdate(id, update, { new: true })
      .populate("owner", "firstName lastName email roles")
      .populate("assignedCollector", "firstName lastName email roles");
  }
}

export default new BinRepository();
