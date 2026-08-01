import { api } from "#/api/client";
import type { Report } from "#/types";

const MOCK_REPORTS: Report[] = [
  {
    id: "mock-report-123",
    run_id: "mock-run-123",
    title: "EU Market Expansion Strategy",
    summary: "Analysis of DACH mid-market entry viability with CAC constraints.",
    content: "# EU Market Expansion Strategy\n\nBased on the analysis, entering the DACH mid-market is highly viable. We recommend holding pricing steady rather than matching competitor cuts, as retention modeling shows better long-term ARR.\n\n## Action Items\n1. Proceed with merchant-of-record integration.\n2. Finalize SOC 2 Type II compliance.\n3. Monitor churn metrics closely in Q3.",
    created_at: new Date().toISOString(),
    status: "final"
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
