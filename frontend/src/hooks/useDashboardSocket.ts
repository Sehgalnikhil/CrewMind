import { useEffect, useRef } from "react";
import { useAuthStore } from "#/stores/authStore";
import { useInsightsStore } from "#/stores/insightsStore";
import { WsMessage } from "#/types";
import { getWsUrl } from "#/api/client";

export function useDashboardSocket() {
  const token = useAuthStore((s) => s.token);
  const setMetrics = useInsightsStore((s) => s.setMetrics);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket(getWsUrl("/ws/dashboard", token));
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WsMessage;
        
        if (message.type === "dashboard_metrics") {
          setMetrics(message.metrics);
        } else if (message.type === "document_status") {
          window.dispatchEvent(new CustomEvent("document_status", { detail: message }));
        }
      } catch (err) {
        console.error("Failed to parse websocket message", err);
      }
    };

    return () => {
      ws.close();
    };
  }, [token, setMetrics]);
}
