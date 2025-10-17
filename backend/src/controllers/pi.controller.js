import piRepo from '../repositories/pi.repository.js';

const getAll = async (req, res, next) => {
  try {
    const items = await piRepo.findAll();
    return res.json(items.reduce((acc, it) => ({ ...acc, [it.key]: it.value }), {}));
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
