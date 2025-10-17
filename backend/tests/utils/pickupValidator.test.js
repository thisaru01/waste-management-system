import PickupValidator from '../../src/utils/pickupValidator.js';
import { ValidationError } from '../../src/utils/errors.js';

describe('PickupValidator', () => {
  describe('validateFutureDate', () => {
    it('accepts today as valid', () => {
      const today = new Date();
      const result = PickupValidator.validateFutureDate(today);
      expect(result).toBeInstanceOf(Date);
    });

    it('rejects past dates', () => {
      const past = new Date();
      past.setDate(past.getDate() - 1);
      expect(() => PickupValidator.validateFutureDate(past)).toThrow(ValidationError);
    });
  });

  describe('validateScheduleData', () => {
    it('throws when required fields are missing', () => {
      expect(() => PickupValidator.validateScheduleData({})).toThrow(ValidationError);
    });

    it('passes when required fields are present', () => {
      const date = new Date();
      const ok = () => PickupValidator.validateScheduleData({ date, itemType: 'plastic', itemWeight: '2kg' });
      expect(ok).not.toThrow();
    });
  });

  describe('validateStatus', () => {
    it('accepts valid statuses', () => {
      ['scheduled', 'in-progress', 'completed', 'cancelled'].forEach((s) => {
        expect(PickupValidator.validateStatus(s)).toBe(s);
      });
    });

    it('rejects invalid status', () => {
      expect(() => PickupValidator.validateStatus('weird')).toThrow(ValidationError);
    });
  });

  describe('sanitizeUpdateData', () => {
    it('returns only allowed fields and trims untouched', () => {
      const sanitized = PickupValidator.sanitizeUpdateData({
        date: new Date(),
        itemType: 'metal',
        itemWeight: '3kg',
        notes: 'leave at gate',
        status: 'completed',
        foo: 'bar',
      });
      expect(Object.keys(sanitized).sort()).toEqual(['date', 'itemType', 'itemWeight', 'notes'].sort());
    });
  });
});
