import piRepo from '../repositories/pi.repository.js';

const getAll = async (req, res, next) => {
  try {
    const items = await piRepo.findAll();
    // Return an object where each key maps to { value, recordedAt }
    const mapped = items.reduce((acc, it) => ({
      ...acc,
      [it.key]: { value: it.value, recordedAt: it.recordedAt },
    }), {});
    return res.json(mapped);
  } catch (err) {
    return next(err);
  }
};

const seed = async (req, res, next) => {
  try {
    const data = req.body || {};
    // data expected as { key: value }
    const keys = Object.keys(data);
    // eslint-disable-next-line no-restricted-syntax
    for (const k of keys) {
      // eslint-disable-next-line no-await-in-loop
      await piRepo.upsertByKey(k, data[k]);
    }
    return res.json({ seeded: keys.length });
  } catch (err) {
    return next(err);
  }
};

export default { getAll, seed };
