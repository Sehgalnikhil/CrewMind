import { api } from "#/api/client";
import type { Report } from "#/types";

const MOCK_REPORTS: Report[] = [
  {
    id: "mock-report-123",
    agent_run_id: "mock-run-123",
    title: "EU Market Expansion Strategy",
    summary: "Analysis of DACH mid-market entry viability with CAC constraints.",
    business_health_score: 85,
    risks: ["High CAC in new markets"],
    opportunities: ["DACH mid-market entry"],
    recommendations: ["Proceed with merchant-of-record integration", "Finalize SOC 2 Type II compliance", "Monitor churn metrics closely in Q3"],
    created_at: new Date().toISOString(),
  }
];

export async function listReports(): Promise<Report[]> {
  try {
    const { data } = await api.get<Report[]>("/reports");
    return data;
  } catch (error) {
    return MOCK_REPORTS;
  }
}

export async function getReport(id: string): Promise<Report> {
  try {
    const { data } = await api.get<Report>(`/reports/${id}`);
    return data;
  } catch (error) {
    return MOCK_REPORTS.find(r => r.id === id) || MOCK_REPORTS[0];
  }
}
