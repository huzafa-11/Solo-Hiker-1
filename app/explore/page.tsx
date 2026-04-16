"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/layout/dashboardLayout";

// ─── Types ────────────────────────────────────────────────────
interface Trip {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  difficulty: "EASY" | "MODERATE" | "HARD" | "EXPERT";
  maxParticipants: number;
  currentParticipants: number;
  images: string[];
  isPublic: boolean;
  participants: string[];
  user?: { id: string; name: string; image?: string };
}

// ─── Constants ────────────────────────────────────────────────
const DIFF_BADGE: Record<string, React.CSSProperties> = {
  EASY:     { background: "rgba(220,252,231,0.92)", color: "#15803d", border: "1px solid #bbf7d0" },
  MODERATE: { background: "rgba(254,249,195,0.92)", color: "#854d0e", border: "1px solid #fde68a" },
  HARD:     { background: "rgba(255,237,213,0.92)", color: "#c2410c", border: "1px solid #fed7aa" },
  EXPERT:   { background: "rgba(254,226,226,0.92)", color: "#b91c1c", border: "1px solid #fecaca" },
};

const DIFF_LABEL: Record<string, string> = {
  EASY: "Easy", MODERATE: "Moderate", HARD: "Hard", EXPERT: "Expert",
};

const FILTERS      = ["All", "Easy", "Moderate", "Hard", "Expert"];
const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular"    },
  { value: "newest",  label: "Newest First"    },
  { value: "oldest",  label: "Oldest First"    },
  { value: "spots",   label: "Spots Available" },
];

