import { motion } from "framer-motion";

import { HealthScoreGauge } from "#/components/dashboard/HealthScoreGauge";
import { RecommendationList } from "#/components/dashboard/RecommendationList";
import { RiskOpportunityCards } from "#/components/dashboard/RiskOpportunityCards";
import { Card } from "#/components/ui/Card";
import type { Report } from "#/types";

export function ExecutiveReportView({ report }: { report: Report }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
    >
      <Card className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <HealthScoreGauge score={report.business_health_score} />
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {new Date(report.created_at).toLocaleString()}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">{report.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{report.summary}</p>
        </div>
      </Card>

      <RiskOpportunityCards risks={report.risks} opportunities={report.opportunities} />
      <RecommendationList recommendations={report.recommendations} />
    </motion.div>
  );
}
