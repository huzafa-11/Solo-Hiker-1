"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MdSearch, MdTune, MdAdd } from "react-icons/md";
import { useWebSocket } from "@/context/WebsocketContext";
import { Conversation } from "../page";

interface Props {
  selectedId: string | null;
  onSelect: (conv: Conversation) => void;
}

export function ConversationList({ selectedId, onSelect }: Props) {
  const { data: session } = useSession();
  const { onlineUsers, wsRef } = useWebSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);

  // ── Fetch conversations ──
  useEffect(() => {
    if (!session?.user) return;
    fetchConversations();
  }, [session]);

  // ── Jab conversation select ho → 1 sec baad refresh ──
  useEffect(() => {
    if (!selectedId) return;
    const timer = setTimeout(() => {
      fetchConversations();
    }, 1000);
    return () => clearTimeout(timer);
  }, [selectedId]);

  // ── Real-time last message update ──
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws) return;

    const handleMessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "chat") {
          // Conversation list mein last message update karo
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === data.message.conversationId
                ? {
                    ...conv,
                    lastMessage: data.message.text,
                    lastMessageTime: data.message.createdAt,
                    // Agar yeh conversation selected nahi hai toh unread count badao
                    unreadCount:
                      conv.id !== selectedId
                        ? (conv.unreadCount ?? 0) + 1
                        : 0,
                  }
                : conv
            )
          );
        }
      } catch (err) {
        console.error("WS error:", err);
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [wsRef.current, selectedId]);

  const fetchConversations = async () => {
    try {
      // ✅ Fix — /api/chat/ (singular)
      const res = await fetch("/api/chats/conversations");
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = conversations.filter((conv) => {
    const matchSearch = conv.otherUserName
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchTab =
      activeTab === "all" ? true : (conv.unreadCount ?? 0) > 0;
    return matchSearch && matchTab;
  });

  const unreadCount = conversations.filter(
    (c) => (c.unreadCount ?? 0) > 0
  ).length;

  const getInitial = (name: string) => name?.[0]?.toUpperCase() ?? "U";

  const getAvatarColor = (name: string) => {
    const colors = [
      "#16a34a", "#f97316", "#3b82f6",
      "#8b5cf6", "#ec4899", "#14b8a6",
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fff" }}>

      {/* ── Header ── */}
      <div style={{
        padding: "16px 16px 0",
        borderBottom: "1px solid #e5e7eb",
        background: "#fff",
      }}>
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: 12,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>
            Messages
          </h2>
          <button style={{
            width: 32, height: 32, borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#6b7280",
          }}>
            <MdTune size={16} />
          </button>
        </div>

        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: 10, padding: "8px 12px", marginBottom: 12,
        }}>
          <MdSearch size={16} color="#9ca3af" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages or users..."
            style={{
              border: "none", background: "transparent",
              outline: "none", fontSize: 13,
              color: "#111827", flex: 1,
            }}
          />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4 }}>
          {(["all", "unread"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 14px",
                border: "none", background: "transparent",
                fontSize: 13, fontWeight: activeTab === tab ? 700 : 500,
                color: activeTab === tab ? "#15803d" : "#9ca3af",
                borderBottom: activeTab === tab
                  ? "2px solid #16a34a"
                  : "2px solid transparent",
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {tab === "all" ? "All" : "Unread"}
              {tab === "unread" && unreadCount > 0 && (
                <span style={{
                  background: "#16a34a", color: "#fff",
                  fontSize: 10, borderRadius: 10,
                  padding: "1px 6px", fontWeight: 700,
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── List ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px",
              borderBottom: "1px solid #e5e7eb",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "#e5e7eb", flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{
                  height: 12, width: "60%", borderRadius: 6,
                  background: "#e5e7eb", marginBottom: 8,
                }} />
                <div style={{
                  height: 10, width: "80%", borderRadius: 6,
                  background: "#e5e7eb",
                }} />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div style={{
            padding: 32, textAlign: "center",
            color: "#9ca3af", fontSize: 13,
          }}>
            No conversations found
          </div>
        ) : (
          filtered.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px",
                borderBottom: "1px solid #f3f4f6",
                background: selectedId === conv.id ? "#f0fdf4" : "transparent",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                if (selectedId !== conv.id)
                  e.currentTarget.style.background = "#f9fafb";
              }}
              onMouseLeave={(e) => {
                if (selectedId !== conv.id)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              {/* Avatar */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: "50%",
                  background: getAvatarColor(conv.otherUserName),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: 17,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}>
                  {getInitial(conv.otherUserName)}
                </div>
                {onlineUsers.has(conv.otherUserId) && (
                  <div style={{
                    position: "absolute", bottom: 1, right: 1,
                    width: 12, height: 12,
                    background: "#22c55e", borderRadius: "50%",
                    border: "2px solid #fff",
                  }} />
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14, fontWeight: 600,
                  color: "#111827", marginBottom: 2,
                }}>
                  {conv.otherUserName}
                </div>
                <div style={{
                  fontSize: 12,
                  color: (conv.unreadCount ?? 0) > 0 ? "#111827" : "#6b7280",
                  fontWeight: (conv.unreadCount ?? 0) > 0 ? 600 : 400,
                  whiteSpace: "nowrap", overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {conv.lastMessage || "No messages yet"}
                </div>
              </div>

              {/* Meta */}
              <div style={{
                display: "flex", flexDirection: "column",
                alignItems: "flex-end", gap: 4, flexShrink: 0,
              }}>
                <div style={{
                  fontSize: 11,
                  color: (conv.unreadCount ?? 0) > 0 ? "#16a34a" : "#9ca3af",
                  fontWeight: (conv.unreadCount ?? 0) > 0 ? 600 : 400,
                }}>
                  {formatTime(conv.lastMessageTime)}
                </div>
                {(conv.unreadCount ?? 0) > 0 && (
                  <div style={{
                    background: "#16a34a",
                    color: "#fff", fontSize: 10,
                    borderRadius: 10, padding: "2px 7px",
                    fontWeight: 700, minWidth: 20,
                    textAlign: "center",
                  }}>
                    {conv.unreadCount}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── New Message Button ── */}
      <div style={{ padding: 16, borderTop: "1px solid #e5e7eb" }}>
        <button style={{
          width: "100%", padding: "11px 0",
          border: "none",
          borderRadius: 12,
          background: "#16a34a",
          color: "#fff", fontSize: 13,
          fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center",
          justifyContent: "center", gap: 6,
          boxShadow: "0 2px 8px rgba(22,163,74,0.3)",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "#15803d"}
        onMouseLeave={(e) => e.currentTarget.style.background = "#16a34a"}
        >
          <MdAdd size={16} /> New Message
        </button>
      </div>
    </div>
  );
}