// ─── Debounce hook ────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Page ─────────────────────────────────────────────────────
export default function ExploreTrails() {
  const { data: session } = useSession();

  const [trips,       setTrips]       = useState<Trip[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState("All");
  const [sort,        setSort]        = useState("popular");
  const [search,      setSearch]      = useState("");
  const [location,    setLocation]    = useState("");
  const [startDate,   setStartDate]   = useState("");
  const [endDate,     setEndDate]     = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [joiningId,   setJoiningId]   = useState<string | null>(null);
  const [requestStatuses, setRequestStatuses] = useState<Record<string, string | null>>({});

  // Debounce text inputs — prevents API call on every keystroke
  const debouncedSearch   = useDebounce(search,   400);
  const debouncedLocation = useDebounce(location, 400);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort });
      if (filter !== "All")    params.append("difficulty", filter.toUpperCase());
      if (debouncedSearch)     params.append("search",     debouncedSearch);
      if (debouncedLocation)   params.append("location",   debouncedLocation);
      if (startDate)           params.append("startDate",  startDate);
      if (endDate)             params.append("endDate",    endDate);

      const res  = await fetch(`/api/trips/explore?${params}`);
      const data = await res.json();
      if (data.success) setTrips(data.trips);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter, sort, debouncedSearch, debouncedLocation, startDate, endDate]);

  // Fetch immediately on mount + re-fetch when filters change
  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  // Fetch join request statuses for all trips when trips change
  useEffect(() => {
    if (!session || trips.length === 0) return;

    const fetchStatuses = async () => {
      const statuses: Record<string, string | null> = {};
      for (const trip of trips) {
        try {
          const res = await fetch(`/api/trips/${trip.id}/join-status`);
          const data = await res.json();
          statuses[trip.id] = data.status || null;
        } catch (err) {
          console.error(`Failed to fetch status for trip ${trip.id}:`, err);
          statuses[trip.id] = null;
        }
      }
      setRequestStatuses(statuses);
    };

    fetchStatuses();
  }, [trips, session]);

  async function handleJoin(tripId: string) {
    if (!session) return;
    setJoiningId(tripId);
    try {
      const res  = await fetch(`/api/trips/${tripId}/join`, { 
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        // Update the request status to PENDING
        setRequestStatuses((prev) => ({
          ...prev,
          [tripId]: "PENDING",
        }));
      }
    } finally {
      setJoiningId(null);
    }
  }

  function isJoined(trip: Trip): boolean {
    return session?.user?.email ? trip.participants.includes(session.user.email) : false;
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <DashboardLayout title="Explore Trails">
      <div style={{ padding: "24px 28px 40px" }}>

        {/* ── Sub-header card ── */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", marginBottom: 24, border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>

          {/* Title row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: -0.5 }}>Explore Trails</h2>
              <p style={{ fontSize: 13, color: "#6b7280", margin: "3px 0 0" }}>
                {loading ? "Loading adventures..." : `Showing ${trips.length} curated adventure${trips.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            {!loading && (
              <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{trips.length} available</span>
            )}
          </div>

          {/* Search + Sort + Filter toggle */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} width={15} height={15} fill="none" viewBox="0 0 24 24" stroke="#9ca3af">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search trails, locations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 13, background: "#f9fafb", outline: "none", color: "#374151", boxSizing: "border-box" }}
                onFocus={e => (e.target.style.borderColor = "#16a34a")}
                onBlur={e  => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 13, background: "#f9fafb", color: "#374151", cursor: "pointer", outline: "none", minWidth: 145 }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Advanced filters toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: `1px solid ${showFilters ? "#16a34a" : "#e5e7eb"}`, background: showFilters ? "#f0fdf4" : "#f9fafb", color: showFilters ? "#16a34a" : "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              {showFilters ? "Hide Filters" : "More Filters"}
            </button>
          </div>

          {/* Advanced filters — location + date range */}
          {showFilters && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14, padding: "14px", background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb", alignItems: "center" }}>
              {/* Location */}
              <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
                <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} width={12} height={12} fill="none" viewBox="0 0 24 24" stroke="#9ca3af">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Filter by location..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{ width: "100%", paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7, borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, background: "#fff", outline: "none", color: "#374151", boxSizing: "border-box" }}
                  onFocus={e => (e.target.style.borderColor = "#16a34a")}
                  onBlur={e  => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>

              {/* Start date */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, background: "#fff", outline: "none", color: "#374151", cursor: "pointer" }}
                />
              </div>

              {/* End date */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>To</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, background: "#fff", outline: "none", color: "#374151", cursor: "pointer" }}
                />
              </div>

              {/* Clear */}
              {(location || startDate || endDate) && (
                <button
                  onClick={() => { setLocation(""); setStartDate(""); setEndDate(""); }}
                  style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #fecaca", background: "#fff1f2", color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Difficulty filter pills */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
            {FILTERS.map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "6px 18px", borderRadius: 20, fontSize: 13,
                    fontWeight: active ? 700 : 500, whiteSpace: "nowrap",
                    border: active ? "1px solid #16a34a" : "1px solid #e5e7eb",
                    background: active ? "#16a34a" : "#fff",
                    color: active ? "#fff" : "#6b7280",
                    cursor: "pointer", transition: "all 0.15s",
                    boxShadow: active ? "0 1px 4px rgba(22,163,74,0.3)" : "none",
                  }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = "#16a34a"; e.currentTarget.style.color = "#15803d"; } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#6b7280"; } }}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Trip Grid ── */}
        {loading ? (
          <div className="explore-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid #f3f4f6" }}>
                <div style={{ height: 176, background: "#e5e7eb" }} className="skeleton" />
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="skeleton" style={{ height: 14, borderRadius: 6, width: "70%" }} />
                  <div className="skeleton" style={{ height: 11, borderRadius: 6, width: "45%" }} />
                  <div className="skeleton" style={{ height: 34, borderRadius: 10, marginTop: 6 }} />
                </div>
              </div>
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 0", textAlign: "center" }}>
            <div style={{ width: 72, height: 72, background: "#f0fdf4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <svg width={36} height={36} fill="none" viewBox="0 0 24 24" stroke="#4ade80">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#374151", margin: "0 0 4px" }}>No trails found</h3>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="explore-grid">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                joined={isJoined(trip)}
                joiningId={joiningId}
                requestStatus={requestStatuses[trip.id] || null}
                onJoin={handleJoin}
                formatDate={formatDate}
                hasSession={!!session}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .explore-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }
        @media (max-width: 1100px) { .explore-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px)  { .explore-grid { grid-template-columns: 1fr; } }
      `}</style>
    </DashboardLayout>
  );
}

// ─── Trip Card ────────────────────────────────────────────────
function TripCard({
  trip, joined, joiningId, requestStatus, onJoin, formatDate, hasSession,
}: {
  trip: Trip;
  joined: boolean;
  joiningId: string | null;
  requestStatus: string | null;
  onJoin: (id: string) => void;
  formatDate: (d: string) => string;
  hasSession: boolean;
}) {
  const spotsLeft  = trip.maxParticipants - trip.currentParticipants;
  const isFull     = spotsLeft <= 0;
  const coverImage = trip.images?.[0] ?? null;
  const badge      = DIFF_BADGE[trip.difficulty] ?? { background: "rgba(243,244,246,0.92)", color: "#374151", border: "1px solid #e5e7eb" };
  const label      = DIFF_LABEL[trip.difficulty] ?? trip.difficulty;
  const fillPct    = Math.min(100, (trip.currentParticipants / trip.maxParticipants) * 100);

  return (
    <div
      style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid #f3f4f6", display: "flex", flexDirection: "column", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", transition: "box-shadow 0.2s, transform 0.2s" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "none"; }}
    >
      {/* Cover image */}
      <div
        style={{ position: "relative", height: 176, background: "linear-gradient(135deg, #dcfce7, #a7f3d0)", overflow: "hidden", cursor: "pointer" }}
        className="card-img-wrap"
      >
        {coverImage ? (
          <Image
            src={coverImage}
            alt={trip.title}
            fill
            style={{ objectFit: "cover", transition: "transform 0.4s ease" }}
            className="card-img"
            sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw"
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={48} height={48} fill="none" viewBox="0 0 24 24" stroke="#86efac">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Difficulty badge */}
        <div style={{ position: "absolute", top: 10, left: 10 }}>
          <span style={{ ...badge, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, backdropFilter: "blur(4px)" }}>
            {label}
          </span>
        </div>

        {/* Full overlay */}
        {isFull && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ background: "#fff", color: "#374151", fontSize: 12, fontWeight: 800, padding: "4px 14px", borderRadius: 20, letterSpacing: 1 }}>FULL</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", flex: 1, gap: 8 }}>

        {/* Title + location */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {trip.title}
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, color: "#9ca3af", fontSize: 12 }}>
            <svg width={12} height={12} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trip.location}</span>
          </div>
        </div>

        {/* Date + spots */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#6b7280" }}>
            <svg width={12} height={12} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(trip.startDate)}
          </div>
          <span style={{ fontWeight: 700, color: isFull ? "#ef4444" : spotsLeft <= 3 ? "#f97316" : "#16a34a", fontSize: 12 }}>
            {isFull ? "Full" : `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: "#f3f4f6", borderRadius: 9999, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 9999, background: isFull ? "#ef4444" : "#16a34a", width: `${fillPct}%`, transition: "width 0.4s ease" }} />
        </div>

        {/* Organizer row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#9ca3af", paddingTop: 6, borderTop: "1px solid #f3f4f6" }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg, #4ade80, #16a34a)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 800, flexShrink: 0 }}>
            {trip.user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            by {trip.user?.name ?? "Unknown"}
          </span>
          <svg style={{ marginLeft: "auto", flexShrink: 0 }} width={12} height={12} fill="#fca5a5" viewBox="0 0 24 24">
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 4 }}>
          <Link
            href={`/trips/${trip.id}`}
            style={{ flex: 1, textAlign: "center", padding: "8px 0", borderRadius: 10, border: "1.5px solid #16a34a", color: "#16a34a", fontSize: 12, fontWeight: 700, textDecoration: "none", transition: "background 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f0fdf4")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            View Details
          </Link>

          {requestStatus === "APPROVED" ? (
            // Approved button
            <div style={{ flex: 1, padding: "8px 0", borderRadius: 10, background: "#dcfce7", border: "1.5px solid #bbf7d0", color: "#16a34a", fontSize: 12, fontWeight: 700, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              ✓ Approved
            </div>
          ) : requestStatus === "PENDING" ? (
            // Pending button (red)
            <div style={{ flex: 1, padding: "8px 0", borderRadius: 10, background: "#fee2e2", border: "1.5px solid #fecaca", color: "#dc2626", fontSize: 12, fontWeight: 700, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              ⏳ Pending
            </div>
          ) : requestStatus === "REJECTED" ? (
            // Rejected button
            <div style={{ flex: 1, padding: "8px 0", borderRadius: 10, background: "#fee2e2", border: "1.5px solid #fecaca", color: "#dc2626", fontSize: 12, fontWeight: 700, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              ✗ Rejected
            </div>
          ) : (
            // Join button
            <button
              onClick={() => hasSession && !isFull && onJoin(trip.id)}
              disabled={joiningId === trip.id || isFull || !hasSession}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 10,
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                color: "#fff",
                cursor: isFull || !hasSession ? "not-allowed" : "pointer",
                background: isFull || !hasSession ? "#d1d5db" : "#16a34a",
                transition: "background 0.15s, transform 0.1s",
              }}
              onMouseEnter={e => {
                if (!isFull && hasSession && joiningId !== trip.id) e.currentTarget.style.background = "#15803d";
              }}
              onMouseLeave={e => {
                if (!isFull && hasSession) e.currentTarget.style.background = "#16a34a";
              }}
              onMouseDown={e => {
                e.currentTarget.style.transform = "scale(0.97)";
              }}
              onMouseUp={e => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {joiningId === trip.id ? "Joining..." : isFull ? "Full" : "Join Trip"}
            </button>
          )}
        </div>
      </div>

      <style>{`
        .card-img-wrap:hover .card-img { transform: scale(1.07); }
      `}</style>
    </div>
  );
}