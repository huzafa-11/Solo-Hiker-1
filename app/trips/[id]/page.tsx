"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  FaMapMarkerAlt,
  FaMountain,
  FaCalendarAlt,
  FaUsers,
  FaHiking,
  FaArrowLeft,
  FaHeart,
  FaRegHeart,
  FaShareAlt,
  FaLock,
  FaGlobe,
  FaClock,
  FaCheckCircle,
} from "react-icons/fa";
import { MdAdd } from "react-icons/md";

// ─── Types ────────────────────────────────────────────────────
type Participant = {
  id:           string;
  name:         string;
  email:        string;
  age?:         number;
  hikingLevel?: string;
  image?:       string;
};

type Trip = {
  id:                  string;
  title:               string;
  tripName?:           string;
  description:         string;
  location:            string;
  startDate:           string;
  endDate:             string;
  difficulty:          "Easy" | "Moderate" | "Hard" | "Expert";
  maxParticipants:     number;
  currentParticipants: number;
  images:              string[];
  isPublic:            boolean;
  likes:               string[];
  participants:        Participant[];   // ← now full objects
  createdAt:           string;
  user: {
    id:     string;
    name:   string;
    image?: string;
  };
};

// ─── Helpers ──────────────────────────────────────────────────
const DIFFICULTY_CONFIG = {
  Easy:     { color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0" },
  Moderate: { color: "#d97706", bg: "#fef3c7", border: "#fde68a" },
  Hard:     { color: "#ea580c", bg: "#ffedd5", border: "#fed7aa" },
  Expert:   { color: "#dc2626", bg: "#fee2e2", border: "#fecaca" },
};

const HIKING_BADGE: Record<string, { bg: string; color: string }> = {
  BEGINNER:     { bg: "#dcfce7", color: "#16a34a" },
  INTERMEDIATE: { bg: "#fef3c7", color: "#d97706" },
  ADVANCED:     { bg: "#fee2e2", color: "#dc2626" },
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#4ade80,#16a34a)",
  "linear-gradient(135deg,#60a5fa,#2563eb)",
  "linear-gradient(135deg,#f472b6,#db2777)",
  "linear-gradient(135deg,#fb923c,#ea580c)",
  "linear-gradient(135deg,#a78bfa,#7c3aed)",
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short", month: "long", day: "numeric", year: "numeric",
  });
}

function getDuration(start: string, end: string) {
  const days = Math.ceil(
    (new Date(end).getTime() - new Date(start).getTime()) / 86400000
  );
  return days === 1 ? "1 day" : `${days} days`;
}

function getTripStatus(startDate: string, endDate: string) {
  const now   = Date.now();
  const start = new Date(startDate).getTime();
  const end   = new Date(endDate).getTime();
  if (now < start) return { label: "Upcoming",  color: "#2563eb", bg: "#eff6ff" };
  if (now > end)   return { label: "Completed", color: "#6b7280", bg: "#f3f4f6" };
  return { label: "Ongoing", color: "#16a34a", bg: "#dcfce7" };
}

