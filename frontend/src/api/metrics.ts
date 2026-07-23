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

export interface DashboardMetrics {
  active_tasks: number;
  failed_tasks: number;
  total_memories: number;
  total_topics: number;
  active_agents: number;
  utilization_pct: number;
  agent_utilization: Record<string, number>;
  total_messages: number;
  estimated_cost_usd: number;
  total_tokens: number;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const { data } = await api.get<DashboardMetrics>("/metrics/dashboard");
  return data;
}
