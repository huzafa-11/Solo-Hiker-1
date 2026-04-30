"use client";

import { SessionProvider } from "next-auth/react";
import { WebSocketProvider } from "@/context/WebsocketContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <WebSocketProvider>
        {children}
      </WebSocketProvider>
    </SessionProvider>
  );
}
