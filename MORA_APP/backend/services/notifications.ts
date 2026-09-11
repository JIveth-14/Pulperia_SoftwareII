interface PaymentNotificationPayload {
  customer_email: string;
  customer_name: string;
  amount: number;
  remaining: number;
  receipt_number?: string | null;
}

type PaymentNotificationResult =
  | { sent: true }
  | { sent: false; reason: 'skipped_in_test' | 'not_implemented' };

export async function sendPaymentNotification(
  _payload: PaymentNotificationPayload
) : Promise<PaymentNotificationResult> {
  if (process.env.NODE_ENV === 'test') {
    return { sent: false, reason: 'skipped_in_test' };
  }

  console.warn('sendPaymentNotification is not implemented yet.');
  return { sent: false, reason: 'not_implemented' };
}
