import CollectionRecord from '../models/collection/collection.model.js';

const create = async (doc) => CollectionRecord.create(doc);

const findByDate = async (date) => CollectionRecord.find({ date }).sort({ hour: 1 }).lean();

const bulkInsert = async (docs) => CollectionRecord.insertMany(docs);

export default { create, findByDate, bulkInsert };
