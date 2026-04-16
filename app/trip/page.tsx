"use client";

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTS
// "use client" tells Next.js this file runs in the browser (client-side),
// not on the server. Required for hooks like useState, useEffect, etc.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react";
// useEffect  → runs side-effects (data fetching, timers) after render
// useState   → holds reactive data; re-renders component when value changes
// useCallback → memoizes a function so it isn't re-created on every render

import { useSession } from "next-auth/react";
// useSession → returns the logged-in user's session (name, email, etc.)

import { DashboardLayout } from "@/layout/dashboardLayout";
// Your custom layout wrapper that renders the sidebar + topbar

import {
  MdLocationOn,    // pin icon for location
  MdCalendarToday, // calendar icon for dates
  MdPeople,        // group icon for participant count
  MdExpandMore,    // chevron-down for collapsed state
  MdExpandLess,    // chevron-up for expanded state
  MdCheck,         // checkmark for approve / success toast
  MdClose,         // X for reject / error toast
  MdOutlineHiking, // hiker icon for empty state / card placeholder
  MdLock,          // lock icon for private trips
  MdPublic,        // globe icon for public trips
} from "react-icons/md";

// ─────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// TypeScript interfaces describe the "shape" of our data so the compiler
// catches mistakes (wrong field names, wrong types) at build time.
// ─────────────────────────────────────────────────────────────────────────────

type HikingLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
// A union type — the value can only be one of these three exact strings.

type Trip = {
  id: string;
  title: string;
  location: string;
  startDate: string;         // ISO date string e.g. "2026-05-09T00:00:00Z"
  endDate: string;
  difficulty: "EASY" | "MODERATE" | "HARD" | "EXPERT";
  images: string[];          // array of image URLs
  currentParticipants: number;
  maxParticipants: number;
  isPublic: boolean;
};

type Applicant = {
  id: string;                // join-request ID (not user ID)
  createdAt: string;         // when the request was submitted
  user: {
    id: string;
    name: string | null;     // name may be null if user skipped it
    email: string;
    hikingLevel: HikingLevel;
    age: number;
  };
};

// Maps a request ID → its current decision state so we can show a spinner
// on just the one row being processed.
type DecisionState = Record<string, "loading" | "done">;

// ─────────────────────────────────────────────────────────────────────────────
// PURE HELPER FUNCTIONS
// These have no side-effects and are defined outside components so they are
// never re-created on every render.
// ─────────────────────────────────────────────────────────────────────────────

/** Returns up to 2 initials from a display name, or the first letter of the email. */
function getInitials(name: string | null, email: string): string {
  if (name)
    return name
      .split(" ")               // ["John", "Doe"]
      .map((w) => w[0])         // ["J", "D"]
      .slice(0, 2)              // take at most 2
      .join("")                 // "JD"
      .toUpperCase();
  return email[0].toUpperCase(); // fallback: "j" → "J"
}

/** Formats an ISO date string to "May 9, 2026". */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Formats an ISO date string to a shorter "May 9" (for request timestamps). */
function formatRequestDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Returns Tailwind classes for the difficulty badge background + text color.
 * The ?? fallback handles any unexpected values gracefully.
 */
function difficultyColor(d: string): string {
  const map: Record<string, string> = {
    EASY:     "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
    MODERATE: "bg-amber-100   text-amber-800   ring-1 ring-amber-200",
    HARD:     "bg-orange-100  text-orange-800  ring-1 ring-orange-200",
    EXPERT:   "bg-red-100     text-red-800     ring-1 ring-red-200",
  };
  return map[d] ?? "bg-gray-100 text-gray-700";
}

