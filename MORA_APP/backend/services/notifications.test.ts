import { sendPaymentNotification } from './notifications';

const payload = {
  customer_email: 'john@example.com',
  customer_name: 'John Doe',
  amount: 500,
  remaining: 250,
  receipt_number: 'REC-001'
};

describe('sendPaymentNotification', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.restoreAllMocks();
  });

  it('should return skipped_in_test without warning in test mode', async () => {
    process.env.NODE_ENV = 'test';
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await sendPaymentNotification(payload);

    expect(result).toEqual({ sent: false, reason: 'skipped_in_test' });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should return not_implemented and warn outside test mode', async () => {
    process.env.NODE_ENV = 'production';
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await sendPaymentNotification(payload);

    expect(result).toEqual({ sent: false, reason: 'not_implemented' });
    expect(warnSpy).toHaveBeenCalledWith('sendPaymentNotification is not implemented yet.');
  });
});
