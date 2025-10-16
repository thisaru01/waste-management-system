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
 * GET /api/bins/flagged
 * List bins that are flagged for collection (fillLevelPercent >= threshold)
 * Accessible to any authenticated user.
 */
export const listFlagged = async (req, res) => {
  const threshold = Number(req.query.threshold ?? 85);
  const filter = { fillLevelPercent: { $gte: threshold } };
  const bins = await binRepo.list(filter, '-__v');
  return res.json(bins);
};

/**
 * PATCH /api/bins/:id/sensor
 * Update sensor readings: { fillLevelPercent?, weightKg? }
 */
export const updateBinSensor = async (req, res) => {
  const { id } = req.params;
  const { fillLevelPercent, weightKg, status } = req.body || {};
  if (typeof fillLevelPercent !== 'number' && typeof weightKg !== 'number' && typeof status !== 'string') {
    return res.status(400).json({ message: 'Provide at least one of: fillLevelPercent, weightKg, status' });
  }
  let nextStatus = status;
  if (!nextStatus && typeof fillLevelPercent === 'number') {
    // treat 100% as overflow
    if (fillLevelPercent >= 100) nextStatus = 'overflow';
    else if (fillLevelPercent >= 85) nextStatus = 'needs-collection';
    else if (fillLevelPercent <= 5) nextStatus = 'collected';
    else nextStatus = 'normal';
  }
  const updated = await binRepo.updateSensor(id, { fillLevelPercent, weightKg, status: nextStatus });
  if (!updated) return res.status(404).json({ message: 'Bin not found' });
  return res.json(updated);
};

export default { listBins, updateBinSensor };
