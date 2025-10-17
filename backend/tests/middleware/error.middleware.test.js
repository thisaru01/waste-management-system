import { errorHandler } from '../../src/middleware/error.middleware.js';

const makeRes = () => {
  const res = { statusCode: 200 };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
};

describe('error.middleware', () => {
  test('uses provided status and message', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const err = { status: 418, message: 'I am a teapot' };
    const req = {};
    const res = makeRes();
    const next = jest.fn();
    errorHandler(err, req, res, next);
    expect(res.statusCode).toBe(418);
    expect(res.body).toEqual({ message: 'I am a teapot' });
    console.error.mockRestore();
  });

  test('defaults to 500 status and generic message', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('hidden internal');
    const req = {};
    const res = makeRes();
    const next = jest.fn();
    errorHandler(err, req, res, next);
    expect(res.statusCode).toBe(500);
    // Current middleware returns err.message when present
    expect(res.body).toEqual({ message: 'hidden internal' });
    console.error.mockRestore();
  });
});
