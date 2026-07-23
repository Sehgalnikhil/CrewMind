import { useEffect, useRef, useState } from "react";

import { useAuth } from "@clerk/react";

export type PanelAgentKey = "research" | "strategy" | "finance" | "operations" | "legal" | "coordinator";
export type AgentPanelStatus = "idle" | "running" | "done";

type SocketEvent =
  | { type: "run_status"; status: string }
  | { type: "agent_status"; agent_key: PanelAgentKey; status: "running" | "done" }
  | { type: "reasoning_step"; agent: PanelAgentKey; monologue: string[]; critic: string | null; confidence: number }
  | { type: "completed"; report_id: string }
  | { type: "failed"; message: string }
  | { type: "error"; message: string };

export interface RunProgressState {
  runStatus: string | null;
  agentStatuses: Record<PanelAgentKey, AgentPanelStatus>;
  reportId: string | null;
  error: string | null;
  reasoningSteps: import("#/types").ReasoningStep[];
}

const IDLE_STATUSES: Record<PanelAgentKey, AgentPanelStatus> = {
  research: "idle",
  strategy: "idle",
  finance: "idle",
  operations: "idle",
  legal: "idle",
  coordinator: "idle",
};

export function useAgentRunSocket(runId: string | null) {
  const { getToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    getToken().then(setToken).catch(console.error);
  }, [getToken]);
  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<RunProgressState>({
    runStatus: null,
    agentStatuses: IDLE_STATUSES,
    reportId: null,
    error: null,
    reasoningSteps: [],
  });

  useEffect(() => {
    if (!runId || !token) return;

    setState({ runStatus: "pending", agentStatuses: IDLE_STATUSES, reportId: null, error: null, reasoningSteps: [] });

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(
      `${protocol}://${window.location.host}/ws/agent-runs/${runId}?token=${token}`
    );
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data: SocketEvent = JSON.parse(event.data);
      if (data.type === "run_status") {
        setState((s) => ({ ...s, runStatus: data.status }));
      } else if (data.type === "agent_status") {
        setState((s) => ({
          ...s,
          agentStatuses: { ...s.agentStatuses, [data.agent_key]: data.status },
        }));
      } else if (data.type === "reasoning_step") {
        setState((s) => ({
          ...s,
          reasoningSteps: [...s.reasoningSteps, data],
        }));
      } else if (data.type === "completed") {
        setState((s) => ({ ...s, runStatus: "completed", reportId: data.report_id }));
      } else if (data.type === "failed" || data.type === "error") {
        setState((s) => ({ ...s, runStatus: "failed", error: data.message }));
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, token]);

  return state;
}
