import { useEffect, useRef, useState } from "react";
import { RelayState } from "./types";
import { RELAY_WS_URL } from "./config";
import { mergeRelayState } from "./utils/matchPhase";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface UseGameStateResult {
  status: ConnectionStatus;
  state: RelayState | null;
  latencyMs: number | null;
}

const RECONNECT_DELAY_MS = 2000;

export function useGameState(wsUrl: string = RELAY_WS_URL): UseGameStateResult {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [state, setState] = useState<RelayState | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUnmounted = useRef(false);
  const lastMessageAt = useRef<number | null>(null);

  useEffect(() => {
    isUnmounted.current = false;
    setState(null);
    setLatencyMs(null);
    connect();

    return () => {
      isUnmounted.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      socketRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsUrl]);

  function connect() {
    setStatus("connecting");
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      if (isUnmounted.current) return;
      setStatus("connected");
    };

    socket.onmessage = (event) => {
      if (isUnmounted.current) return;
      const now = Date.now();
      try {
        const parsed = JSON.parse(event.data) as RelayState;
        setState((prev) => mergeRelayState(prev, parsed, now));
        // Approximate freshness from relay timestamp (not true RTT).
        if (parsed.updatedAt) {
          setLatencyMs(Math.max(1, Math.min(999, now - parsed.updatedAt)));
        } else if (lastMessageAt.current != null) {
          setLatencyMs(Math.max(1, Math.min(999, now - lastMessageAt.current)));
        }
        lastMessageAt.current = now;
      } catch {
        // Ignore malformed frames.
      }
    };

    socket.onerror = () => {
      socket.close();
    };

    socket.onclose = () => {
      if (isUnmounted.current) return;
      setStatus("disconnected");
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };
  }

  return { status, state, latencyMs };
}
