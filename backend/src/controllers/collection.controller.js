import collectionRepo from '../repositories/collection.repository.js';

const getTrendByDate = async (req, res, next) => {
  try {
    const { date } = req.query; // expect YYYY-MM-DD
    if (!date) return res.status(400).json({ message: 'date query is required (YYYY-MM-DD)' });
    const rows = await collectionRepo.findByDate(date);
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
};

const seedToday = async (req, res, next) => {
  try {
    const { date, samples } = req.body; // samples: [{hour, truckedKg, truckId}]
    if (!date || !Array.isArray(samples)) return res.status(400).json({ message: 'date and samples required' });
    await collectionRepo.bulkInsert(samples.map((s) => ({ date, ...s })));
    return res.json({ inserted: samples.length });
  } catch (err) {
    return next(err);
  }
};

export default { getTrendByDate, seedToday };
