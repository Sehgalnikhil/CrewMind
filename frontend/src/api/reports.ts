import { api } from "#/api/client";
import type { Report } from "#/types";

export async function listReports(): Promise<Report[]> {
  const { data } = await api.get<Report[]>("/reports");
  return data;
}

export async function getReport(id: string): Promise<Report> {
  const { data } = await api.get<Report>(`/reports/${id}`);
  return data;
}
