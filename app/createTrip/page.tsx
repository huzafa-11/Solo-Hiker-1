"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

// ─── Form Type ────────────────────────────────────────────────
type FormData = {
  title:           string;
  description:     string;
  location:        string;
  startDate:       string;
  endDate:         string;
  difficulty:      "EASY" | "MODERATE" | "CHALLENGING" | "EXPERT";
  maxParticipants: number;
  isPublic:        boolean;
};

const DIFFICULTY_OPTIONS = [
  { value: "EASY",        label: "Easy",        icon: "🥾" },
  { value: "MODERATE",    label: "Moderate",    icon: "⛰️" },
  { value: "CHALLENGING", label: "Chhhallenging", icon: "🧗" },
  { value: "EXPERT",      label: "Expert",      icon: "🏔️" },
];

// ─── File → base64 ───────────────────────────────────────────
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// ─── Create Trip Page ─────────────────────────────────────────
export default function CreateTripPage() {
  const router  = useRouter();
  const { status } = useSession();

  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [submitError,   setSubmitError]   = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles,    setImageFiles]    = useState<File[]>([]);
  const [isDragging,    setIsDragging]    = useState(false);
  const [diffOpen,      setDiffOpen]      = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    defaultValues: { isPublic: true, difficulty: "EASY", maxParticipants: 1 },
  });

  const difficulty = watch("difficulty");
  const isPublic   = watch("isPublic");

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  // ── Image handlers ──────────────────────────────────────────
  const addFiles = (files: File[]) => {
    const images = files.filter(f => f.type.startsWith("image/"));
    if (images.length + imageFiles.length > 5) {
      alert("Maximum 5 images allowed");
      return;
    }
    setImagePreviews(p => [...p, ...images.map(f => URL.createObjectURL(f))]);
    setImageFiles(f => [...f, ...images]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files || []));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeImage = (i: number) => {
    setImagePreviews(p => p.filter((_, idx) => idx !== i));
    setImageFiles(f => f.filter((_, idx) => idx !== i));
  };

  // ── Submit ───────────────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    if (imageFiles.length === 0) {
      setSubmitError("Please upload at least one image");
      return;
    }
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const base64Images = await Promise.all(imageFiles.map(fileToBase64));
      const res  = await fetch("/api/trips/create", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...data, images: base64Images }),
      });
      const result = await res.json();
      if (!result.success) {
        setSubmitError(result.message || "Failed to create trip");
        setIsSubmitting(false);
        return;
      }
      setSubmitSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  // ── Success screen ───────────────────────────────────────────
  if (submitSuccess) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--page-bg)" }}>
        <div className="card animate-scale-in" style={{ padding: 48, maxWidth: 360, width: "100%", textAlign: "center" }}>
          <div className="animate-bounce" style={{ width: 72, height: 72, background: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 20px" }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--gray-900)", marginBottom: 8 }}>Trip Created! 🎉</h2>
          <p style={{ color: "var(--gray-400)", fontSize: 14 }}>Redirecting to dashboard...</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
            {[0, 1, 2].map(i => (
              <div key={i} className="animate-bounce" style={{ width: 8, height: 8, background: "var(--green-500)", borderRadius: "50%", animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const selectedDiff = DIFFICULTY_OPTIONS.find(d => d.value === difficulty);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0d1f0f" }}>

      {/* ── LEFT: Hero Panel ──────────────────────────────────── */}
      <div className="animate-fade-in hide-mobile" style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Background image */}
        <img
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&h=1400&fit=crop"
          alt="mountains"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(5,30,10,0.75) 100%)" }} />

        {/* Content */}
        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "48px" }}>
          {/* Logo badge */}
          <div className="animate-fade-in-down" style={{ position: "absolute", top: 40, left: 48, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 24, padding: "8px 18px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>🏔️</span>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>SOLO </span>
            <span style={{ color: "var(--green-400)", fontWeight: 700, fontSize: 14 }}>-HIKER</span>
          </div>

          {/* Hero text */}
          <div className="animate-fade-in-up">
            <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 20, letterSpacing: -1 }}>
              Host Your{" "}
              <span style={{ color: "var(--green-400)", fontStyle: "italic" }}>First Hike</span>
              ,<br />
              Lead Your Tribe.
            </h1>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 15, lineHeight: 1.7, maxWidth: 380, marginBottom: 48 }}>
              Design unique treks, share hidden trails, and lead a community of passionate hikers. Inspire others on their journey.
            </p>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 36 }}>
              {[
                { value: "2.4K", label: "ACTIVE HIKERS" },
                { value: "380+", label: "TRAILS MAPPED" },
                { value: "98%",  label: "SAFE RETURNS"  },
              ].map(stat => (
                <div key={stat.label} className="animate-fade-in-up">
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 600, letterSpacing: 1, marginTop: 4 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Form Panel ─────────────────────────────────── */}
      <div
        className="animate-slide-in-right custom-scrollbar"
        style={{ width: "100%", maxWidth: 420, background: "#fff", overflowY: "auto", display: "flex", flexDirection: "column" }}
      >
        <div style={{ padding: "36px 32px", flex: 1 }}>

          {/* Header */}
          <div className="animate-fade-in-down" style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--green-600)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>GET STARTED</p>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: "var(--gray-900)", letterSpacing: -0.5, marginBottom: 0 }}>Create a Trip</h2>
          </div>

          {/* Error banner */}
          {submitError && (
            <div className="animate-slide-in-left" style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 14px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <p style={{ fontSize: 13, color: "#dc2626", fontWeight: 500 }}>{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 0 }}>

            {/* Section: Trip Details */}
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--gray-700)", marginBottom: 16 }}>Trip Details</p>

            {/* Trip Title */}
            <Field label="TRIP TITLE" error={errors.title?.message}>
              <input
                {...register("title", { required: "Trip title is required", minLength: { value: 3, message: "Title must be at least 3 characters" } })}
                placeholder="e.g. K2 Base Camp Expedition"
                className="input animate-fade-in"
              />
            </Field>

            {/* Description */}
            <Field label="DESCRIPTION" error={errors.description?.message}>
              <textarea
                {...register("description", { minLength: { value: 10, message: "Description must be at least 10 characters" } })}
                rows={3}
                placeholder="Describe your route, highlights, what hikers should expect..."
                className="input custom-scrollbar"
                style={{ resize: "none", lineHeight: 1.6 }}
              />
            </Field>

            {/* Location + Difficulty side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <Field label="LOCATION" error={errors.location?.message} noMargin>
                <input
                  {...register("location", { required: "Location is required", minLength: { value: 2, message: "Please enter a valid location" } })}
                  placeholder="Hunza Valley, GB"
                  className="input animate-fade-in"
                />
              </Field>

              {/* Custom Difficulty Dropdown */}
              <Field label="DIFFICULTY LEVEL" error={errors.difficulty?.message} noMargin>
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setDiffOpen(o => !o)}
                    className="input"
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", background: diffOpen ? "#f0fdf4" : "#f9fafb", borderColor: diffOpen ? "var(--green-500)" : undefined }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
                      <span>{selectedDiff?.icon}</span>
                      <span style={{ color: "var(--gray-700)", fontWeight: 500 }}>{selectedDiff?.label}</span>
                    </span>
                    <span style={{ color: "var(--gray-400)", fontSize: 12, transform: diffOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
                  </button>

                  {diffOpen && (
                    <div className="animate-scale-in" style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, boxShadow: "var(--shadow-lg)", zIndex: 50, overflow: "hidden" }}>
                      {DIFFICULTY_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setValue("difficulty", opt.value as FormData["difficulty"]); setDiffOpen(false); }}
                          style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: difficulty === opt.value ? "#f0fdf4" : "transparent", border: "none", cursor: "pointer", fontSize: 13, color: difficulty === opt.value ? "var(--green-700)" : "var(--gray-700)", fontWeight: difficulty === opt.value ? 700 : 400, transition: "background 0.1s" }}
                          onMouseEnter={e => { if (difficulty !== opt.value) e.currentTarget.style.background = "#f9fafb"; }}
                          onMouseLeave={e => { if (difficulty !== opt.value) e.currentTarget.style.background = "transparent"; }}
                        >
                          <span>{opt.icon}</span> {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Field>
            </div>

            {/* Start Date + End Date side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <Field label="START DATE" error={errors.startDate?.message} noMargin>
                <input
                  {...register("startDate", { required: "Start date is required" })}
                  type="date"
                  className="input animate-fade-in"
                />
              </Field>

              <Field label="END DATE" error={errors.endDate?.message} noMargin>
                <input
                  {...register("endDate", { required: "End date is required" })}
                  type="date"
                  className="input animate-fade-in"
                />
              </Field>
            </div>

            {/* Max Participants */}
            <Field label="MAX PARTICIPANTS" error={errors.maxParticipants?.message}>
              <input
                {...register("maxParticipants", { valueAsNumber: true, required: "Number of participants is required", min: { value: 1, message: "At least 1 participant" }, max: { value: 100, message: "Maximum 100 participants" } })}
                type="number"
                min={1}
                max={100}
                className="input animate-fade-in"
                style={{ width: "100%" }}
              />
            </Field>

            {/* Trip Images */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "var(--gray-500)", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                TRIP IMAGES
              </label>

              {/* Image slots row */}
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                {/* Existing previews */}
                {imagePreviews.map((src, i) => (
                  <div key={i} className="animate-scale-in hover-scale" style={{ position: "relative", width: 60, height: 60, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                    <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", color: "#fff", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >✕</button>
                  </div>
                ))}

                {/* Add more slots (up to 5) */}
                {Array.from({ length: Math.max(0, 5 - imagePreviews.length) }).map((_, i) => (
                  <button
                    key={`slot-${i}`}
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ width: 60, height: 60, borderRadius: 10, border: "1.5px dashed #d1d5db", background: i === 0 && imagePreviews.length === 0 ? "#f0fdf4" : "#f9fafb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 3, transition: "all 0.15s", flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--green-500)"; e.currentTarget.style.background = "#f0fdf4"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.background = i === 0 && imagePreviews.length === 0 ? "#f0fdf4" : "#f9fafb"; }}
                  >
                    {i === 0 && imagePreviews.length === 0
                      ? <><span style={{ fontSize: 18 }}>📷</span><span style={{ fontSize: 9, color: "var(--green-600)", fontWeight: 600 }}>+ Add Photos</span></>
                      : <span style={{ color: "#d1d5db", fontSize: 20 }}>🖼️</span>
                    }
                  </button>
                ))}
              </div>

              {/* Hidden file input */}
              <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileInput} style={{ display: "none" }} />

              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                style={{ border: `1.5px dashed ${isDragging ? "var(--green-500)" : "#e5e7eb"}`, borderRadius: 10, padding: "10px", textAlign: "center", background: isDragging ? "#f0fdf4" : "transparent", transition: "all 0.2s", cursor: "pointer" }}
                onClick={() => fileInputRef.current?.click()}
              >
                <p style={{ fontSize: 12, color: isDragging ? "var(--green-600)" : "var(--gray-400)", fontWeight: 500 }}>
                  {isDragging ? "Drop images here" : "Upload up to 5 images (Drag & Drop)"}
                </p>
              </div>

              {imageFiles.length === 0 && submitError.includes("image") && (
                <p style={{ fontSize: 11, color: "#dc2626", marginTop: 4 }}>⚠️ At least one image is required</p>
              )}
            </div>

            {/* Visibility Toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#f9fafb", borderRadius: 10, marginBottom: 24 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-700)", margin: 0 }}>
                  {isPublic ? "🌍 Public Trip" : "🔒 Private Trip"}
                </p>
                <p style={{ fontSize: 11, color: "var(--gray-400)", margin: "2px 0 0" }}>
                  {isPublic ? "Visible to all hikers" : "Only visible to you"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setValue("isPublic", !isPublic)}
                style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: isPublic ? "var(--green-500)" : "#d1d5db", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}
              >
                <span style={{ position: "absolute", top: 2, left: isPublic ? 22 : 2, width: 20, height: 20, background: "#fff", borderRadius: "50%", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }} />
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary hover-lift"
              style={{ width: "100%", justifyContent: "center", fontSize: 15, padding: "14px", borderRadius: 12, gap: 10 }}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin" style={{ display: "inline-block", width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} />
                  Creating Trip...
                </>
              ) : (
                <>Save and Post Trip →</>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 32px", borderTop: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gray-700)" }}>Solo-Hiker</span>
          <Link href="/dashboard" style={{ fontSize: 12, color: "var(--gray-400)", fontWeight: 500 }}>← Back to home</Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Field wrapper ─────────────────────────────────────────────
function Field({ label, error, children, noMargin }: { label: string; error?: string; children: React.ReactNode; noMargin?: boolean }) {
  return (
    <div style={{ marginBottom: noMargin ? 0 : 16 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: "var(--gray-500)", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {error && (
        <p className="animate-slide-in-left" style={{ fontSize: 11, color: "#dc2626", marginTop: 4, fontWeight: 500 }}>
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}