import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp } from "lucide-react";

import { Card } from "#/components/ui/Card";

function ListCard({
  title,
  icon: Icon,
  items,
  tone,
}: {
  title: string;
  icon: typeof AlertTriangle;
  items: string[];
  tone: "danger" | "success";
}) {
  const toneClasses =
    tone === "danger" ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400";

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneClasses}`}>
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="font-medium text-white">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">None identified.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="text-sm leading-relaxed text-slate-300"
            >
              {item}
            </motion.li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function RiskOpportunityCards({
  risks,
  opportunities,
}: {
  risks: string[];
  opportunities: string[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ListCard title="Risks" icon={AlertTriangle} items={risks} tone="danger" />
      <ListCard title="Opportunities" icon={TrendingUp} items={opportunities} tone="success" />
    </div>
  );
}
