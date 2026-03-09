"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    // Mock flow: simulate API call
    const res = await fetch("/api/auth/ForgetPassword", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email }),
});

const data = await res.json();

if (res.ok) {
  setMessage(data.message || "Reset link sent! Redirecting to login...");
  setSent(true);
} else {
  setMessage(data.message || "Email not found .");
}
setLoading(false);

    // Redirect to login after short delay
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap');

        .fp-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: #0a0a14;
        }

        /* Layered gradient mesh background */
        .fp-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 10%, #1a0533 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 80%, #05102e 0%, transparent 60%),
            radial-gradient(ellipse 70% 70% at 50% 50%, #0d0826 0%, transparent 80%);
          z-index: 0;
        }

        /* Animated aurora orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.35;
          animation: float 8s ease-in-out infinite;
          z-index: 0;
        }

        .orb-1 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #7c3aed, #4f46e5);
          top: -120px;
          left: -100px;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, #06b6d4, #3b82f6);
          bottom: -100px;
          right: -80px;
          animation-delay: -3s;
        }

        .orb-3 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, #ec4899, #8b5cf6);
          top: 50%;
          left: 60%;
          animation-delay: -5s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }

        /* Grain overlay */
        .grain {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.4;
          z-index: 1;
          pointer-events: none;
        }

        .fp-card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 420px;
          margin: 1rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 48px 40px;
          backdrop-filter: blur(24px);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.05) inset,
            0 32px 80px rgba(0,0,0,0.5),
            0 0 120px rgba(124, 58, 237, 0.08);
          animation: cardIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .fp-icon {
          width: 52px;
          height: 52px;
          margin: 0 auto 24px;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(124, 58, 237, 0.4);
        }

        .fp-icon svg {
          width: 24px;
          height: 24px;
          color: white;
        }

        .fp-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: #ffffff;
          text-align: center;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }

        .fp-subtitle {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.45);
          text-align: center;
          margin-bottom: 32px;
          line-height: 1.5;
        }

        .fp-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 500;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .fp-input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          box-sizing: border-box;
        }

        .fp-input::placeholder {
          color: rgba(255,255,255,0.25);
        }

        .fp-input:focus {
          border-color: rgba(124, 58, 237, 0.6);
          background: rgba(255,255,255,0.08);
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
        }

        .fp-btn {
          width: 100%;
          margin-top: 20px;
          padding: 15px;
          background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
          box-shadow: 0 8px 24px rgba(124, 58, 237, 0.35);
          letter-spacing: 0.01em;
        }

        .fp-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 32px rgba(124, 58, 237, 0.45);
        }

        .fp-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .fp-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .fp-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .fp-btn:hover::after {
          opacity: 1;
        }

        .fp-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .fp-success {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.25);
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 20px;
          color: #4ade80;
          font-size: 0.875rem;
          animation: fadeIn 0.4s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .fp-back {
          display: block;
          text-align: center;
          margin-top: 24px;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.35);
          text-decoration: none;
          transition: color 0.2s;
          cursor: pointer;
          background: none;
          border: none;
          width: 100%;
        }

        .fp-back:hover {
          color: rgba(255,255,255,0.7);
        }

        .fp-divider {
          height: 1px;
          background: rgba(255,255,255,0.07);
          margin: 28px 0 0;
        }
      `}</style>

      <div className="fp-root">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="grain" />

        <div className="fp-card">
          <div className="fp-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>

          <h1 className="fp-title">Forgot Password?</h1>
          <p className="fp-subtitle">No worries — enter your email and we'll send a reset link right away.</p>

          {message && (
            <div className="fp-success">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label className="fp-label">Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="fp-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={sent}
            />

            <button className="fp-btn" type="submit" disabled={loading || sent}>
              {loading ? (
                <><span className="fp-spinner" />Sending…</>
              ) : sent ? (
                "✓ Link Sent"
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          <div className="fp-divider" />
          <button className="fp-back" onClick={() => router.push("/login")}>
            ← Back to login
          </button>
        </div>
      </div>
    </>
  );
}