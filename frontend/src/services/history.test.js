import { vi, describe, beforeEach, test, expect } from 'vitest';
import * as history from './history';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import API from './api';

describe('history service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('finishTodaySchedule posts to finish-today', async () => {
    API.post.mockResolvedValue({ data: { _id: 'h1' } });
    const res = await history.finishTodaySchedule();
    expect(API.post).toHaveBeenCalledWith('/api/history/finish-today');
    expect(res).toEqual({ _id: 'h1' });
  });

  test('listMyHistory calls /api/history/my', async () => {
    API.get.mockResolvedValue({ data: [{ _id: 'h2' }] });
    const res = await history.listMyHistory();
    expect(API.get).toHaveBeenCalledWith('/api/history/my');
    expect(res).toEqual([{ _id: 'h2' }]);
  });
});