/** Returns Tailwind classes for the hiking-level badge on each applicant row. */
function hikingLevelColor(level: HikingLevel): string {
  const map: Record<HikingLevel, string> = {
    BEGINNER:     "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200",
    INTERMEDIATE: "bg-amber-50   text-amber-700   ring-1 ring-amber-200",
    ADVANCED:     "bg-red-50     text-red-600     ring-1 ring-red-200",
  };
  return map[level] ?? "bg-gray-50 text-gray-500";
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST COMPONENT
// A small notification that pops up at the bottom-right of the screen and
// automatically disappears after 4 seconds.
// ─────────────────────────────────────────────────────────────────────────────

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;   // called when the toast wants to dismiss itself
}) {
  // useEffect with onClose in the dependency array:
  // • Runs once after mount (the timer starts).
  // • Returns a cleanup function that cancels the timer if the component
  //   unmounts before 4 s (prevents memory leaks / calling setState on an
  //   unmounted component).
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`
        fixed bottom-8 right-8 z-50
        flex items-center gap-3 px-5 py-3.5
        rounded-2xl shadow-2xl text-sm font-semibold
        backdrop-blur-sm border
        transition-all duration-300 animate-in slide-in-from-bottom-4
        ${
          type === "success"
            ? "bg-emerald-600/95 text-white border-emerald-500"
            : "bg-red-500/95 text-white border-red-400"
        }
      `}
    >
      {/* Icon: checkmark for success, X for error */}
      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
        {type === "success" ? <MdCheck size={12} /> : <MdClose size={12} />}
      </div>
      {message}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLICANTS PANEL
// Rendered inside a TripCard when the user clicks "Applicants".
// It fetches pending join-requests for one trip and lets the organiser
// approve or reject each one.
// ─────────────────────────────────────────────────────────────────────────────

