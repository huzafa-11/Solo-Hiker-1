"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

import { DashboardLayout } from "@//layout/dashboardLayout";
import { FaMountain, FaMapMarkerAlt, FaCalendarAlt, FaMedal, FaHiking } from "react-icons/fa";
import { MdAdd, MdArrowForward, MdMoreHoriz, MdPublic, MdLock, MdChevronRight } from "react-icons/md";
import { BsClockHistory } from "react-icons/bs";

// ─── Types ────────────────────────────────────────────────────────────────────

type Trip = {
  id: string;
  tripName: string;
  location: string;
  difficulty: string;
  isPublic: boolean;
  images: string[];
  createdAt: string;
  startDate?: string;
  endDate?: string;
  maxParticipants?: number;
  currentParticipants?: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const COMMUNITY_IMGS = [
  "https://images.unsplash.com/photo-1551632811-561732d1e306?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1520962922320-2038eebab146?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1464278533981-50106e6176b1?w=120&h=120&fit=crop",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getTripStatus(startDate?: string, endDate?: string): { label: string; color: string; bg: string } {
  if (!startDate || !endDate) return { label: "Planned",   color: "#6b7280", bg: "#6b728018" };
  const now = Date.now();
  if (now < new Date(startDate).getTime()) return { label: "Upcoming",  color: "#2563eb", bg: "#2563eb18" };
  if (now > new Date(endDate).getTime())   return { label: "Completed", color: "#6b7280", bg: "#6b728018" };
  return                                          { label: "Ongoing",   color: "#16a34a", bg: "#16a34a18" };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Map Widget ───────────────────────────────────────────────────────────────

function MapWidget({ location }: { location?: string }) {
  const query   = location ? encodeURIComponent(location) : "hiking+trails+near+me";
  const mapsUrl = `https://www.google.com/maps/search/${query}`;
  return (
    <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
      style={{ display: "block", width: "100%", height: "100%", minHeight: 220, position: "relative", borderRadius: 14, overflow: "hidden", cursor: "pointer" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #d4e8c8, #c8ddb0 50%, #b8cc98)" }} />
      <div style={{ position: "absolute", top: "50%",    left: "20%",  right: "10%", height: 6,   background: "#fff", borderRadius: 3, opacity: 0.8 }} />
      <div style={{ position: "absolute", top: "30%",    left: "40%",  width: 5, bottom: "20%",   background: "#fff", borderRadius: 3, opacity: 0.7 }} />
      <div style={{ position: "absolute", top: "20%",    left: "55%",  right: "25%", height: 4,   background: "#fff", borderRadius: 2, opacity: 0.6 }} />
      <div style={{ position: "absolute", top: "10%",    left: "5%",   width: 80,    height: 50,  background: "#a8c890", borderRadius: "50%", opacity: 0.6 }} />
      <div style={{ position: "absolute", bottom: "15%", right: "10%", width: 100,   height: 60,  background: "#a8c890", borderRadius: "50%", opacity: 0.5 }} />
      <div style={{ position: "absolute", top: "42%", left: "46%", transform: "translate(-50%, -100%)" }}>
        <div style={{ width: 26, height: 26, background: "#ef4444", borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)", border: "3px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }} />
      </div>
      <div style={{ position: "absolute", top: 10, right: 10, display: "flex", flexDirection: "column", gap: 4 }}>
        {["⌖", "⊙"].map((icon, i) => (
          <div key={i} style={{ width: 32, height: 32, background: "#fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }}>{icon}</div>
        ))}
      </div>
      <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 20, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5 }}>
        <FaMapMarkerAlt size={10} />
        {location ? `View "${location}" on Maps` : "Open Google Maps"}
      </div>
    </a>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [greeting,        setGreeting]        = useState("");
  const [trips,           setTrips]           = useState<Trip[]>([]);
  const [tripsLoading,    setTripsLoading]    = useState(true);
  const [featured,        setFeatured]        = useState<Trip | null>(null);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [joinedFeatured,  setJoinedFeatured]  = useState(false);
  const [joiningFeatured, setJoiningFeatured] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening");
  }, []);

  // Fetch the logged-in user's own trips, sorted newest first
  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      try {
        const res  = await fetch("/api/trips/my-trips");
        const data = await res.json();
        const sorted = (data.trips || []).sort(
          (a: Trip, b: Trip) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setTrips(sorted);
      } catch {
        setTrips([]);
      } finally {
        setTripsLoading(false);
      }
    })();
  }, [status]);

  // Fetch featured trail (most recent public trip from any user)
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch("/api/trips/featured");
        const data = await res.json();
        if (data.success) setFeatured(data.trip);
      } catch {
        setFeatured(null);
      } finally {
        setFeaturedLoading(false);
      }
    })();
  }, []);

  const handleJoinFeatured = async () => {
    if (!featured || !session) return;
    setJoiningFeatured(true);
    try {
      const res  = await fetch(`/api/trips/${featured.id}/join`, { method: "POST" });
      const data = await res.json();
      if (data.success) setJoinedFeatured(true);
    } finally {
      setJoiningFeatured(false);
    }
  };

  const userName    = session?.user?.name  || "Hiker";
  const userInitial = (session?.user?.name?.[0] || session?.user?.email?.[0] || "U").toUpperCase();
  const latestTrip  = trips[0]; // newest trip — used for map location

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--page-bg)" }}>
        <div style={{ textAlign: "center" }}>
          <div className="animate-spin" style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid #e5e7eb", borderTopColor: "var(--green-500)", margin: "0 auto 16px" }} />
          <p style={{ color: "var(--gray-400)", fontSize: 14 }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <div style={{ padding: "20px 24px" }}>

        {/* ── Hero Banner ── */}
<div
  style={{
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    height: 250,
    minHeight: 200,
    maxWidth: "100%",   // ← yeh add karo
    boxSizing: "border-box", // ← yeh bhi
  }}
>
  <img
    src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80"
    alt="mountains"
    style={{
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      opacity: 0.55,
    }}
  />
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(to right, rgba(15,76,37,0.88), rgba(15,76,37,0.45) 60%, transparent)",
    }}
  />
  <div
    style={{
      position: "relative",
      padding: "20px 20px", // ← mobile pe padding thodi kam karo
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      boxSizing: "border-box", // ← important
    }}
  >
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <span style={{ background: "rgba(22,163,74,0.9)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "5px 14px", color: "#fff", fontSize: 12, fontWeight: 600, border: "1px solid rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>
        ✅ Verify Email
      </span>
      <span style={{ background: "rgba(239,68,68,0.85)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "5px 14px", color: "#fff", fontSize: 12, fontWeight: 600, border: "1px solid rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>
        🔄 Complete Profile — 85% Done
      </span>
    </div>
    <div>
      <h2 style={{ color: "#fff", fontSize: "clamp(18px, 4vw, 24px)", fontWeight: 800, letterSpacing: -0.5, margin: "0 0 4px" }}>
        {greeting}, {userName}! 👋
      </h2>
      <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, margin: "0 0 14px" }}>
        Ready for your next adventure?
      </p>
      <Link href="/explore" style={{ background: "#fff", color: "var(--green-700)", fontSize: 12, padding: "8px 18px", borderRadius: 9, display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700, textDecoration: "none" }}>
        Explore Now <MdArrowForward size={14} />
      </Link>
    </div>
  </div>
</div>

        {/* ── Row 1: Stats | Featured Trail | Recent Activity ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr 1fr", gap: 16, marginBottom: 16 }} className="dash-row">

          {/* Stats */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--gray-700)", margin: "0 0 14px" }}>Current Stats</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { label: "Total Trips", value: trips.length,                                                                            Icon: FaHiking   },
                { label: "This Week",   value: trips.filter(t => Date.now() - new Date(t.createdAt).getTime() < 7 * 86400000).length,   Icon: FaMountain },
                { label: "Public",      value: trips.filter(t => t.isPublic).length,                                                     Icon: FaMedal    },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center", padding: "10px 4px", background: "#f8faf5", borderRadius: 10 }}>
                  <s.Icon size={18} color="var(--green-600)" />
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#111827", lineHeight: 1, marginTop: 4 }}>
                    {tripsLoading ? "—" : s.value}
                  </div>
                  <div style={{ fontSize: 9, color: "var(--gray-400)", marginTop: 3, lineHeight: 1.3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Trail */}
          <div className="card" style={{ overflow: "hidden" }}>
            {featuredLoading ? (
              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="skeleton" style={{ height: 12, width: 80,  borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 14, width: 160, borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 90, borderRadius: 8 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <div className="skeleton" style={{ flex: 1, height: 34, borderRadius: 8 }} />
                  <div className="skeleton" style={{ flex: 1, height: 34, borderRadius: 8 }} />
                </div>
              </div>
            ) : !featured ? (
              <div style={{ padding: 20, textAlign: "center", color: "var(--gray-400)", fontSize: 12 }}>
                <FaMountain size={28} color="var(--gray-300)" style={{ marginBottom: 8 }} />
                <p style={{ margin: 0 }}>No featured trails yet</p>
              </div>
            ) : (
              <>
                <div style={{ padding: "16px 20px 0" }}>
                  <p style={{ fontSize: 10, color: "var(--gray-400)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, margin: "0 0 2px" }}>Featured Trail:</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
                    <FaMapMarkerAlt size={10} color="var(--gray-400)" />
                    <span style={{ fontSize: 11, color: "var(--gray-400)" }}>{featured.location}</span>
                  </div>
                </div>
                <div style={{ height: 90, overflow: "hidden", background: "linear-gradient(135deg, #dcfce7, #bbf7d0)" }}>
                  {featured.images?.[0]
                    ? <img src={featured.images[0]} alt={featured.tripName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><FaMountain size={32} color="var(--green-400)" /></div>
                  }
                </div>
                <div style={{ padding: "12px 20px 16px" }}>
                  <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "var(--gray-500)", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                      <FaCalendarAlt size={9} /> {featured.startDate ? formatDate(featured.startDate) : "TBD"}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--gray-500)", fontWeight: 600, padding: "1px 8px", borderRadius: 20, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                      {featured.difficulty}
                    </span>
                    {featured.maxParticipants && (
                      <span style={{ fontSize: 11, color: "var(--gray-500)", fontWeight: 600 }}>
                        {featured.currentParticipants ?? 0}/{featured.maxParticipants} joined
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link href={`/trips/${featured.id}`} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", fontSize: 12, padding: "7px", textDecoration: "none" }}>
                      View Details
                    </Link>
                    {!joinedFeatured ? (
                      <button onClick={handleJoinFeatured} disabled={joiningFeatured || !session} className="btn btn-orange" style={{ flex: 1, justifyContent: "center", fontSize: 12, padding: "7px" }}>
                        {joiningFeatured ? "Joining..." : "Join Trip"}
                      </button>
                    ) : (
                      <div className="btn btn-primary" style={{ flex: 1, justifyContent: "center", fontSize: 12, padding: "7px", cursor: "default" }}>✓ Joined</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Recent Activity */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--gray-700)", margin: 0 }}>Recent Activity</h3>
              <Link href="/trips" style={{ fontSize: 11, color: "var(--green-600)", fontWeight: 600, textDecoration: "none" }}>View all</Link>
            </div>
            {tripsLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="skeleton" style={{ height: 52, borderRadius: 10 }} />
                <div className="skeleton" style={{ height: 52, borderRadius: 10 }} />
              </div>
            ) : trips.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "var(--gray-400)", fontSize: 12 }}>
                <BsClockHistory size={28} color="var(--gray-300)" style={{ marginBottom: 8 }} />
                <p style={{ margin: 0 }}>No activity yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {trips.slice(0, 2).map((trip) => (
                  <Link key={trip.id} href={`/trips/${trip.id}`}
                    style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, padding: 10, background: "#f8faf5", borderRadius: 10, transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f0fdf4")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#f8faf5")}
                  >
                    {trip.images?.[0]
                      ? <img src={trip.images[0]} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                      : <div style={{ width: 32, height: 32, background: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><FaMountain size={14} color="var(--green-600)" /></div>
                    }
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-700)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trip.tripName}</p>
                      <p style={{ fontSize: 11, color: "var(--gray-400)", margin: "2px 0 0" }}>{trip.location} · {timeAgo(trip.createdAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Row 2: My Trips | Map | Community Feed ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 16 }} className="dash-row">

          {/* ── My Trips ── */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--gray-700)", margin: 0 }}>My Trips</h3>
              {/*
                "View all" → /trips page where user can manage ALL their trips
                Each row below → /trips/[id] for that specific trip's edit/delete page
              */}
              <Link href="/trips" style={{ fontSize: 11, color: "var(--green-600)", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 1 }}>
                View all <MdChevronRight size={13} />
              </Link>
            </div>

            {tripsLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />)}
              </div>
            ) : trips.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "var(--gray-400)", fontSize: 12, marginBottom: 14 }}>
                <FaHiking size={32} color="var(--gray-300)" style={{ marginBottom: 8 }} />
                <p style={{ margin: 0 }}>No trips yet. Plan your first!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
                {trips.slice(0, 4).map((trip) => {
                  const s = getTripStatus(trip.startDate, trip.endDate);
                  return (
                    <Link
                      key={trip.id}
                      href={`/trips/${trip.id}`}
                      title="Click to edit or delete this trip"
                      style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10, border: "1px solid transparent", transition: "all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#f0fdf4"; e.currentTarget.style.borderColor = "#bbf7d0"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
                    >
                      {/* Thumbnail */}
                      {trip.images?.[0] ? (
                        <img src={trip.images[0]} alt="" style={{ width: 36, height: 36, borderRadius: 9, objectFit: "cover", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 36, height: 36, background: "#f0fdf4", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid #dcfce7" }}>
                          <FaMountain size={15} color="var(--green-500)" />
                        </div>
                      )}

                      {/* Name + location */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {trip.tripName}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--gray-400)", margin: "2px 0 0", display: "flex", alignItems: "center", gap: 3 }}>
                          <FaMapMarkerAlt size={9} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trip.location}</span>
                        </p>
                      </div>

                      {/* Status + visibility */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: s.bg, padding: "2px 8px", borderRadius: 20 }}>
                          {s.label}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 9, color: "var(--gray-400)" }}>
                          {trip.isPublic ? <MdPublic size={10} /> : <MdLock size={10} />}
                          {trip.isPublic ? "Public" : "Private"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            <Link href="/createTrip"
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, padding: "10px", borderRadius: 10, background: "var(--green-600)", color: "#fff", fontWeight: 700, textDecoration: "none", transition: "background 0.15s", boxSizing: "border-box" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--green-700)")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--green-600)")}
            >
              <MdAdd size={16} /> Plan New Trip
            </Link>
          </div>

          {/* Map */}
          <div className="card" style={{ overflow: "hidden", padding: 0 }}>
            <MapWidget location={latestTrip?.location} />
          </div>

          {/* Community Feed */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--gray-700)", margin: 0 }}>Community Feed</h3>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)", padding: "2px 4px" }}><MdMoreHoriz size={18} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
              {COMMUNITY_IMGS.map((img, i) => (
                <div key={i} style={{ aspectRatio: "1", borderRadius: 10, overflow: "hidden" }}>
                  <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, var(--green-400), var(--green-600))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                {userInitial}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gray-700)" }}>{userName}</span>
                  <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)", padding: "2px 4px" }}><MdMoreHoriz size={16} /></button>
                </div>
                <p style={{ fontSize: 12, color: "var(--gray-500)", margin: "3px 0 0", lineHeight: 1.4 }}>
                  {latestTrip ? `Just posted: ${latestTrip.tripName}` : "No activity yet. Create your first trip!"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) { .dash-row { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 640px)  { .dash-row { grid-template-columns: 1fr !important; } }
      `}</style>
    </DashboardLayout>
  );
}