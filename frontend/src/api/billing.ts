import { api } from "./client";

export interface CreateOrderRequest {
  plan_name: string;
}

export interface VerifyPaymentRequest {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export async function createOrder(data: CreateOrderRequest) {
  const response = await api.post("/billing/create-order", data);
  return response.data;
}

export async function verifyPayment(data: VerifyPaymentRequest) {
  const response = await api.post("/billing/verify", data);
  return response.data;
}
