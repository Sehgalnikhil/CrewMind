import { api } from "./client";

export interface OrganizationMetricResponse {
  id: string;
  org_id: string;
  revenue_run_rate: number;
  revenue_trend: string;
  revenue_trend_up: boolean;
  revenue_series: number[];
  net_cash_flow: number;
  cash_flow_trend: string;
  cash_flow_trend_up: boolean;
  cash_flow_series: number[];
  created_at: string;
}

export async function getMetrics(): Promise<OrganizationMetricResponse> {
  const { data } = await api.get<OrganizationMetricResponse>("/metrics");
  return data;
}
