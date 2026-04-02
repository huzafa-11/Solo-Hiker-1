"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Sidebar, NAV_ITEMS } from "./sidebar";
import { Navbar } from "./navbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();

  // derive active label for mobile bottom nav from title
  const activeLabel =
    NAV_ITEMS.find((item) => item.label === title)?.label ?? "Dashboard";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--page-bg)" }}>

      {/* ── Desktop Sidebar (always visible) ── */}
      <div
        className="hide-mobile"
        style={{ position: "sticky", top: 0, height: "100vh", flexShrink: 0 }}
      >
        <Sidebar />
      </div>

      {/* ── Mobile Sidebar (overlay) ── */}
      {sidebarOpen && (
        <>
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 98,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              height: "100vh",
              zIndex: 99,
            }}
          >
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* ── Main column ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          paddingBottom: 64, // space for mobile bottom nav
        }}
      >
        <Navbar title={title} onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main style={{ flex: 1 }}>{children}</main>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav
        className="hide-desktop"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          borderTop: "1px solid var(--sidebar-border)",
          display: "flex",
          justifyContent: "space-around",
          padding: "8px 0",
          zIndex: 50,
        }}
      >
        {NAV_ITEMS.map(({ label, href, Icon }) => (
          <Link
            key={label}
            href={href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "4px 6px",
              color:
                activeLabel === label
                  ? "var(--green-700)"
                  : "var(--gray-400)",
              transition: "color 0.15s",
              textDecoration: "none",
            }}
          >
            <Icon size={20} />
            <span style={{ fontSize: 9, fontWeight: 600 }}>
              {label.split(" ")[0]}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}