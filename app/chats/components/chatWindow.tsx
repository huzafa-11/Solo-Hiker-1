"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { MdArrowBack, MdSend, MdSearch, MdMoreVert } from "react-icons/md";
import { useWebSocket } from "@/context/WebsocketContext";
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const { wsRef, onlineUsers, sendMessage: wsSend } = useWebSocket();
  const userId = (session?.user as any)?.id;
  const isOtherOnline: boolean = onlineUsers.has(conversation.otherUserId);

  // ── Fetch messages ──
  useEffect(() => {
    if (!conversation.id) return;
    fetchMessages();
  }, [conversation.id]);

  // ── WebSocket messages ──
  useEffect(() => {
  const ws = wsRef.current;
  if (!ws) return;

  const handleMessage = (e: MessageEvent) => {

      try {
        const data = JSON.parse(e.data);

        if (data.type === "chat") {
          if (data.message.conversationId === conversation.id) {
            setMessages((prev) => {
              const exists = prev.find((m) => m.id === data.message.id);
              if (exists) return prev;
              return [...prev, data.message];
            });
            scrollToBottom();
            if (data.message.senderId !== userId) {
              wsSend({
                type: "read",
                messageId: data.message.id,
                readerId: userId,
                senderId: data.message.senderId,
              });
            }
          }
        }

        if (data.type === "read") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === data.messageId ? { ...m, isRead: true } : m
            )
          );
        }

        if (data.type === "typing") {
          if (data.senderId === conversation.otherUserId) {
            setIsTyping(data.isTyping);
            if (data.isTyping) {
              setTimeout(() => setIsTyping(false), 3000);
            }
          }
        }
      } catch (err) {
        console.error("WS error:", err);
      }
    };

    ws.addEventListener("message", handleMessage);
  return () => ws.removeEventListener("message", handleMessage);
}, [wsRef.current, conversation.id, userId]);


  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
  setLoading(true);
  try {
    const res = await fetch(
      `/api/chats/messages?conversationId=${conversation.id}`
    );
    const data = await res.json();
    setMessages(data);

    // ← Yeh add karo — saare unread mark karo
    await fetch("/api/chats/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: conversation.id,
        userId,
      }),
    });

  } catch (err) {
    console.error("Failed to fetch messages:", err);
  } finally {
    setLoading(false);
  }
};
  const sendMessage = () => {
    if (!text.trim() || !userId) return;
    wsSend({
      type: "chat",
      senderId: userId,
      senderName: session?.user?.name ?? "User",
      receiverId: conversation.otherUserId,
      conversationId: conversation.id,
      text: text.trim(),
    });
    setText("");
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    wsSend({
      type: "typing",
      senderId: userId,
      receiverId: conversation.otherUserId,
      isTyping: true,
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      wsSend({
        type: "typing",
        senderId: userId,
        receiverId: conversation.otherUserId,
        isTyping: false,
      });
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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

  const groupedMessages = messages.reduce<{ date: string; msgs: Message[] }[]>(
    (groups, msg) => {
      const date = formatDate(msg.createdAt);
      const last = groups[groups.length - 1];
      if (last && last.date === date) {
        last.msgs.push(msg);
      } else {
        groups.push({ date, msgs: [msg] });
      }
      return groups;
    },
    []
  );

  const getAvatarColor = (name: string) => {
    const colors = ["#16a34a", "#f97316", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#f0f2f5" }}>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 16px",
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        flexShrink: 0,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={onBack}
            className="hide-desktop"
            style={{
              background: "transparent", border: "none",
              cursor: "pointer", color: "#6b7280",
              display: "flex", alignItems: "center",
            }}
          >
            <MdArrowBack size={20} />
          </button>

          <div style={{ position: "relative" }}>
            <div style={{
              width: 42, height: 42, borderRadius: "50%",
              background: getAvatarColor(conversation.otherUserName),
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 16,
              boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
            }}>
              {conversation.otherUserName[0]?.toUpperCase()}
            </div>
            {isOtherOnline && (
              <div style={{
                position: "absolute", bottom: 1, right: 1,
                width: 11, height: 11, background: "#22c55e",
                borderRadius: "50%", border: "2px solid #fff",
              }} />
            )}
          </div>

          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
              {conversation.otherUserName}
            </div>
            <div style={{
              fontSize: 11, fontWeight: 500,
              color: isOtherOnline ? "#22c55e" : "#9ca3af",
            }}>
              {isTyping ? "typing..." : isOtherOnline ? "Online" : "Offline"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {[MdSearch, MdMoreVert].map((Icon, i) => (
            <button key={i} style={{
              width: 36, height: 36, borderRadius: "50%",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#6b7280",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f3f4f6"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <Icon size={20} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "16px 12px",
        display: "flex", flexDirection: "column", gap: 2,
      }}>
        {loading ? (
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "center", height: "100%",
            color: "#9ca3af", fontSize: 13,
          }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            height: "100%", gap: 8, color: "#9ca3af",
          }}>
            <div style={{ fontSize: 40 }}>👋</div>
            <p style={{ fontSize: 13, fontWeight: 500 }}>
              Say hi to {conversation.otherUserName}!
            </p>
          </div>
        ) : (
          groupedMessages.map(({ date, msgs }) => (
            <div key={date} style={{ display: "flex", flexDirection: "column", gap: 2 }}>

              {/* Date divider */}
              <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "center", margin: "12px 0 8px",
              }}>
                <span style={{
                  fontSize: 11, color: "#6b7280",
                  background: "#e5e7eb",
                  padding: "3px 14px", borderRadius: 12,
                  fontWeight: 500,
                }}>
                  {date}
                </span>
              </div>

              {msgs.map((msg) => {
                const isSent = msg.senderId === userId;
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      justifyContent: isSent ? "flex-end" : "flex-start",
                      marginBottom: 2,
                    }}
                  >
                    <div style={{ maxWidth: "65%" }}>
                      <div style={{
                        padding: "8px 12px",
                        borderRadius: isSent
                          ? "18px 18px 4px 18px"
                          : "18px 18px 18px 4px",
                        background: isSent ? "#16a34a" : "#fff",
                        color: isSent ? "#fff" : "#111827",
                        fontSize: 13.5,
                        lineHeight: 1.5,
                        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                      }}>
                        {msg.text}
                      </div>

                      <div style={{
                        display: "flex", alignItems: "center",
                        gap: 3, marginTop: 2,
                        justifyContent: isSent ? "flex-end" : "flex-start",
                        paddingRight: isSent ? 2 : 0,
                        paddingLeft: isSent ? 0 : 2,
                      }}>
                        <span style={{ fontSize: 10, color: "#9ca3af" }}>
                          {formatTime(msg.createdAt)}
                        </span>
                        {isSent && (
                          <span style={{
                            fontSize: 13,
                            color: msg.isRead ? "#16a34a" : "#9ca3af",
                            fontWeight: msg.isRead ? 700 : 400,
                            letterSpacing: -2,
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
          <div style={{
            display: "flex", alignItems: "center",
            gap: 8, padding: "4px 0",
          }}>
            <div style={{
              padding: "10px 14px",
              borderRadius: "18px 18px 18px 4px",
              background: "#fff",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
              display: "flex", alignItems: "center", gap: 3,
            }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 7, height: 7,
                  borderRadius: "50%",
                  background: "#9ca3af",
                  animation: `bounce 1.2s infinite ${i * 0.2}s`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input Bar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 12px",
        background: "#fff",
        borderTop: "1px solid #e5e7eb",
        flexShrink: 0,
      }}>
        <input
          value={text}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          style={{
            flex: 1, padding: "10px 16px",
            border: "1px solid #e5e7eb",
            borderRadius: 24, fontSize: 13.5,
            outline: "none",
            background: "#f9fafb",
            color: "#111827",
            transition: "border 0.15s",
          }}
          onFocus={(e) => e.target.style.borderColor = "#16a34a"}
          onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim()}
          style={{
            width: 42, height: 42, borderRadius: "50%",
            background: text.trim() ? "#16a34a" : "#e5e7eb",
            border: "none",
            cursor: text.trim() ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
            boxShadow: text.trim() ? "0 2px 8px rgba(22,163,74,0.4)" : "none",
            flexShrink: 0,
          }}
        >
          <MdSend size={18} color="#fff" />
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}