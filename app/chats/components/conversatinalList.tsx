"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MdSearch, MdTune, MdAdd } from "react-icons/md";
import { Conversation } from "../page";

interface Props {
  selectedId: string | null;
  onSelect: (conv: Conversation) => void;
}

export function ConversationList({ selectedId, onSelect }: Props) {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);

  // Fetch conversations
  useEffect(() => {
    if (!session?.user) return;
    fetchConversations();
  }, [session]);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      const data = await res.json();
      setConversations(data);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
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
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
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
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* ── Header ── */}
      <div style={{
        padding: "16px 16px 0",
        borderBottom: "1px solid var(--sidebar-border)",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>
            Messages
          </h2>
          <button style={{
            width: 32, height: 32,
            borderRadius: 8,
            border: "1px solid var(--sidebar-border)",
            background: "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "var(--gray-500)",
          }}>
            <MdTune size={16} />
          </button>
        </div>

        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "var(--page-bg)",
          border: "1px solid var(--sidebar-border)",
          borderRadius: 10, padding: "8px 12px",
          marginBottom: 12,
        }}>
          <MdSearch size={16} color="var(--gray-400)" />
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
                color: activeTab === tab ? "var(--green-700)" : "var(--gray-400)",
                borderBottom: activeTab === tab
                  ? "2px solid var(--green-600)"
                  : "2px solid transparent",
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {tab === "all" ? "All" : "Unread"}
              {tab === "unread" && unreadCount > 0 && (
                <span style={{
                  background: "var(--green-600)",
                  color: "#fff", fontSize: 10,
                  borderRadius: 10, padding: "1px 6px",
                  fontWeight: 700,
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
          // Loading skeletons
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px",
              borderBottom: "1px solid var(--sidebar-border)",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "var(--sidebar-border)", flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{
                  height: 12, width: "60%", borderRadius: 6,
                  background: "var(--sidebar-border)", marginBottom: 8,
                }} />
                <div style={{
                  height: 10, width: "80%", borderRadius: 6,
                  background: "var(--sidebar-border)",
                }} />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div style={{
            padding: 32, textAlign: "center",
            color: "var(--gray-400)", fontSize: 13,
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
                borderBottom: "1px solid var(--sidebar-border)",
                background: selectedId === conv.id ? "#f0fdf4" : "transparent",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                if (selectedId !== conv.id)
                  e.currentTarget.style.background = "var(--page-bg)";
              }}
              onMouseLeave={(e) => {
                if (selectedId !== conv.id)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              {/* Avatar */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: getAvatarColor(conv.otherUserName),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: 16,
                }}>
                  {getInitial(conv.otherUserName)}
                </div>
                {conv.isOnline && (
                  <div style={{
                    position: "absolute", bottom: 1, right: 1,
                    width: 11, height: 11,
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
                  fontSize: 12, color: "var(--gray-500)",
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
                <div style={{ fontSize: 11, color: "var(--gray-400)" }}>
                  {formatTime(conv.lastMessageTime)}
                </div>
                {(conv.unreadCount ?? 0) > 0 && (
                  <div style={{
                    background: "var(--green-600)",
                    color: "#fff", fontSize: 10,
                    borderRadius: 10, padding: "1px 7px",
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
      <div style={{ padding: 16, borderTop: "1px solid var(--sidebar-border)" }}>
        <button style={{
          width: "100%", padding: "10px 0",
          border: "1px dashed var(--green-600)",
          borderRadius: 10, background: "transparent",
          color: "var(--green-700)", fontSize: 13,
          fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center",
          justifyContent: "center", gap: 6,
        }}>
          <MdAdd size={16} /> New Message
        </button>
      </div>
    </div>
  );
}