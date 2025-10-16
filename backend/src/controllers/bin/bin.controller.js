import binRepo from '../../repositories/bin.repository.js';

/**
 * GET /api/bins
 * List bins with minimal details for simulation UI
 */
export const listBins = async (_req, res) => {
  const bins = await binRepo.list({}, '-__v');
  return res.json(bins);
};

/**
 * PATCH /api/bins/:id/sensor
 * Update sensor readings: { fillLevelPercent?, weightKg? }
 */
export const updateBinSensor = async (req, res) => {
  const { id } = req.params;
  const { fillLevelPercent, weightKg } = req.body || {};
  if (typeof fillLevelPercent !== 'number' && typeof weightKg !== 'number') {
    return res.status(400).json({ message: 'fillLevelPercent or weightKg is required' });
  }
  const updated = await binRepo.updateSensor(id, { fillLevelPercent, weightKg });
  if (!updated) return res.status(404).json({ message: 'Bin not found' });
  return res.json(updated);
};

export default { listBins, updateBinSensor };
