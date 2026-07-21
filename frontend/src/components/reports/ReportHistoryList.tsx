import { cn } from "#/lib/utils";
import type { Report } from "#/types";

export function ReportHistoryList({
  reports,
  selectedId,
  onSelect,
}: {
  reports: Report[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {reports.map((report) => (
        <button
          key={report.id}
          onClick={() => onSelect(report.id)}
          className={cn(
            "flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
            selectedId === report.id
              ? "border-crew-500/50 bg-crew-500/10 text-white"
              : "border-surface-border bg-surface-raised text-slate-300 hover:border-crew-500/30"
          )}
        >
          <span className="truncate">{new Date(report.created_at).toLocaleDateString()}</span>
          <span
            className="ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{
              backgroundColor:
                report.business_health_score >= 70
                  ? "rgba(46,204,113,0.15)"
                  : report.business_health_score >= 45
                    ? "rgba(245,166,35,0.15)"
                    : "rgba(231,76,60,0.15)",
              color:
                report.business_health_score >= 70
                  ? "#2ECC71"
                  : report.business_health_score >= 45
                    ? "#F5A623"
                    : "#E74C3C",
            }}
          >
            {report.business_health_score}
          </span>
        </button>
      ))}
    </div>
  );
}
