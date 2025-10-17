import { vi, describe, beforeEach, test, expect } from 'vitest';
import * as bins from './bins';

// Mock the API module used by services
vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

import API from './api';

describe('bins service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('listAssignedBinsForCollector calls correct endpoint', async () => {
    API.get.mockResolvedValue({ data: [{ id: 'b1' }] });
    const res = await bins.listAssignedBinsForCollector();
    expect(API.get).toHaveBeenCalledWith('/api/assignments/my-bins');
    expect(res).toEqual([{ id: 'b1' }]);
  });

  test('assignBin sends collectorId body and returns data', async () => {
    API.patch.mockResolvedValue({ data: { _id: 'b2' } });
    const res = await bins.assignBin('bin2', 'col2');
    expect(API.patch).toHaveBeenCalledWith('/api/assignments/bins/bin2/assign', { collectorId: 'col2' });
    expect(res).toEqual({ _id: 'b2' });
  });

  test('getBinByCode encodes code', async () => {
    API.get.mockResolvedValue({ data: { code: 'C1' } });
    const res = await bins.getBinByCode('CODE 1');
    expect(API.get).toHaveBeenCalledWith('/api/collections/code/CODE%201');
    expect(res).toEqual({ code: 'C1' });
  });

  test('startCollectionSession posts and returns data', async () => {
    API.post.mockResolvedValue({ data: { sessionDurationMinutes: 15 } });
    const res = await bins.startCollectionSession('bin3');
    expect(API.post).toHaveBeenCalledWith('/api/collections/bin3/start-session');
    expect(res).toEqual({ sessionDurationMinutes: 15 });
  });
});
