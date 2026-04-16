"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MdDashboard, MdExplore, MdMap, MdPerson, MdSettings,
} from "react-icons/md";
import { FaMountain } from "react-icons/fa";

// ─── Nav items ────────────────────────────────────────────────────────────────
export const NAV_ITEMS = [
  { label: "Dashboard",      href: "/dashboard", Icon: MdDashboard },
  { label: "Explore Trails", href: "/explore",   Icon: MdExplore   },
  { label: "My Trips",       href: "/trip",     Icon: MdMap       },
  { label: "Profile",        href: "/profile",   Icon: MdPerson    },
  { label: "Settings",       href: "/settings",  Icon: MdSettings  },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  // Determine active item from current URL
  const activeItem =
    NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.label ?? "Dashboard";

  return (
    <aside
      style={{
        width: 200,
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
        display: "flex",
        flexDirection: "column",
        padding: "20px 0",
        height: "100vh",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "0 20px 20px",
          borderBottom: "1px solid var(--sidebar-border)",
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: "linear-gradient(135deg, #16a34a, #15803d)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FaMountain color="#fff" size={16} />
          </div>
          <div>
            <span
              style={{
                fontWeight: 800,
                fontSize: 13,
                color: "#111827",
                letterSpacing: -0.3,
                display: "block",
                lineHeight: 1.1,
              }}
            >
              SOLO-
            </span>
            <span
              style={{
                fontWeight: 800,
                fontSize: 13,
                color: "var(--green-600)",
                letterSpacing: -0.3,
                display: "block",
                lineHeight: 1.1,
              }}
            >
              HIKER
            </span>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: "4px 10px" }}>
        {NAV_ITEMS.map(({ label, href, Icon }) => {
          const isActive = activeItem === label;
          return (
            <Link
              key={label}
              href={href}
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 10,
                marginBottom: 2,
                background: isActive ? "#dcfce7" : "transparent",
                color: isActive ? "var(--green-700)" : "var(--gray-500)",
                fontWeight: isActive ? 700 : 500,
                fontSize: 13,
                transition: "all 0.15s",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "#f0fdf4";
                  e.currentTarget.style.color = "var(--green-700)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--gray-500)";
                }
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}