import { useEffect, useState } from "react";
import { useAuthStore } from "#/stores/authStore";

export function useWarRoomSocket(sessionId: string | null) {
  const token = useAuthStore((s) => s.token);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!token || !sessionId) {
      setSocket(null);
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    // For local dev, api base URL might be on port 8000, but in Vite we proxy.
    // In our api/client.ts we don't know the exact domain, but if we use window.location.host it works in prod
    // However, for dev it might be localhost:5173. Let's just use the standard way:
    const ws = new WebSocket(`${protocol}://${window.location.host}/ws/warroom/${sessionId}?token=${token}`);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setMessages((prev) => [...prev, message]);
      } catch (err) {
        console.error("Failed to parse websocket message", err);
      }
    };

    setSocket(ws);

    return () => {
      ws.close();
      setSocket(null);
    };
  }, [token, sessionId]);

  const sendMessage = (payload: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  };

  return { messages, sendMessage };
}
