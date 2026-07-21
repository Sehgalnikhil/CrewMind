import { useCallback, useEffect, useRef, useState } from "react";

import { useAuthStore } from "#/stores/authStore";
import type { AgentKey } from "#/types";

type SocketEvent =
  | { type: "start"; agent_key: AgentKey }
  | { type: "delta"; content: string }
  | { type: "done"; message_id: string }
  | { type: "error"; message: string };

export interface StreamingState {
  isStreaming: boolean;
  streamedText: string;
  error: string | null;
}

export function useAgentChatSocket(
  conversationId: string | null,
  onComplete: (fullText: string) => void
) {
  const token = useAuthStore((s) => s.token);
  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    streamedText: "",
    error: null,
  });
  const bufferRef = useRef("");

  useEffect(() => {
    if (!conversationId || !token) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${window.location.host}/ws/chat/${conversationId}?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data: SocketEvent = JSON.parse(event.data);
      if (data.type === "start") {
        bufferRef.current = "";
        setState({ isStreaming: true, streamedText: "", error: null });
      } else if (data.type === "delta") {
        bufferRef.current += data.content;
        setState((s) => ({ ...s, streamedText: bufferRef.current }));
      } else if (data.type === "done") {
        setState({ isStreaming: false, streamedText: "", error: null });
        onComplete(bufferRef.current);
      } else if (data.type === "error") {
        setState({ isStreaming: false, streamedText: "", error: data.message });
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, token]);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ content }));
    }
  }, []);

  return { ...state, sendMessage };
}
