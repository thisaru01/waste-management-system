import CollectionHistory from "../models/collection/collectionHistory.model.js";

export class CollectionHistoryRepository {
  /**
   * Create a new collection history record
   * @param {Object} payload
   * @returns {Promise<Object>} Saved document
   */
  async create(payload) {
    const doc = new CollectionHistory(payload);
    await doc.save();
    return doc;
  }

  /**
   * List history by collector
   * @param {string} collectorId
   */
  async listByCollector(collectorId) {
    return CollectionHistory.find({ collector: collectorId })
      .sort({ finishedAt: -1 })
      .lean();
  }
}

export default new CollectionHistoryRepository();
