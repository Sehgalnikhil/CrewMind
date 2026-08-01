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
    
    if (runId === "mock-run-123") {
      let timeoutId: any;
      let isCancelled = false;
      const simulateEvents = async () => {
        const events: { delay: number; event: SocketEvent }[] = [
          { delay: 500, event: { type: "run_status", status: "running" } },
          { delay: 1000, event: { type: "agent_status", agent_key: "research", status: "running" } },
          { delay: 2000, event: { type: "reasoning_step", agent: "research", monologue: ["Scanning local market data...", "Identifying key competitor moves..."], critic: null, confidence: 0.9 } },
          { delay: 3500, event: { type: "agent_status", agent_key: "research", status: "done" } },
          { delay: 4000, event: { type: "agent_status", agent_key: "strategy", status: "running" } },
          { delay: 5000, event: { type: "reasoning_step", agent: "strategy", monologue: ["Analyzing competitor pricing strategy", "Drafting counter-measures"], critic: "Needs more focus on retention", confidence: 0.85 } },
          { delay: 6500, event: { type: "agent_status", agent_key: "strategy", status: "done" } },
          { delay: 7000, event: { type: "agent_status", agent_key: "finance", status: "running" } },
          { delay: 8000, event: { type: "reasoning_step", agent: "finance", monologue: ["Modeling revenue impact of price cuts", "Evaluating CAC ceilings for EU expansion"], critic: null, confidence: 0.95 } },
          { delay: 9500, event: { type: "agent_status", agent_key: "finance", status: "done" } },
          { delay: 10000, event: { type: "completed", report_id: "mock-report-123" } },
        ];

        let currentDelay = 0;
        for (const { delay, event } of events) {
          if (isCancelled) break;
          const waitTime = delay - currentDelay;
          currentDelay = delay;
          await new Promise((r) => { timeoutId = setTimeout(r, waitTime); });
          if (isCancelled) break;
          
          if (event.type === "run_status") setState((s) => ({ ...s, runStatus: event.status }));
          else if (event.type === "agent_status") setState((s) => ({ ...s, agentStatuses: { ...s.agentStatuses, [event.agent_key]: event.status } }));
          else if (event.type === "reasoning_step") setState((s) => ({ ...s, reasoningSteps: [...s.reasoningSteps, event] as any }));
          else if (event.type === "completed") setState((s) => ({ ...s, runStatus: "completed", reportId: event.report_id }));
        }
      };
      simulateEvents();
      return () => {
        isCancelled = true;
        clearTimeout(timeoutId);
      };
    }

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
