import { jest, beforeAll, beforeEach, describe, test, expect } from '@jest/globals';

let assignmentController;
let collectionController;
let historyController;
let binRepo;
let historyRepo;
let User;

beforeAll(async () => {
  // Create mocks using jest (available inside beforeAll)
  const binRepoMock = {
    list: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    assignCollector: jest.fn(),
    clearAssignment: jest.fn(),
    startSession: jest.fn(),
    updateSensor: jest.fn(),
    endSession: jest.fn(),
  };

  const historyRepoMock = {
    create: jest.fn(),
    listByCollector: jest.fn(),
    listAll: jest.fn(),
  };

  const UserModelMock = {
    findById: jest.fn(),
  };

  // Register ESM module mocks before importing (export as default)
  jest.unstable_mockModule('../repositories/bin.repository.js', () => ({ default: binRepoMock }));
  jest.unstable_mockModule('../repositories/collectionHistory.repository.js', () => ({ default: historyRepoMock }));
  jest.unstable_mockModule('../models/user/user.model.js', () => ({ default: UserModelMock }));

  // Import controllers after mocks are registered
  const modules = await Promise.all([
    import('../controllers/assignment/assignment.controller.js'),
    import('../controllers/collection/collection.controller.js'),
    import('../controllers/history/history.controller.js'),
    import('../repositories/bin.repository.js'),
    import('../repositories/collectionHistory.repository.js'),
    import('../models/user/user.model.js'),
  ]);

  assignmentController = modules[0].default;
  collectionController = modules[1].default;
  historyController = modules[2].default;
  binRepo = modules[3].default;
  historyRepo = modules[4].default;
  User = modules[5].default;
});

