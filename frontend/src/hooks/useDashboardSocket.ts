import { useEffect } from "react";
import { useAuthStore } from "#/stores/authStore";
import { useInsightsStore } from "#/stores/insightsStore";
import { WsMessage } from "#/types";

export function useDashboardSocket() {
  const token = useAuthStore((s) => s.token);
  const setMetrics = useInsightsStore((s) => s.setMetrics);

  useEffect(() => {
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${window.location.host}/ws/dashboard?token=${token}`);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WsMessage;
        
        if (message.type === "dashboard_metrics") {
          setMetrics(message.metrics);
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
