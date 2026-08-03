import { useEffect, useState, useRef, useCallback } from "react";
import { useAuthStore } from "#/stores/authStore";
import { getWsUrl } from "#/api/client";

export function useWarRoomSocket(sessionId: string | null) {
  const token = useAuthStore((s) => s.token);
  const [messages, setMessages] = useState<any[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!token || !sessionId) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      return;
    }

    const ws = new WebSocket(getWsUrl(`/ws/warroom/${sessionId}`, token));
    socketRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setMessages((prev) => [...prev, message]);
      } catch (err) {
        console.error("Failed to parse websocket message", err);
      }
    };

    return () => {
      ws.close();
      if (socketRef.current === ws) {
        socketRef.current = null;
      }
    };
  }, [token, sessionId]);

  const sendMessage = useCallback((payload: any) => {
    const socket = socketRef.current;
    if (!socket) return;
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    } else if (socket.readyState === WebSocket.CONNECTING) {
      // Queue the message to be sent when the connection opens
      const listener = () => {
        socket.send(JSON.stringify(payload));
        socket.removeEventListener('open', listener);
      };
      socket.addEventListener('open', listener);
    }
  }, []);

  return { messages, sendMessage, isConnected: socketRef.current?.readyState === WebSocket.OPEN };
}
