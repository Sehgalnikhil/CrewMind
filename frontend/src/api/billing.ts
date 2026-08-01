import { api } from "./client";

export interface CreateOrderRequest {
  plan_name: string;
  is_annual?: boolean;
  addon_id?: string;
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

export interface BillingUsage {
  plan: {
    name: string;
    billing_cycle: string;
    status: string;
  };
  usage: {
    label: string;
    used: number;
    limit: number;
    color: string;
    unit: string;
  }[];
}

export async function getUsage(): Promise<BillingUsage> {
  const response = await api.get("/billing/usage");
  return response.data;
}
