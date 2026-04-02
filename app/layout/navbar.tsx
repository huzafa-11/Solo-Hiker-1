"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  MdNotifications, MdLogout, MdAdd, MdPerson, MdMenu,
} from "react-icons/md";

interface NavbarProps {
  title: string;
  onMenuClick?: () => void;
}

export function Navbar({ title, onMenuClick }: NavbarProps) {
  const { data: session } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userName    = session?.user?.name  || "User";
  const userInitial = (
    session?.user?.name?.[0] || session?.user?.email?.[0] || "U"
  ).toUpperCase();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: "/login", redirect: true });
  };

  return (
    <header
      style={{
        background: "#fff",
        borderBottom: "1px solid var(--sidebar-border)",
        padding: "0 24px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 40,
        flexShrink: 0,
      }}
    >
      {/* Left: hamburger (mobile) + page title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {onMenuClick && (
          <button
            className="hide-desktop"
            onClick={onMenuClick}
            style={{
              padding: 8,
              borderRadius: 8,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--gray-600)",
            }}
          >
            <MdMenu size={20} />
          </button>
        )}
        <h1
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: "#111827",
            letterSpacing: -0.5,
            margin: 0,
          }}
        >
          {title}
        </h1>
      </div>

      {/* Right: actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Bell */}
        <button
          style={{
            position: "relative",
            padding: 8,
            borderRadius: 10,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--gray-600)",
          }}
        >
          <MdNotifications size={20} />
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 7,
              height: 7,
              background: "#ef4444",
              borderRadius: "50%",
              border: "2px solid #fff",
            }}
          />
        </button>

        {/* Complete Profile */}
        <Link
          href="/profile"
          className="hide-mobile"
          style={{
            fontSize: 12,
            padding: "7px 14px",
            display: "flex",
            alignItems: "center",
            gap: 5,
            borderRadius: 8,
            border: "1px solid var(--green-600)",
            color: "var(--green-700)",
            fontWeight: 600,
            textDecoration: "none",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f0fdf4")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <MdPerson size={14} /> Complete Profile
        </Link>

        {/* Create Trip */}
        <Link
          href="/createTrip"
          style={{
            fontSize: 12,
            padding: "7px 14px",
            display: "flex",
            alignItems: "center",
            gap: 5,
            borderRadius: 8,
            background: "var(--green-600)",
            color: "#fff",
            fontWeight: 600,
            textDecoration: "none",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--green-700)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--green-600)")}
        >
          <MdAdd size={14} /> Create Trip
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="hide-mobile"
          style={{
            fontSize: 12,
            padding: "7px 14px",
            display: "flex",
            alignItems: "center",
            gap: 5,
            borderRadius: 8,
            background: "#ef4444",
            color: "#fff",
            fontWeight: 600,
            border: "none",
            cursor: isLoggingOut ? "not-allowed" : "pointer",
            opacity: isLoggingOut ? 0.7 : 1,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!isLoggingOut)
              (e.currentTarget as HTMLButtonElement).style.background = "#dc2626";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#ef4444";
          }}
        >
          {isLoggingOut ? (
            <span
              style={{
                display: "inline-block",
                width: 14,
                height: 14,
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                animation: "spin 0.6s linear infinite",
              }}
            />
          ) : (
            <>
              <MdLogout size={14} /> Logout
            </>
          )}
        </button>

        {/* Avatar */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--green-400), var(--green-600))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
            border: "2px solid rgba(34,197,94,0.3)",
          }}
        >
          {userInitial}
        </div>
        <span
          className="hide-mobile"
          style={{ fontWeight: 600, fontSize: 14, color: "var(--gray-700)" }}
        >
          {userName}
        </span>
      </div>
    </header>
  );
}