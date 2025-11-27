export async function initiatePesapalPayment(orderId: string) {
  return fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/pesapal/initiate/?order_tracking_id=${orderId}`,
    { credentials: "include" }
  ).then((res) => res.json());
}
