import { useQuery } from "@tanstack/react-query";
import { FileBarChart } from "lucide-react";
import { useEffect, useState } from "react";

import { listReports } from "#/api/reports";
import { AppShell } from "#/components/layout/AppShell";
import { ExecutiveReportView } from "#/components/reports/ExecutiveReportView";
import { ReportHistoryList } from "#/components/reports/ReportHistoryList";
import { Card } from "#/components/ui/Card";
import { Spinner } from "#/components/ui/Spinner";

export function ReportsPage() {
  const { data: reports, isLoading } = useQuery({ queryKey: ["reports"], queryFn: listReports });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (reports && reports.length > 0 && !selectedId) {
      setSelectedId(reports[0].id);
    }
  }, [reports, selectedId]);

  const selectedReport = reports?.find((r) => r.id === selectedId) ?? null;

  return (
    <AppShell title="Reports">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[220px_1fr]">
        <div>
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">
            History
          </h3>
          {isLoading ? (
            <Spinner />
          ) : reports && reports.length > 0 ? (
            <ReportHistoryList
              reports={reports}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          ) : (
            <p className="text-sm text-slate-500">No reports yet.</p>
          )}
        </div>

        <div>
          {selectedReport ? (
            <ExecutiveReportView report={selectedReport} />
          ) : (
            !isLoading && (
              <Card className="flex flex-col items-center gap-2 py-16 text-center text-slate-500">
                <FileBarChart className="h-8 w-8" />
                <p className="text-sm">
                  No executive reports yet. Run an analysis from the Agent Panel to generate one.
                </p>
              </Card>
            )
          )}
        </div>
      </div>
    </AppShell>
  );
}
