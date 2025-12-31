import { initiatePesapalPayment as initiatePayment } from "@/lib/actions/pesapal";

export async function initiatePesapalPayment(bookingId: string, amount: number) {
  return initiatePayment({ bookingId, amount });
}
