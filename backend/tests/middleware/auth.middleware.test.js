import { authenticate as authn, authorize as authz } from '../../src/middleware/auth.middleware.js';
import authService from '../../src/services/auth.service.js';

const makeRes = () => {
  const res = { statusCode: 200 };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
};

describe('auth.middleware', () => {
  test('authenticate returns 401 when token missing', () => {
    const req = { headers: {} };
    const res = makeRes();
    const next = jest.fn();
    authn(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/Missing token/i);
    expect(next).not.toHaveBeenCalled();
  });

  test('authenticate returns 401 when token invalid', () => {
    jest.spyOn(authService, 'verifyToken').mockImplementation(() => { throw new Error('bad token'); });
    const req = { headers: { authorization: 'Bearer invalid' } };
    const res = makeRes();
    const next = jest.fn();
    authn(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/Invalid or expired token/i);
    expect(next).not.toHaveBeenCalled();
    jest.restoreAllMocks();
  });

  test('authenticate sets req.user when token valid', () => {
    jest.spyOn(authService, 'verifyToken').mockImplementation(() => ({ sub: 'u1', email: 'a@b.com', roles: ['admin', 'resident'] }));
    const req = { headers: { authorization: 'Bearer valid' } };
    const res = makeRes();
    const next = jest.fn();
    authn(req, res, next);
    expect(req.user).toBeDefined();
    expect(next).toHaveBeenCalled();
    jest.restoreAllMocks();
  });

  test('authorize forbids when role not present', () => {
    const req = { user: { roles: ['resident'] } };
    const res = makeRes();
    const next = jest.fn();
    authz('admin')(req, res, next);
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/Forbidden/i);
    expect(next).not.toHaveBeenCalled();
  });

  test('authorize allows when role present', () => {
    const req = { user: { roles: ['admin'] } };
    const res = makeRes();
    const next = jest.fn();
    authz('admin')(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
