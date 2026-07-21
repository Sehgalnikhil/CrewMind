import { useState } from "react";

import { AgentPanel } from "#/components/agents/AgentPanel";
import { AppShell } from "#/components/layout/AppShell";
import { Card } from "#/components/ui/Card";

export function AgentPanelPage() {
  const [runId, setRunId] = useState<string | null>(null);

  return (
    <AppShell title="Agent Panel">
      <div className="mx-auto max-w-4xl">
        <Card>
          <AgentPanel runId={runId} onRunStarted={setRunId} />
        </Card>
      </div>
    </AppShell>
  );
}
