import { motion } from "framer-motion";
import { RadialBar, RadialBarChart } from "recharts";

function scoreColor(score: number): string {
  if (score >= 70) return "#2ECC71";
  if (score >= 45) return "#F5A623";
  return "#E74C3C";
}

function scoreLabel(score: number): string {
  if (score >= 70) return "Healthy";
  if (score >= 45) return "Needs attention";
  return "At risk";
}

export function HealthScoreGauge({
  score,
  size = 180,
  compact = false,
}: {
  score: number;
  size?: number;
  compact?: boolean;
}) {
  const color = scoreColor(score);
  const data = [{ name: "score", value: score, fill: color }];
  const center = size / 2;
  const barSize = size * 0.078;

  return (
    <div className="relative flex flex-col items-center" style={{ width: size }}>
      <RadialBarChart
        width={size}
        height={size}
        cx={center}
        cy={center}
        innerRadius={size * 0.39}
        outerRadius={size * 0.49}
        barSize={barSize}
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <RadialBar dataKey="value" cornerRadius={barSize / 2} background={{ fill: "#242838" }} />
      </RadialBarChart>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute flex flex-col items-center"
        style={{ top: center - (compact ? 14 : 26) }}
      >
        <span className={compact ? "text-xl font-bold text-white" : "text-3xl font-bold text-white"}>
          {score}
        </span>
        {!compact && <span className="text-xs text-slate-500">/ 100</span>}
      </motion.div>
      {!compact && (
        <>
          <p className="mt-2 text-sm font-medium" style={{ color }}>
            {scoreLabel(score)}
          </p>
          <p className="text-xs text-slate-500">Business Health Score</p>
        </>
      )}
    </div>
  );
}
