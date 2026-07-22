import { motion } from "framer-motion";
import { FileCheck2 } from "lucide-react";

import { cn } from "#/lib/utils";
import type { Report } from "#/types";

function healthColor(score: number) {
  if (score >= 70) return "#059669";
  if (score >= 45) return "#D97706";
  return "#EC4899";
}

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
    <div className="flex flex-col gap-2">
      {reports.map((report, i) => {
        const active = selectedId === report.id;
        const color = healthColor(report.business_health_score);
        return (
          <motion.button
            key={report.id}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ x: 3 }}
            onClick={() => onSelect(report.id)}
            className={cn(
              "glass group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-3.5 py-3 text-left transition-all",
              active && "border-crew-500/40",
            )}
            style={active ? { boxShadow: "0 0 0 1px rgba(138,123,239,0.4), 0 0 30px -10px rgba(138,123,239,0.7)" } : undefined}
          >
            {active && (
              <motion.span
                layoutId="report-active"
                aria-hidden
                className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-gradient-to-b from-crew-400 to-[#0891CF]"
              />
            )}
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-crew-500/15 text-crew-300">
              <FileCheck2 className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("truncate text-xs font-bold", active ? "text-white" : "text-slate-300")}>{report.title}</p>
              <p className="font-mono text-[9px] uppercase tracking-wider text-slate-600">
                {new Date(report.created_at).toLocaleDateString()}
              </p>
            </div>
            <span
              className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-extrabold tabular-nums"
              style={{ borderColor: `${color}44`, color, backgroundColor: `${color}12` }}
            >
              {report.business_health_score}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
