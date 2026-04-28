"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { MdArrowBack, MdSend, MdSearch, MdMoreVert } from "react-icons/md";
import { Conversation } from "../page";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

interface Props {
  conversation: Conversation;
  onBack: () => void;
}

export function ChatWindow({ conversation, onBack }: Props) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userId = (session?.user as any)?.id;

  // ── Fetch old messages ──
  useEffect(() => {
    if (!conversation.id) return;
    fetchMessages();
  }, [conversation.id]);

  // ── WebSocket connect ──
  useEffect(() => {
    if (!userId) return;

    const ws = new WebSocket(
      `ws://localhost:8080?userId=${userId}`
    );
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
    };

    ws.onmessage = (e) => {
      try {
        // Check if data is actually JSON before parsing
        if (typeof e.data !== "string" || !e.data.trim()) {
          console.warn("⚠️ Invalid message received:", e.data);
          return;
        }

        // Check if it looks like HTML (error page)
        if (e.data.trim().startsWith("<")) {
          console.error(" Backend returned HTML instead of JSON. Server might be down or errored.");
          console.error("Response:", e.data.substring(0, 200));
          return;
        }

        const data = JSON.parse(e.data);

        if (data.type === "chat") {
          // Sirf is conversation ke messages add karo
          if (data.message.conversationId === conversation.id) {
            setMessages((prev) => {
              // Duplicate check
              const exists = prev.find((m) => m.id === data.message.id);
              if (exists) return prev;
              return [...prev, data.message];
            });
            scrollToBottom();

            // Read receipt bhejo agar receiver ho
            if (data.message.senderId !== userId) {
              ws.send(JSON.stringify({
                type: "read",
                messageId: data.message.id,
                readerId: userId,
                senderId: data.message.senderId,
              }));
            }
          }
        }

        if (data.type === "read") {
          // Double tick update karo
          setMessages((prev) =>
            prev.map((m) =>
              m.id === data.messageId
                ? { ...m, isRead: true, readAt: data.readAt }
                : m
            )
          );
        }
      } catch (error) {
        console.error(" Failed to parse WebSocket message:", error);
        if (e.data) {
          console.error("Raw data received:", e.data.substring(0, 500));
        }
      }
    };

    ws.onclose = () => console.log(" WebSocket disconnected");

    return () => {
      ws.close();
    };
  }, [userId, conversation.id]);

  // ── Scroll to bottom ──
  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ── Fetch messages from API ──
  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/chat/messages?conversationId=${conversation.id}`
      );
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Send message ──
  const sendMessage = () => {
    if (!text.trim() || !wsRef.current || !userId) return;

    wsRef.current.send(
      JSON.stringify({
        type: "chat",
        senderId: userId,
        senderName: session?.user?.name ?? "User",
        receiverId: conversation.otherUserId,
        conversationId: conversation.id,
        text: text.trim(),
      })
    );

    setText("");
  };

  // ── Enter key send ──
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Date divider logic ──
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    return date.toLocaleDateString([], {
      month: "long", day: "numeric", year: "numeric",
    });
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit", minute: "2-digit",
    });

  // ── Group messages by date ──
  const groupedMessages = messages.reduce<{ date: string; msgs: Message[] }[]>((groups, msg) => {
    const date = formatDate(msg.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.date === date) {
      last.msgs.push(msg);
    } else {
      groups.push({ date, msgs: [msg] });
    }
    return groups;
  }, []);

  const getAvatarColor = (name: string) => {
    const colors = [
      "#16a34a", "#f97316", "#3b82f6",
      "#8b5cf6", "#ec4899", "#14b8a6",
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderBottom: "1px solid var(--sidebar-border)",
        background: "#fff", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Back button — mobile only */}
          <button
            onClick={onBack}
            className="hide-desktop"
            style={{
              background: "transparent", border: "none",
              cursor: "pointer", color: "var(--gray-500)",
              display: "flex", alignItems: "center",
            }}
          >
            <MdArrowBack size={20} />
          </button>

          {/* Avatar */}
          <div style={{ position: "relative" }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: getAvatarColor(conversation.otherUserName),
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 16,
            }}>
              {conversation.otherUserName[0]?.toUpperCase()}
            </div>
            {conversation.isOnline && (
              <div style={{
                position: "absolute", bottom: 1, right: 1,
                width: 11, height: 11, background: "#22c55e",
                borderRadius: "50%", border: "2px solid #fff",
              }} />
            )}
          </div>

          {/* Name + status */}
          <div>
            <div style={{
              fontSize: 14, fontWeight: 700, color: "#111827",
            }}>
              {conversation.otherUserName}
            </div>
            <div style={{ fontSize: 11, color: "#22c55e" }}>
              {conversation.isOnline ? "Online" : "Offline"}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          {[MdSearch, MdMoreVert].map((Icon, i) => (
            <button key={i} style={{
              width: 34, height: 34, borderRadius: 8,
              border: "1px solid var(--sidebar-border)",
              background: "transparent", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--gray-500)",
            }}>
              <Icon size={18} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "16px", display: "flex",
        flexDirection: "column", gap: 16,
        background: "var(--page-bg)",
      }}>
        {loading ? (
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "center", height: "100%",
            color: "var(--gray-400)", fontSize: 13,
          }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            height: "100%", gap: 8,
            color: "var(--gray-400)",
          }}>
            <div style={{ fontSize: 32 }}>👋</div>
            <p style={{ fontSize: 13 }}>
              Say hi to {conversation.otherUserName}!
            </p>
          </div>
        ) : (
          groupedMessages.map(({ date, msgs }) => (
            <div key={date} style={{ display: "flex", flexDirection: "column", gap: 8 }}>

              {/* Date divider */}
              <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "center",
              }}>
                <span style={{
                  fontSize: 11, color: "var(--gray-400)",
                  background: "#e5e7eb",
                  padding: "3px 12px", borderRadius: 10,
                }}>
                  {date}
                </span>
              </div>

              {/* Messages */}
              {msgs.map((msg) => {
                const isSent = msg.senderId === userId;
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      justifyContent: isSent ? "flex-end" : "flex-start",
                    }}
                  >
                    <div style={{ maxWidth: "65%" }}>
                      {/* Bubble */}
                      <div style={{
                        padding: "10px 14px",
                        borderRadius: isSent
                          ? "16px 16px 4px 16px"
                          : "16px 16px 16px 4px",
                        background: isSent ? "var(--green-600)" : "#fff",
                        color: isSent ? "#fff" : "#111827",
                        fontSize: 13, lineHeight: 1.5,
                        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                      }}>
                        {msg.text}
                      </div>

                      {/* Time + read receipt */}
                      <div style={{
                        display: "flex", alignItems: "center",
                        gap: 4, marginTop: 3,
                        justifyContent: isSent ? "flex-end" : "flex-start",
                      }}>
                        <span style={{
                          fontSize: 10, color: "var(--gray-400)",
                        }}>
                          {formatTime(msg.createdAt)}
                        </span>
                        {isSent && (
                          <span style={{
                            fontSize: 11,
                            color: msg.isRead ? "#22c55e" : "var(--gray-400)",
                          }}>
                            ✓✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              padding: "8px 14px", borderRadius: "16px 16px 16px 4px",
              background: "#fff", fontSize: 13, color: "var(--gray-400)",
            }}>
              typing...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input Bar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "12px 16px",
        borderTop: "1px solid var(--sidebar-border)",
        background: "#fff", flexShrink: 0,
      }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          style={{
            flex: 1, padding: "10px 16px",
            border: "1px solid var(--sidebar-border)",
            borderRadius: 24, fontSize: 13,
            outline: "none", background: "var(--page-bg)",
            color: "#111827",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim()}
          style={{
            width: 40, height: 40, borderRadius: "50%",
            background: text.trim() ? "var(--green-600)" : "var(--sidebar-border)",
            border: "none", cursor: text.trim() ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s", flexShrink: 0,
          }}
        >
          <MdSend size={18} color="#fff" />
        </button>
      </div>
    </div>
  );
}