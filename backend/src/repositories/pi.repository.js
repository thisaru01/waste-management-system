import PiMetric from '../models/pi/pi.model.js';

const create = async (doc) => {
  return PiMetric.create(doc);
};

const upsertByKey = async (key, value) => {
  return PiMetric.findOneAndUpdate({ key }, { value, recordedAt: new Date() }, { upsert: true, new: true });
};

const findAll = async () => PiMetric.find({}).lean();

export default { create, upsertByKey, findAll };
