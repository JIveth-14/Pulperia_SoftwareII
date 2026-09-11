interface PaymentNotificationPayload {
  customer_email: string;
  customer_name: string;
  amount: number;
  remaining: number;
  receipt_number?: string | null;
}

export async function sendPaymentNotification(
  _payload: PaymentNotificationPayload
) {
  return { success: true };
}
