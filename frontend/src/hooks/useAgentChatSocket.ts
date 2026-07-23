import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@clerk/react";
import type { CrewAgentKey } from "#/types";

type SocketEvent =
  | { type: "start"; agent_key: CrewAgentKey }
  | { type: "delta"; content: string }
  | { type: "done"; message_id: string; agent_key?: CrewAgentKey }
  | { type: "error"; message: string };

export interface StreamingState {
  isStreaming: boolean;
  streamedText: string;
  streamingAgentKey: CrewAgentKey | null;
  error: string | null;
}

export function useAgentChatSocket(
  conversationId: string | null,
  onComplete: (fullText: string) => void
) {
  const { getToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {
    getToken().then(setToken).catch(console.error);
  }, [getToken]);

  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    streamedText: "",
    streamingAgentKey: null,
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
        setState({ isStreaming: true, streamedText: "", streamingAgentKey: data.agent_key, error: null });
      } else if (data.type === "delta") {
        bufferRef.current += data.content;
        setState((s) => ({ ...s, streamedText: bufferRef.current }));
      } else if (data.type === "done") {
        setState({ isStreaming: false, streamedText: "", streamingAgentKey: null, error: null });
        onComplete(bufferRef.current);
      } else if (data.type === "error") {
        setState({ isStreaming: false, streamedText: "", streamingAgentKey: null, error: data.message });
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
