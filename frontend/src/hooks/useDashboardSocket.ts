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
    
    // Netlify cannot proxy WebSockets via _redirects. 
    // We must connect directly to the Render backend in production.
    const host = window.location.hostname === "localhost" 
      ? window.location.host 
      : "crewmind-bjlj.onrender.com";
      
    const ws = new WebSocket(`${protocol}://${host}/ws/dashboard?token=${token}`);

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
