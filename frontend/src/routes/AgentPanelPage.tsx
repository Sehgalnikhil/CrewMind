import { useState } from "react";

import { AgentPanel } from "#/components/agents/AgentPanel";
import { AppShell } from "#/components/layout/AppShell";

export function AgentPanelPage() {
  const [runId, setRunId] = useState<string | null>(null);

  return (
    <AppShell title="AI Workspace">
      <div className="mx-auto max-w-5xl">
        <AgentPanel runId={runId} onRunStarted={setRunId} />
      </div>
    </AppShell>
  );
}