// ─── Page ─────────────────────────────────────────────────────
export default function TripDetailPage() {
  const { id }            = useParams<{ id: string }>();
  const router            = useRouter();
  const { data: session } = useSession();

  const [trip,      setTrip]      = useState<Trip | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [liked,     setLiked]     = useState(false);
  const [liking,    setLiking]    = useState(false);
  const [joined,    setJoined]    = useState(false);
  const [joining,   setJoining]   = useState(false);
  const [copied,    setCopied]    = useState(false);
  const [visible,   setVisible]   = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res  = await fetch(`/api/trips/${id}`);
        const data = await res.json();
        if (data.success) {
          setTrip(data.trip);
          const userEmail = session?.user?.email ?? "";
          setLiked(data.trip.likes?.includes(userEmail) || false);
          // participants is now an array of objects — check by email
          setJoined(
            data.trip.participants?.some((p: Participant) => p.email === userEmail) || false
          );
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setTimeout(() => setVisible(true), 50);
      }
    })();
  }, [id, session]);

  const handleLike = async () => {
    if (!session || !trip) return;
    setLiking(true);
    try {
      const res  = await fetch(`/api/trips/${trip.id}/like`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setLiked(data.liked);
        setTrip((prev) =>
          prev
            ? {
                ...prev,
                likes: data.liked
                  ? [...prev.likes, session.user?.email ?? ""]
                  : prev.likes.filter((l) => l !== session.user?.email),
              }
            : prev
        );
      }
    } finally {
      setLiking(false);
    }
  };

  const handleJoin = async () => {
    if (!session || !trip) return;
    setJoining(true);
    try {
      const res  = await fetch(`/api/trips/${trip.id}/join`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setJoined(true);
        setTrip((prev) =>
          prev ? { ...prev, currentParticipants: prev.currentParticipants + 1 } : prev
        );
      }
    } finally {
      setJoining(false);
    }
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8faf8", padding: "24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div className="skeleton" style={{ height: 400, borderRadius: 20, marginBottom: 24 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
            <div>
              <div className="skeleton" style={{ height: 36, width: "60%", borderRadius: 10, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 16, width: "40%", borderRadius: 8, marginBottom: 24 }} />
              <div className="skeleton" style={{ height: 120, borderRadius: 12 }} />
            </div>
            <div className="skeleton" style={{ borderRadius: 16, height: 300 }} />
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8faf8", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        <FaMountain size={48} color="#d1d5db" />
        <p style={{ color: "#6b7280", fontSize: 16, fontWeight: 600 }}>Trip not found</p>
        <Link href="/explore" style={{ color: "#16a34a", fontSize: 14, textDecoration: "none", fontWeight: 600 }}>← Back to Explore</Link>
      </div>
    );
  }

  const tripTitle  = trip.title || trip.tripName || "Untitled Trip";
  const difficulty = DIFFICULTY_CONFIG[trip.difficulty] ?? DIFFICULTY_CONFIG.Moderate;
  const status     = getTripStatus(trip.startDate, trip.endDate);
  const spotsLeft  = trip.maxParticipants - trip.currentParticipants;
  const isFull     = spotsLeft <= 0;
  const fillPct    = Math.round((trip.currentParticipants / trip.maxParticipants) * 100);

  // ── Google Maps embed URL — no API key needed ──
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(trip.location)}&z=13&output=embed`;

  return (
    <div style={{ minHeight: "100vh", background: "#f8faf8" }}>

      {/* ── Hero image section ── */}
      <div style={{ position: "relative", height: 420, overflow: "hidden", background: "linear-gradient(135deg, #064e3b, #065f46)" }}>
        {trip.images?.[activeImg] && (
          <Image
            src={trip.images[activeImg]}
            alt={tripTitle}
            fill
            className="object-cover"
            style={{ opacity: visible ? 0.75 : 0, transition: "opacity 0.8s ease" }}
            sizes="100vw"
            priority
          />
        )}

        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.6) 100%)" }} />

        {/* Top bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
          opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(-16px)",
          transition: "all 0.5s ease",
        }}>
          <button
            onClick={() => router.back()}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px 16px", borderRadius: 40, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            <FaArrowLeft size={12} /> Back
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleShare} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px 14px", borderRadius: 40, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <FaShareAlt size={12} /> {copied ? "Copied!" : "Share"}
            </button>
            <button onClick={handleLike} disabled={liking || !session} style={{ display: "flex", alignItems: "center", gap: 6, background: liked ? "rgba(239,68,68,0.85)" : "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px 14px", borderRadius: 40, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
              {liked ? <FaHeart size={12} /> : <FaRegHeart size={12} />}
              {trip.likes?.length ?? 0}
            </button>
          </div>
        </div>

        {/* Bottom hero info */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "all 0.6s ease 0.1s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <span style={{ background: difficulty.bg, color: difficulty.color, border: `1px solid ${difficulty.border}`, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{trip.difficulty}</span>
            <span style={{ background: status.bg, color: status.color, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{status.label}</span>
            <span style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", color: "#fff", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
              {trip.isPublic ? <FaGlobe size={10} /> : <FaLock size={10} />}
              {trip.isPublic ? "Public" : "Private"}
            </span>
          </div>
          <h1 style={{ color: "#fff", fontSize: 32, fontWeight: 900, letterSpacing: -1, margin: "0 0 8px", textShadow: "0 2px 12px rgba(0,0,0,0.3)", lineHeight: 1.15 }}>{tripTitle}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.85)", fontSize: 14 }}>
            <FaMapMarkerAlt size={12} /><span>{trip.location}</span>
          </div>
        </div>

        {/* Image thumbnails */}
        {trip.images?.length > 1 && (
          <div style={{ position: "absolute", bottom: 24, right: 24, display: "flex", gap: 8, opacity: visible ? 1 : 0, transition: "opacity 0.6s ease 0.3s" }}>
            {trip.images.map((img, i) => (
              <button key={i} onClick={() => setActiveImg(i)} style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", padding: 0, border: activeImg === i ? "2px solid #fff" : "2px solid rgba(255,255,255,0.3)", cursor: "pointer", transition: "all 0.2s", flexShrink: 0, transform: activeImg === i ? "scale(1.08)" : "scale(1)" }}>
                <Image src={img} alt="" width={48} height={48} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "start" }} className="trip-detail-grid">

          {/* ── Left column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Quick stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "all 0.5s ease 0.15s" }} className="trip-stats-grid">
              {[
                { Icon: FaCalendarAlt, label: "Start",      value: new Date(trip.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) },
                { Icon: FaClock,       label: "Duration",   value: getDuration(trip.startDate, trip.endDate) },
                { Icon: FaUsers,       label: "Spots left", value: isFull ? "Full" : `${spotsLeft}/${trip.maxParticipants}` },
                { Icon: FaHiking,      label: "Joined",     value: String(trip.currentParticipants) },
              ].map(({ Icon, label, value }) => (
                <div key={label} style={{ background: "#fff", borderRadius: 14, padding: "14px 12px", textAlign: "center", border: "1px solid #f0f0f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <Icon size={16} color="#16a34a" style={{ marginBottom: 6 }} />
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #f0f0f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "all 0.5s ease 0.2s" }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 12, letterSpacing: -0.3 }}>About this trip</h2>
              <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.75, margin: 0 }}>{trip.description || "No description provided for this trip."}</p>
            </div>

            {/* Dates card */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #f0f0f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "all 0.5s ease 0.25s" }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 16, letterSpacing: -0.3 }}>Trip Dates</h2>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ flex: 1, background: "#f8faf8", borderRadius: 12, padding: "14px 16px", minWidth: 140 }}>
                  <p style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 4px" }}>Departure</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>{formatDate(trip.startDate)}</p>
                </div>
                <div style={{ color: "#d1d5db", fontWeight: 300, fontSize: 20 }}>→</div>
                <div style={{ flex: 1, background: "#f8faf8", borderRadius: 12, padding: "14px 16px", minWidth: 140 }}>
                  <p style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 4px" }}>Return</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>{formatDate(trip.endDate)}</p>
                </div>
              </div>
            </div>

            {/* Participants progress bar */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #f0f0f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "all 0.5s ease 0.3s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: -0.3 }}>Participants</h2>
                <span style={{ fontSize: 13, fontWeight: 700, color: isFull ? "#dc2626" : "#16a34a" }}>
                  {trip.currentParticipants} / {trip.maxParticipants}
                </span>
              </div>
              <div style={{ height: 8, background: "#f3f4f6", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ height: "100%", borderRadius: 99, width: visible ? `${fillPct}%` : "0%", background: isFull ? "#dc2626" : fillPct > 75 ? "#f59e0b" : "#16a34a", transition: "width 1s ease 0.5s" }} />
              </div>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                {isFull ? "This trip is full" : `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} remaining`}
              </p>
            </div>

            {/* ── WHO'S JOINING — new participants list ── */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #f0f0f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "all 0.5s ease 0.35s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: -0.3 }}>Who&apos;s Joining</h2>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "3px 10px", borderRadius: 20 }}>
                  {trip.participants?.length ?? 0} joined
                </span>
              </div>

              {!trip.participants || trip.participants.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <FaUsers size={28} color="#d1d5db" style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>No participants yet. Be the first to join!</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {trip.participants.map((p) => {
                    const badge = HIKING_BADGE[p.hikingLevel ?? ""] ?? { bg: "#f3f4f6", color: "#6b7280" };
                    const grad  = AVATAR_GRADIENTS[p.id.charCodeAt(p.id.length - 1) % AVATAR_GRADIENTS.length];
                    return (
                      <div
                        key={p.id}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: "#f8faf8", border: "1px solid #f0f0f0", transition: "background 0.2s", cursor: "default" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f0fdf4")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#f8faf8")}
                      >
                        {/* Coloured avatar initial */}
                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: grad, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                          {p.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        {/* Name + email */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name ?? "Unknown"}</p>
                          <p style={{ fontSize: 11, color: "#9ca3af", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.email}</p>
                        </div>
                        {/* Hiking level badge */}
                        {p.hikingLevel && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: badge.bg, color: badge.color, flexShrink: 0, textTransform: "capitalize" }}>
                            {p.hikingLevel.charAt(0) + p.hikingLevel.slice(1).toLowerCase()}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* ── END who's joining ── */}

          </div>

          {/* ── Right column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Join / Action card */}
            <div style={{ background: "#fff", borderRadius: 18, padding: 22, border: "1px solid #f0f0f0", boxShadow: "0 4px 20px rgba(0,0,0,0.07)", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "all 0.5s ease 0.2s", position: "sticky", top: 24 }}>

              {/* Organizer */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, paddingBottom: 16, borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#4ade80,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                  {trip.user?.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 2px", fontWeight: 600 }}>Organized by</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>{trip.user?.name ?? "Unknown"}</p>
                </div>
              </div>

              {/* Spot indicator */}
              <div style={{ background: isFull ? "#fee2e2" : spotsLeft <= 3 ? "#fef3c7" : "#dcfce7", borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <FaUsers size={13} color={isFull ? "#dc2626" : spotsLeft <= 3 ? "#d97706" : "#16a34a"} />
                <span style={{ fontSize: 13, fontWeight: 700, color: isFull ? "#dc2626" : spotsLeft <= 3 ? "#d97706" : "#16a34a" }}>
                  {isFull ? "No spots left" : spotsLeft <= 3 ? `Only ${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left!` : `${spotsLeft} spots available`}
                </span>
              </div>

              {/* CTA */}
              {joined ? (
                <div style={{ width: "100%", padding: "13px", borderRadius: 12, background: "#dcfce7", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#16a34a", fontWeight: 700, fontSize: 14 }}>
                  <FaCheckCircle size={16} /> You&apos;re in!
                </div>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={joining || isFull || !session}
                  style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: isFull || !session ? "#e5e7eb" : "linear-gradient(135deg,#16a34a,#15803d)", color: isFull || !session ? "#9ca3af" : "#fff", fontWeight: 700, fontSize: 14, cursor: isFull || !session ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: isFull || !session ? "none" : "0 4px 14px rgba(22,163,74,0.35)", transition: "all 0.2s" }}
                >
                  {joining ? (
                    <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  ) : (
                    <><MdAdd size={18} /> {isFull ? "Trip Full" : !session ? "Login to Join" : "Join This Trip"}</>
                  )}
                </button>
              )}

              {!session && (
                <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", margin: "10px 0 0" }}>
                  <Link href="/login" style={{ color: "#16a34a", fontWeight: 600, textDecoration: "none" }}>Sign in</Link> to join this trip
                </p>
              )}

              {/* Like + Share */}
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button onClick={handleLike} disabled={liking || !session} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${liked ? "#fecaca" : "#e5e7eb"}`, background: liked ? "#fff1f2" : "#fafafa", color: liked ? "#dc2626" : "#6b7280", fontWeight: 600, fontSize: 13, cursor: !session ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s" }}>
                  {liked ? <FaHeart size={13} /> : <FaRegHeart size={13} />}
                  {trip.likes?.length ?? 0}
                </button>
                <button onClick={handleShare} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #e5e7eb", background: copied ? "#f0fdf4" : "#fafafa", color: copied ? "#16a34a" : "#6b7280", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s" }}>
                  <FaShareAlt size={13} /> {copied ? "Copied!" : "Share"}
                </button>
              </div>
            </div>

            {/* ── Location card with real Google Maps iframe ── */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #f0f0f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "all 0.5s ease 0.35s" }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 12, letterSpacing: -0.2 }}>Location</h3>

              {/* Real Google Maps — no API key required */}
              <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 10, border: "1px solid #e5e7eb" }}>
                <iframe
                  src={mapSrc}
                  width="100%"
                  height="180"
                  style={{ border: 0, display: "block" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Map of ${trip.location}`}
                />
              </div>

              {/* Open in Maps link */}
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(trip.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#4b5563", fontSize: 13, fontWeight: 600 }}>
                  <FaMapMarkerAlt size={12} color="#16a34a" />
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>{trip.location}</span>
                </div>
                <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700, background: "#dcfce7", padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0 }}>
                  Directions →
                </span>
              </a>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .trip-detail-grid { grid-template-columns: 1fr !important; }
          .trip-stats-grid  { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .trip-stats-grid  { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}