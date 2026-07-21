import { motion } from "framer-motion";
import { FileText, Sparkles, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { AppShell } from "#/components/layout/AppShell";
import { Card } from "#/components/ui/Card";
import { AGENTS } from "#/types";

const QUICK_ACTIONS = [
  {
    to: "/documents",
    icon: FileText,
    title: "Upload documents",
    description: "Add financial statements, contracts, or reports for your crew to analyze.",
  },
  {
    to: "/agents",
    icon: Users,
    title: "Meet your executive team",
    description: "Five specialized agents ready to analyze your business.",
  },
  {
    to: "/reports",
    icon: Sparkles,
    title: "Generate an executive report",
    description: "Get a business health score, risks, opportunities, and recommendations.",
  },
];

export function DashboardPage() {
  return (
    <AppShell title="Dashboard">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto max-w-5xl"
      >
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white">Welcome to your executive team</h2>
          <p className="mt-1 text-sm text-slate-400">
            Upload your business documents and let your AI crew get to work.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {QUICK_ACTIONS.map(({ to, icon: Icon, title, description }, i) => (
            <motion.div
              key={to}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link to={to}>
                <Card className="group h-full transition-colors hover:border-crew-500/50">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-crew-500/15 text-crew-300 transition-colors group-hover:bg-crew-500/25">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-medium text-white">{title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{description}</p>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-10">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate-500">
            Your executive team
          </h3>
          <div className="grid gap-4 sm:grid-cols-5">
            {AGENTS.map((agent, i) => (
              <motion.div
                key={agent.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
              >
                <Card className="text-center">
                  <div
                    className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: agent.color }}
                  >
                    {agent.name[0]}
                  </div>
                  <p className="text-sm font-medium text-white">{agent.name}</p>
                  <p className="text-xs text-slate-500">{agent.title}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </AppShell>
  );
}
