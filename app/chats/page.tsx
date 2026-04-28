"use client";

import { useState } from "react";
import { DashboardLayout } from "@/layout/dashboardLayout";
import { ConversationList } from "@/chats/components/conversatinalList";
import { ChatWindow } from "@/chats/components/chatWindow"

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: string;
  otherUserName: string;
  otherUserId: string;
  unreadCount?: number;
  isOnline?: boolean;
}

export default function ChatsPage() {
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);

  return (
    <DashboardLayout title="Chats">
      <div className="chats-container">
        
       { /* Left — Conversation List */}
        <div className={`conv-panel ${selectedConv ? "hide-on-mobile" : ""}`}>
          <ConversationList
            selectedId={selectedConv?.id ?? null}
            onSelect={(conv) => setSelectedConv(conv)}
          />
        </div>

       {/*  Right — Chat Window  */}
        <div className={`chat-panel ${!selectedConv ? "hide-on-mobile" : ""}`}>
          {selectedConv ? (
            <ChatWindow
              conversation={selectedConv}
              onBack={() => setSelectedConv(null)}
            />
          ) : (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>

      </div>
     <style>{`
        .chats-container {
          display: flex;
          height: calc(100vh - 64px);
          overflow: hidden;
        }
        .conv-panel {
          width: 380px;
          flex-shrink: 0;
          border-right: 1px solid var(--sidebar-border);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .chat-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }
        .empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: var(--gray-400);
        }
        .empty-icon {
          font-size: 48px;
        }
        .empty-state p {
          font-size: 14px;
          font-weight: 500;
        }
        @media (max-width: 768px) {
          .conv-panel { width: 100%; }
          .hide-on-mobile { display: none; }
        }
      `}</style>
    </DashboardLayout>
  );
}