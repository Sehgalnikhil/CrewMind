import { api } from "./client";

export interface CreateSubscriptionRequest {
  plan_name: string;
}

export interface VerifyPaymentRequest {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

export async function createSubscription(data: CreateSubscriptionRequest) {
  const response = await api.post("/billing/create-subscription", data);
  return response.data;
}

export async function verifyPayment(data: VerifyPaymentRequest) {
  const response = await api.post("/billing/verify", data);
  return response.data;
}
