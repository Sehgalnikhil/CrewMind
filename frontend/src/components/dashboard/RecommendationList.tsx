import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import { Card } from "#/components/ui/Card";

export function RecommendationList({ recommendations }: { recommendations: string[] }) {
  return (
    <Card>
      <h3 className="mb-3 font-medium text-white">Recommended actions</h3>
      {recommendations.length === 0 ? (
        <p className="text-sm text-slate-500">No recommendations yet.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {recommendations.map((rec, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-3 text-sm text-slate-200"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-crew-400" />
              {rec}
            </motion.li>
          ))}
        </ol>
      )}
    </Card>
  );
}
