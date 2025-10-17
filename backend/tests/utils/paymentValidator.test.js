import PaymentValidator from '../../src/utils/paymentValidator.js';
import { ValidationError } from '../../src/utils/errors.js';

describe('PaymentValidator', () => {
  test('validateAmount accepts positive numbers and coerces strings', () => {
    expect(PaymentValidator.validateAmount(10)).toBe(10);
    expect(PaymentValidator.validateAmount('12.5')).toBe(12.5);
  });

  test('validateAmount rejects NaN and non-positive', () => {
    expect(() => PaymentValidator.validateAmount('abc')).toThrow(ValidationError);
    expect(() => PaymentValidator.validateAmount(0)).toThrow(ValidationError);
    expect(() => PaymentValidator.validateAmount(-1)).toThrow(ValidationError);
  });

  test('validateStatus accepts known statuses and rejects unknown', () => {
    ['pending', 'paid', 'overdue', 'cancelled'].forEach((s) => {
      expect(PaymentValidator.validateStatus(s)).toBe(s);
    });
    expect(() => PaymentValidator.validateStatus('weird')).toThrow(ValidationError);
  });

  test('validatePaymentMethod accepts allowed or empty', () => {
    ['cash', 'card', 'bank_transfer', 'online', 'stripe', undefined, null].forEach((m) => {
      expect(PaymentValidator.validatePaymentMethod(m)).toBe(m);
    });
  });

  test('validatePaymentMethod rejects invalid', () => {
    expect(() => PaymentValidator.validatePaymentMethod('crypto')).toThrow(ValidationError);
  });

  test('validateInvoiceNumber enforces format', () => {
    const good = 'INV-20250101-123';
    expect(PaymentValidator.validateInvoiceNumber(good)).toBe(good);
    expect(() => PaymentValidator.validateInvoiceNumber('')).toThrow(ValidationError);
    expect(() => PaymentValidator.validateInvoiceNumber('INV-2025-1')).toThrow(ValidationError);
  });

  test('validatePaymentData ensures required fields', () => {
    expect(() => PaymentValidator.validatePaymentData({})).toThrow(ValidationError);
    const ok = () => PaymentValidator.validatePaymentData({ invoiceNumber: 'INV-20250101-001', amount: 10, dueDate: new Date() });
    expect(ok).not.toThrow();
  });

  test('validateDate parses valid dates and rejects invalid', () => {
    const d = PaymentValidator.validateDate('2025-01-01');
    expect(d).toBeInstanceOf(Date);
    expect(() => PaymentValidator.validateDate('bad', 'Due date')).toThrow(ValidationError);
  });

  test('canModifyPayment rejects paid or cancelled', () => {
    expect(() => PaymentValidator.canModifyPayment({ status: 'paid' })).toThrow(ValidationError);
    expect(() => PaymentValidator.canModifyPayment({ status: 'cancelled' })).toThrow(ValidationError);
    expect(PaymentValidator.canModifyPayment({ status: 'pending' })).toBe(true);
  });

  test('canCancelPayment rejects paid only', () => {
    expect(() => PaymentValidator.canCancelPayment({ status: 'paid' })).toThrow(ValidationError);
    expect(PaymentValidator.canCancelPayment({ status: 'pending' })).toBe(true);
  });

  test('sanitizeUpdateData only keeps allowed fields', () => {
    const result = PaymentValidator.sanitizeUpdateData({ amount: 5, dueDate: new Date(), description: 'x', period: '2025-01', foo: 'bar' });
    expect(Object.keys(result).sort()).toEqual(['amount', 'description', 'dueDate', 'period'].sort());
  });

  test('generateInvoiceNumber follows pattern', () => {
    const inv = PaymentValidator.generateInvoiceNumber(new Date('2025-01-02'));
    expect(inv).toMatch(/^INV-20250102-\d{3}$/);
  });
});
