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
    
    // Netlify cannot proxy WebSockets via _redirects. 
    // We must connect directly to the Render backend in production.
    const host = window.location.hostname === "localhost" 
      ? window.location.host 
      : "crewmind-bjlj.onrender.com";
      
    const ws = new WebSocket(`${protocol}://${host}/ws/warroom/${sessionId}?token=${token}`);

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
