import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FileBarChart, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listReports } from "#/api/reports";
import { AppShell } from "#/components/layout/AppShell";
import { ExecutiveReportView } from "#/components/reports/ExecutiveReportView";
import { ReportHistoryList } from "#/components/reports/ReportHistoryList";
import { EmptyState, OrbitalLoader, Panel } from "#/components/os/ui";

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
    <AppShell title="Executive Reports">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[260px_1fr]">
        {/* history rail */}
        <div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">the record</p>
            <h3 className="mb-4 mt-1 text-lg font-extrabold tracking-tight text-white">Every verdict</h3>
          </motion.div>
          {isLoading ? (
            <OrbitalLoader label="loading reports" />
          ) : reports && reports.length > 0 ? (
            <ReportHistoryList reports={reports} selectedId={selectedId} onSelect={setSelectedId} />
          ) : (
            <p className="text-sm text-slate-500">No reports yet.</p>
          )}
        </div>

        {/* report */}
        <div>
          {selectedReport ? (
            <ExecutiveReportView report={selectedReport} />
          ) : (
            !isLoading && (
              <Panel className="p-4">
                <EmptyState
                  icon={<FileBarChart className="h-6 w-6" />}
                  title="No executive reports yet"
                  body="Run a crew analysis and the signed verdict — summary, health score, risks, opportunities and an action plan — lands here."
                  action={
                    <Link
                      to="/agents"
                      className="flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-black shadow-[0_0_40px_-10px_rgba(138,123,239,0.9)] transition-transform hover:-translate-y-0.5"
                    >
                      <Zap className="h-4 w-4" /> Run your first analysis
                    </Link>
                  }
                />
              </Panel>
            )
          )}
        </div>
      </div>
    </AppShell>
  );
}
