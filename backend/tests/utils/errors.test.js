import { ValidationError, NotFoundError, UnauthorizedError, BusinessRuleError } from '../../src/utils/errors.js';

describe('Custom Errors', () => {
  test('ValidationError sets name and statusCode', () => {
    const e = new ValidationError('Bad');
    expect(e.name).toBe('ValidationError');
    expect(e.statusCode).toBe(400);
    expect(e.message).toBe('Bad');
  });

  test('NotFoundError has default resource', () => {
    const e = new NotFoundError();
    expect(e.name).toBe('NotFoundError');
    expect(e.statusCode).toBe(404);
    expect(e.message).toMatch(/not found/);
  });

  test('UnauthorizedError defaults to 403 and message', () => {
    const e = new UnauthorizedError();
    expect(e.statusCode).toBe(403);
    expect(e.message).toMatch(/Unauthorized/);
  });

  test('BusinessRuleError uses provided message', () => {
    const e = new BusinessRuleError('Rule');
    expect(e.statusCode).toBe(400);
    expect(e.message).toBe('Rule');
  });
});
