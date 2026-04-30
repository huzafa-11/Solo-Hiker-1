"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

interface WSContextType {
  wsRef: React.MutableRefObject<WebSocket | null>;
  onlineUsers: Set<string>;
  sendMessage: (data: object) => void;
}

const WSContext = createContext<WSContextType>({
  wsRef: { current: null },
  onlineUsers: new Set(),
  sendMessage: () => {},
});

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const wsRef = useRef<WebSocket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const userId = (session?.user as any)?.id;

  useEffect(() => {
    if (!userId) return;

    const ws = new WebSocket(`ws://localhost:8000?userId=${userId}`);
    wsRef.current = ws;

    ws.onopen = () => console.log("✅ WebSocket Connected");

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "presence") {
          setOnlineUsers((prev) => {
            const next = new Set(prev);
            if (data.status === "online") next.add(data.userId);
            else next.delete(data.userId);
            return next;
          });
        }
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };

    ws.onclose = () => console.log("❌ WS Disconnected");

    return () => ws.close();
  }, [userId]);

  const sendMessage = (data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  };

  return (
    <WSContext.Provider value={{ wsRef, onlineUsers, sendMessage }}>
      {children}
    </WSContext.Provider>
  );
}

export const useWebSocket = () => useContext(WSContext);