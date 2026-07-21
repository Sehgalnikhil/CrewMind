import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, PlayCircle, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { startAgentRun } from "#/api/agents";
import { AgentStatusCard } from "#/components/agents/AgentStatusCard";
import { Button } from "#/components/ui/Button";
import { useAgentRunSocket } from "#/hooks/useAgentRunSocket";
import { AGENTS } from "#/types";

const RUN_STATUS_LABEL: Record<string, string> = {
  pending: "Starting...",
  researching: "Researching market context...",
  analyzing: "Analyzing documents in parallel...",
  synthesizing: "Synthesizing executive report...",
  completed: "Analysis complete",
  failed: "Analysis failed",
};

export function AgentPanel({
  runId,
  onRunStarted,
}: {
  runId: string | null;
  onRunStarted: (runId: string) => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { runStatus, agentStatuses, reportId, error } = useAgentRunSocket(runId);

  const mutation = useMutation({
    mutationFn: startAgentRun,
    onSuccess: (run) => onRunStarted(run.id),
  });

  const isRunning = runStatus !== null && runStatus !== "completed" && runStatus !== "failed";

  useEffect(() => {
    if (reportId) {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    }
  }, [reportId, queryClient]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Your executive team</h2>
          <p className="text-sm text-slate-400">
            {runStatus ? RUN_STATUS_LABEL[runStatus] ?? runStatus : "Run an analysis on your uploaded documents."}
          </p>
        </div>
        <Button
          onClick={() => mutation.mutate()}
          loading={mutation.isPending || isRunning}
          icon={<PlayCircle className="h-4 w-4" />}
        >
          {isRunning ? "Analyzing..." : "Run Analysis"}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map((agent) => (
          <AgentStatusCard
            key={agent.key}
            name={agent.name}
            title={agent.title}
            color={agent.color}
            status={agentStatuses[agent.key]}
          />
        ))}
        <AgentStatusCard
          name="Coordinator"
          title="Synthesizes the executive report"
          color="#9B59B6"
          status={agentStatuses.coordinator}
        />
      </div>

      {reportId && (
        <Button
          variant="secondary"
          icon={<Sparkles className="h-4 w-4" />}
          onClick={() => navigate("/reports")}
        >
          View executive report
        </Button>
      )}
    </div>
  );
}