// Helper to build mock response
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Authority flow: need-collection -> assign -> collect -> history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default session length
    process.env.COLLECTION_SESSION_MINUTES = '15';
  });

  test('Assign collector to a bin - positive case', async () => {
    const req = { params: { id: 'bin123' }, body: { collectorId: 'col1' } };
    const res = mockRes();

  // Mock user exists and has collector role
  User.findById.mockImplementationOnce(() => ({ populate: () => Promise.resolve({ _id: 'col1', roles: [{ name: 'collector' }] }) }));

    // Mock binRepo.assignCollector to return updated bin
    const updatedBin = { _id: 'bin123', status: 'assigned', code: 'HOU-1234', assignedCollector: { _id: 'col1' } };
    binRepo.assignCollector.mockResolvedValue(updatedBin);

    await assignmentController.assignCollector(req, res);

    expect(User.findById).toHaveBeenCalledWith('col1');
    expect(binRepo.assignCollector).toHaveBeenCalledWith('bin123', 'col1');
    expect(res.json).toHaveBeenCalledWith(updatedBin);
  });

  test('Assign collector - error when collectorId missing', async () => {
    const req = { params: { id: 'bin123' }, body: {} };
    const res = mockRes();

    await assignmentController.assignCollector(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'collectorId is required' });
  });

  test('Assign collector - user not found', async () => {
    const req = { params: { id: 'bin123' }, body: { collectorId: 'colX' } };
    const res = mockRes();

  User.findById.mockImplementationOnce(() => ({ populate: () => Promise.resolve(null) }));

    await assignmentController.assignCollector(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Collector user not found' });
  });

  test('Assign collector - user not a collector', async () => {
    const req = { params: { id: 'bin123' }, body: { collectorId: 'col2' } };
    const res = mockRes();

  User.findById.mockImplementationOnce(() => ({ populate: () => Promise.resolve({ _id: 'col2', roles: [{ name: 'viewer' }] }) }));

    await assignmentController.assignCollector(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'User is not a collector' });
  });

  test('Start collection session - positive', async () => {
    const req = { params: { id: 'binA' }, user: { sub: 'colA' } };
    const res = mockRes();

    const bin = { _id: 'binA', assignedCollector: 'colA', fillLevelPercent: 80, toObject() { return this; } };
    binRepo.findById.mockResolvedValue(bin);
    binRepo.startSession.mockResolvedValue({ ...bin, status: 'in-collection', sessionStartedAt: new Date() });

    await collectionController.startCollectionSession(req, res);

    expect(binRepo.findById).toHaveBeenCalledWith('binA');
    expect(binRepo.startSession).toHaveBeenCalledWith('binA', expect.objectContaining({ status: 'in-collection' }));
    expect(res.json).toHaveBeenCalled();
    const payload = res.json.mock.calls[0][0];
    expect(payload.sessionDurationMinutes).toBeDefined();
    expect(payload.message).toMatch(/Collection session started/);
  });

  test('Start collection session - unauthorized', async () => {
    const req = { params: { id: 'binA' }, user: {} };
    const res = mockRes();

    await collectionController.startCollectionSession(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('Start collection session - not assigned to collector', async () => {
    const req = { params: { id: 'binA' }, user: { sub: 'colZ' } };
    const res = mockRes();

    const bin = { _id: 'binA', assignedCollector: 'colY' };
    binRepo.findById.mockResolvedValue(bin);

    await collectionController.startCollectionSession(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'You are not assigned to this bin' });
  });

  test('Check collection session - completed when threshold met', async () => {
    const now = new Date();
    const startedAt = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
    const req = { params: { id: 'binX' }, user: { sub: 'colX' } };
    const res = mockRes();

    const bin = { _id: 'binX', assignedCollector: 'colX', sessionStartedAt: startedAt, sessionInitialFillLevel: 90, fillLevelPercent: 5, status: 'in-collection', updatedAt: now };
    binRepo.findById.mockResolvedValue(bin);
    binRepo.updateSensor.mockResolvedValue({ ...bin, status: 'collected' });
    binRepo.endSession.mockResolvedValue({ ...bin, sessionStartedAt: null });

    await collectionController.checkCollectionSession(req, res);

    expect(binRepo.findById).toHaveBeenCalledWith('binX');
    expect(binRepo.updateSensor).toHaveBeenCalledWith('binX', { status: 'collected' });
    expect(res.json).toHaveBeenCalled();
    const payload = res.json.mock.calls[0][0];
    expect(payload.sessionStatus).toBe('completed');
    expect(payload.bin.status).toBe('collected');
  });

  test('Check collection session - expired when duration passes', async () => {
    const now = new Date();
    const startedAt = new Date(now.getTime() - 60 * 60 * 1000); // 60 minutes ago
    process.env.COLLECTION_SESSION_MINUTES = '15';
    const req = { params: { id: 'binY' }, user: { sub: 'colY' } };
    const res = mockRes();

    const bin = { _id: 'binY', assignedCollector: 'colY', sessionStartedAt: startedAt, sessionInitialFillLevel: 80, fillLevelPercent: 70, status: 'in-collection' };
    binRepo.findById.mockResolvedValue(bin);
    binRepo.updateSensor.mockResolvedValue({ ...bin, status: 'assigned' });
    binRepo.endSession.mockResolvedValue({ ...bin, sessionStartedAt: null });

    await collectionController.checkCollectionSession(req, res);

    expect(binRepo.updateSensor).toHaveBeenCalledWith('binY', { status: 'assigned' });
    const payload = res.json.mock.calls[0][0];
    expect(payload.sessionStatus).toBe('expired');
    expect(payload.bin.status).toBe('assigned');
  });

  test('Mark as collected - success when level <= 5', async () => {
    const req = { params: { id: 'binC' }, user: { sub: 'colC' } };
    const res = mockRes();

    const bin = { _id: 'binC', status: 'in-collection', fillLevelPercent: 5, weightKg: 0 };
    binRepo.findById.mockResolvedValue(bin);
    binRepo.updateSensor.mockResolvedValue({ ...bin, status: 'collected' });
    binRepo.endSession.mockResolvedValue({ ...bin, sessionStartedAt: null });

    await collectionController.markAsCollected(req, res);

    expect(binRepo.updateSensor).toHaveBeenCalledWith('binC', expect.objectContaining({ status: 'collected' }));
    expect(res.json).toHaveBeenCalled();
  });

  test('Mark as collected - fail when level > 5', async () => {
    const req = { params: { id: 'binC' }, user: { sub: 'colC' } };
    const res = mockRes();

    const bin = { _id: 'binC', status: 'in-collection', fillLevelPercent: 50 };
    binRepo.findById.mockResolvedValue(bin);

    await collectionController.markAsCollected(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });

  test('Finish today schedule - positive', async () => {
    const req = { user: { sub: 'colFinish' } };
    const res = mockRes();

    const assignedBins = [
      { _id: 'b1', status: 'collected', code: 'C1', type: 'household', capacityLiters: 120, location: { description: 'X' }, fillLevelPercent: 0, weightKg: 0, updatedAt: new Date() },
      { _id: 'b2', status: 'collected', code: 'C2', type: 'household', capacityLiters: 120, location: { description: 'Y' }, fillLevelPercent: 0, weightKg: 0, updatedAt: new Date() },
    ];

    binRepo.list.mockResolvedValue(assignedBins);
    historyRepo.create.mockResolvedValue({ _id: 'hist1', collector: 'colFinish' });

    await historyController.finishTodaySchedule(req, res);

    expect(binRepo.list).toHaveBeenCalledWith({ assignedCollector: 'colFinish' });
    expect(historyRepo.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ _id: 'hist1' }));
  });

  test('Finish today schedule - fail when not all collected', async () => {
    const req = { user: { sub: 'colFinish' } };
    const res = mockRes();

    const assignedBins = [ { _id: 'b1', status: 'assigned' } ];
    binRepo.list.mockResolvedValue(assignedBins);

    await historyController.finishTodaySchedule(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'All bins must be collected before finishing the schedule' });
  });

  test('List all history - authority view', async () => {
    const req = {};
    const res = mockRes();

    historyRepo.listAll.mockResolvedValue([{ _id: 'h1' }]);
    await historyController.listAllHistory(req, res);

    expect(historyRepo.listAll).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith([{ _id: 'h1' }]);
  });
});