function ApplicantsPanel({
  tripId,
  onCountChange, // callback: tells the parent to update its pending-count
}: {
  tripId: string;
  onCountChange: (delta: number) => void;
}) {
  // Local state: list of pending applicants for this trip
  const [applicants, setApplicants] = useState<Applicant[]>([]);

  // Whether we are still fetching the initial list
  const [loading, setLoading] = useState(true);

  // Tracks which requests are currently being approved/rejected
  // key = requestId, value = "loading" | "done"
  const [deciding, setDeciding] = useState<DecisionState>({});

  // The current toast notification (null = no toast showing)
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // ── Fetch applicants on mount ──────────────────────────────────────────────
  // The empty dependency array [] means "run once after first render".
  // tripId is stable so we don't need it in the array, but linters
  // sometimes require it — add it if your ESLint config demands it.
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/trips/${tripId}/join-requests`);
        if (!res.ok) return; // silently bail on error; could also set an error state
        const data = await res.json();
        setApplicants(data); // replace state with fresh list
      } finally {
        setLoading(false); // always hide skeleton, even on error
      }
    }
    load();
  }, [tripId]);

  // ── Handle Approve / Reject ────────────────────────────────────────────────
  // useCallback memoises this function.
  // Without it, a new function reference is created on every render,
  // which would cause child buttons to think their props changed unnecessarily.
  const handleDecision = useCallback(
    async (
      requestId: string,
      status: "APPROVED" | "REJECTED",
      applicantName: string
    ) => {
      // Show spinner on this specific row
      setDeciding((prev) => ({ ...prev, [requestId]: "loading" }));

      try {
        const res = await fetch(`/api/join-requests/${requestId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
          // Sends { "status": "APPROVED" } or { "status": "REJECTED" }
        });

        const data = await res.json();

        if (!res.ok) {
          // Server returned 4xx/5xx — show error toast and re-enable buttons
          setToast({ message: data.error ?? "Something went wrong.", type: "error" });
          setDeciding((prev) => {
            const n = { ...prev };
            delete n[requestId]; // remove loading state so button re-enables
            return n;
          });
          return;
        }

        // Success: remove this applicant from the local list (optimistic UI)
        setApplicants((prev) => prev.filter((a) => a.id !== requestId));

        // Tell the parent card to decrement its badge by 1
        onCountChange(-1);

        setToast({
          message:
            status === "APPROVED"
              ? `${applicantName} has been approved! 🎉`
              : `${applicantName} was declined.`,
          type: status === "APPROVED" ? "success" : "error",
        });
      } catch {
        // Network failure (no internet, server down, etc.)
        setToast({ message: "Network error. Please try again.", type: "error" });
        setDeciding((prev) => {
          const n = { ...prev };
          delete n[requestId];
          return n;
        });
      }
    },
    [onCountChange] // re-create only if the parent's callback changes
  );

  // ── Skeleton loader ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-7 pb-6 pt-4 space-y-4">
        {/* Two placeholder rows that pulse while data loads */}
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded-full w-2/5" />
              <div className="h-2.5 bg-gray-100 rounded-full w-3/5" />
            </div>
            <div className="flex gap-2">
              <div className="h-7 w-20 bg-gray-100 rounded-lg" />
              <div className="h-7 w-16 bg-gray-100 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (applicants.length === 0) {
    return (
      <div className="px-7 py-8 text-center">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
          <MdPeople size={18} className="text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-500">No pending requests</p>
        <p className="text-xs text-gray-400 mt-0.5">All caught up!</p>
      </div>
    );
  }

  // ── Applicant list ─────────────────────────────────────────────────────────
  return (
    <>
      {/* Conditionally render the toast only when there is one */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)} // clears toast when it expires
        />
      )}

      <div className="divide-y divide-gray-100">
        {applicants.map((applicant) => {
          const isLoading = deciding[applicant.id] === "loading";
          const name = applicant.user.name ?? applicant.user.email;
          const initials = getInitials(applicant.user.name, applicant.user.email);

          return (
            <div
              key={applicant.id}
              className="flex items-center gap-4 px-7 py-4 hover:bg-gray-50/70 transition-colors duration-150"
            >
              {/* Avatar circle with initials */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0 shadow-sm">
                {initials}
              </div>

              {/* Name, badges, email */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">
                    {name}
                  </p>
                  {/* Hiking-level badge */}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${hikingLevelColor(
                      applicant.user.hikingLevel
                    )}`}
                  >
                    {applicant.user.hikingLevel}
                  </span>
                  {/* Age badge */}
                  <span className="text-[10px] text-gray-400 font-medium">
                    Age {applicant.user.age}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 truncate">
                  {applicant.user.email} ·{" "}
                  <span className="text-gray-500">
                    Requested {formatRequestDate(applicant.createdAt)}
                  </span>
                </p>
              </div>

              {/* Action buttons — disabled & shows spinner while a request is in flight */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  disabled={isLoading}
                  onClick={() =>
                    handleDecision(applicant.id, "APPROVED", name)
                  }
                  className="
                    flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl
                    text-[12px] font-semibold
                    bg-emerald-50 text-emerald-700
                    border border-emerald-200
                    hover:bg-emerald-100 hover:border-emerald-300
                    active:scale-95
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-150
                  "
                >
                  {/* Spinner or checkmark icon */}
                  {isLoading ? (
                    <span className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <MdCheck size={13} />
                  )}
                  Approve
                </button>

                <button
                  disabled={isLoading}
                  onClick={() =>
                    handleDecision(applicant.id, "REJECTED", name)
                  }
                  className="
                    flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl
                    text-[12px] font-semibold
                    bg-red-50 text-red-600
                    border border-red-200
                    hover:bg-red-100 hover:border-red-300
                    active:scale-95
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-150
                  "
                >
                  <MdClose size={13} />
                  Decline
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIP CARD COMPONENT
// Displays a single trip with its cover image, metadata, capacity bar,
// and a collapsible applicants panel.
// ─────────────────────────────────────────────────────────────────────────────

function TripCard({
  trip,
  pendingCount,  // number of pending join-requests for this trip
  onCountChange, // bubble count changes up to the page level
}: {
  trip: Trip;
  pendingCount: number;
  onCountChange: (delta: number) => void;
}) {
  // Expand panel by default if there are pending applicants (requires attention)
  const [expanded, setExpanded] = useState(pendingCount > 0);

  const isFull = trip.currentParticipants >= trip.maxParticipants;

  // Progress percentage for the capacity bar (0–100)
  const fillPct = Math.min(
    Math.round((trip.currentParticipants / trip.maxParticipants) * 100),
    100 // clamp at 100 so the bar never overflows
  );

  const spotsLeft = trip.maxParticipants - trip.currentParticipants;

  // First image is the cover; falls back to a gradient placeholder
  const coverImage = trip.images?.[0];

  return (
    <div className="
      bg-white rounded-3xl border border-gray-100
      overflow-hidden shadow-sm
      hover:shadow-xl hover:-translate-y-1
      transition-all duration-300 ease-out
      group
    ">
      {/* ── Cover image / gradient header ─────────────────────────────────── */}
      <div className="relative h-44 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 overflow-hidden">

        {coverImage ? (
          // Real image with a subtle zoom on card hover
          <img
            src={coverImage}
            alt={trip.title}
            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          // Placeholder: large faint hiking icon
          <div className="w-full h-full flex items-center justify-center">
            <MdOutlineHiking size={64} className="text-white/20" />
          </div>
        )}

        {/* Dark gradient overlay so text on top is readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

        {/* Difficulty badge — top-left */}
        <div className="absolute top-4 left-4">
          <span
            className={`text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-sm ${difficultyColor(
              trip.difficulty
            )}`}
          >
            {trip.difficulty}
          </span>
        </div>

        {/* Privacy icon — top-right */}
        <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
          {trip.isPublic ? (
            <MdPublic size={14} className="text-white/90" />
          ) : (
            <MdLock size={14} className="text-white/90" />
          )}
        </div>

        {/* "FULL" banner — centred, only when trip is at capacity */}
        {isFull && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <span className="bg-white/95 text-gray-900 text-sm font-extrabold px-6 py-2 rounded-full tracking-widest uppercase shadow-lg">
              Full
            </span>
          </div>
        )}

        {/* Pending badge pinned to the bottom-right of the image */}
        {pendingCount > 0 && (
          <div className="absolute bottom-4 right-4">
            <span className="flex items-center gap-1.5 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              {pendingCount} pending
            </span>
          </div>
        )}
      </div>

      {/* ── Card body ─────────────────────────────────────────────────────── */}
      <div className="px-7 pt-6 pb-7">

        {/* Title */}
        <h3 className="text-[17px] font-bold text-gray-900 leading-snug mb-4 tracking-tight">
          {trip.title}
        </h3>

        {/* Metadata rows — each row has its own vertical spacing */}
        <div className="space-y-3 mb-6">

          {/* Location row */}
          <div className="flex items-center gap-2.5 text-[13px] text-gray-500">
            <MdLocationOn size={16} className="text-emerald-400 flex-shrink-0" />
            <span className="truncate font-medium">{trip.location}</span>
          </div>

          {/* Date row */}
          <div className="flex items-center gap-2.5 text-[13px] text-gray-500">
            <MdCalendarToday size={14} className="text-emerald-400 flex-shrink-0" />
            <span>{formatDate(trip.startDate)}</span>
          </div>

          {/* Participant count + spots left on same row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-[12px] text-gray-400">
              <MdPeople size={15} className="text-gray-400" />
              <span>{trip.currentParticipants} / {trip.maxParticipants} participants</span>
            </div>
            <span
              className={`text-[12px] font-bold px-3 py-1 rounded-full ${
                isFull
                  ? "bg-red-50 text-red-500"
                  : spotsLeft <= 2
                  ? "bg-orange-50 text-orange-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {isFull ? "Full" : `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`}
            </span>
          </div>
        </div>

        {/* Capacity progress bar */}
        <div className="mb-6">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isFull ? "bg-red-400" : "bg-gradient-to-r from-emerald-400 to-emerald-600"
              }`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>

        {/* Applicants toggle button — clean, full width, clearly separated */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="
            w-full flex items-center justify-between px-5 py-3 rounded-2xl
            bg-gray-50 hover:bg-emerald-50
            border border-gray-200 hover:border-emerald-300
            text-[13px] font-semibold text-gray-600 hover:text-emerald-700
            transition-all duration-200
          "
        >
          <div className="flex items-center gap-2.5">
            <MdPeople size={16} />
            <span>
              {pendingCount > 0
                ? `${pendingCount} pending applicant${pendingCount !== 1 ? "s" : ""}`
                : "View Applicants"}
            </span>
          </div>
          {expanded ? <MdExpandLess size={18} /> : <MdExpandMore size={18} />}
        </button>
      </div>

      {/* ── Applicants panel (conditionally rendered) ──────────────────────── */}
      {expanded && (
        <div className="border-t border-gray-100 mx-0">
          <ApplicantsPanel tripId={trip.id} onCountChange={onCountChange} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE COMPONENT — "My Trips"
// The top-level component exported as the default Next.js page.
// It fetches the user's trips and their pending applicant counts,
// then renders them in a responsive grid.
// ─────────────────────────────────────────────────────────────────────────────

export default function MyTripsPage() {
  // Session holds the logged-in user's profile
  const { data: session } = useSession();

  // Full list of trips this user has created
  const [trips, setTrips] = useState<Trip[]>([]);

  // True while the initial data is loading
  const [loading, setLoading] = useState(true);

  // Maps tripId → pending applicant count for badge display
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});

  // Sum of all pendingCounts — shown in the page subtitle
  const [totalPending, setTotalPending] = useState(0);

  // ── Initial data fetch ─────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        // 1. Fetch the user's trips
        const tripsRes = await fetch("/api/trips/my-trips");
        const tripsData = await tripsRes.json();
        if (!tripsData.success) return;
        setTrips(tripsData.trips);

        // 2. For each trip, fetch its pending join-request count in parallel.
        //    Promise.all waits for ALL fetches to settle before continuing.
        const counts: Record<string, number> = {};
        await Promise.all(
          tripsData.trips.map(async (trip: Trip) => {
            try {
              const res = await fetch(`/api/trips/${trip.id}/join-requests`);
              if (res.ok) {
                const applicants: Applicant[] = await res.json();
                counts[trip.id] = applicants.length;
              } else {
                counts[trip.id] = 0; // treat errors as 0
              }
            } catch {
              counts[trip.id] = 0; // network error → treat as 0
            }
          })
        );

        setPendingCounts(counts);

        // Reduce all counts into a single total
        setTotalPending(
          Object.values(counts).reduce((sum, n) => sum + n, 0)
        );
      } finally {
        setLoading(false); // always unblock the UI
      }
    }
    load();
  }, []); // [] = run once on mount, never again

  // ── Handle count changes bubbled up from child cards ───────────────────────
  // Called when an applicant is approved or rejected inside a TripCard.
  // delta is always -1 here (one applicant removed).
  const handleCountChange = useCallback((tripId: string, delta: number) => {
    setPendingCounts((prev) => ({
      ...prev,
      // Math.max prevents negative counts
      [tripId]: Math.max(0, (prev[tripId] ?? 0) + delta),
    }));
    setTotalPending((prev) => Math.max(0, prev + delta));
  }, []); // no dependencies — uses only setters which are stable

  // First name only for the greeting (e.g. "Chippa" from "Chippa Sb")
  const userName = session?.user?.name?.split(" ")[0] ?? "there";

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    // DashboardLayout wraps the page in the sidebar + topbar shell
    <DashboardLayout title="My Trips">

      {/* Outer container: generous horizontal padding, vertical breathing room */}
      <div className="min-h-full bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-10 py-10 pl-12">

          {/* ── Page header ─────────────────────────────────────────────── */}
          <div className="mb-10">
            {/* Top row: heading left, trip count right */}
            <div className="flex items-start justify-between gap-6 mb-1">
              <div>
                {/* Eyebrow label */}
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-1">
                  Organiser Dashboard
                </p>
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                  Your Adventures
                </h1>
              </div>

              {/* Trip count pill — top-right */}
              <div className="flex-shrink-0 mt-1">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 bg-white border border-gray-200 px-4 py-1.5 rounded-full shadow-sm">
                  <MdOutlineHiking size={16} className="text-emerald-500" />
                  {trips.length} trip{trips.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

           

          </div>

          {/* ── Loading skeleton grid ───────────────────────────────────── */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl border border-gray-100 overflow-hidden animate-pulse shadow-sm"
                >
                  {/* Faux image area */}
                  <div className="h-44 bg-gradient-to-br from-gray-200 to-gray-100" />
                  <div className="p-6 space-y-4">
                    <div className="h-4 bg-gray-200 rounded-full w-3/4" />
                    <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                    <div className="h-1.5 bg-gray-100 rounded-full" />
                    <div className="h-10 bg-gray-100 rounded-2xl" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Empty state ─────────────────────────────────────────────── */}
          {!loading && trips.length === 0 && (
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mb-6 shadow-inner">
                <MdOutlineHiking size={40} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                No trips yet
              </h3>
              <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                You haven&apos;t created any trips yet. Hit{" "}
                <strong className="text-gray-600">&ldquo;Create Trip&rdquo;</strong>{" "}
                to plan your first adventure.
              </p>
            </div>
          )}

          {/* ── Trip grid ───────────────────────────────────────────────── */}
          {!loading && trips.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {/* Map over trips array; each item becomes a TripCard.
                  The `key` prop must be unique and stable — using the DB id
                  is correct. Never use array index as key for lists that
                  can be reordered or filtered. */}
              {trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  pendingCount={pendingCounts[trip.id] ?? 0}
                  // ?? 0 → if the count hasn't loaded yet, default to 0
                  onCountChange={(delta) => handleCountChange(trip.id, delta)}
                  // We curry tripId here so TripCard only passes `delta`
                  // and the page closure captures the correct `trip.id`.
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}