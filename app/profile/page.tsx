"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    cnic: "",
    hikingLevel: "BEGINNER",
  });

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Show loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setMessage("Profile updated successfully! 🎉");
        setMessageType("success");
      } else {
        setMessage(data.error || "Something went wrong");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Unable to update profile. Please try again.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  // Get user's first letter for avatar
  const userInitial = session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || "U";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .profile-root {
          min-height: 100vh;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* ---- LEFT PANEL - mountain bg ---- */
        .left-panel {
          flex: 1;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 48px;
          overflow: hidden;
        }

        .left-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80');
          background-size: cover;
          background-position: center;
          transform: scale(1.05);
          animation: slowZoom 20s ease-in-out infinite alternate;
          z-index: 0;
        }

        .left-panel::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            160deg,
            rgba(11,31,44,0.3) 0%,
            rgba(11,31,44,0.75) 60%,
            rgba(11,31,44,0.95) 100%
          );
          z-index: 1;
        }

        @keyframes slowZoom {
          from { transform: scale(1.05) translateY(0); }
          to   { transform: scale(1.15) translateY(-20px); }
        }

        .left-content {
          position: relative;
          z-index: 2;
          color: #fff;
          opacity: 0;
          transform: translateY(30px);
          animation: fadeUp 0.9s ease forwards 0.3s;
        }

        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
        }

        .brand-tag {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          backdrop-filter: blur(8px);
          padding: 8px 18px;
          border-radius: 40px;
          font-size: 13px;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 28px;
          font-weight: 500;
        }

        .brand-tag span { color: #86efac; }

        .left-headline {
          font-family: 'Playfair Display', serif;
          font-size: clamp(36px, 4vw, 56px);
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 18px;
          letter-spacing: -1px;
        }

        .left-headline em {
          font-style: italic;
          color: #86efac;
        }

        .left-sub {
          font-size: 15px;
          color: rgba(255,255,255,0.65);
          line-height: 1.7;
          max-width: 380px;
          margin-bottom: 36px;
        }

        .user-card {
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 16px;
          padding: 24px;
          margin-top: 24px;
        }

        .user-avatar {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #86efac, #16a34a);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          font-weight: 900;
          color: #fff;
          margin-bottom: 16px;
          box-shadow: 0 4px 20px rgba(134,239,172,0.4);
        }

        .user-name {
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 6px;
        }

        .user-email {
          font-size: 14px;
          color: rgba(255,255,255,0.7);
        }

        /* ---- RIGHT PANEL - form ---- */
        .right-panel {
          width: 520px;
          min-height: 100vh;
          background: #f8f7f4;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 52px;
          position: relative;
          overflow: hidden;
          overflow-y: auto;
        }

        .right-panel::before {
          content: '';
          position: absolute;
          top: -80px;
          right: -80px;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(134,239,172,0.15), transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .form-container {
          position: relative;
          opacity: 0;
          transform: translateX(20px);
          animation: slideIn 0.8s ease forwards 0.5s;
        }

        @keyframes slideIn {
          to { opacity: 1; transform: translateX(0); }
        }

        .form-eyebrow {
          font-size: 11px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #86efac;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .form-title {
          font-family: 'Playfair Display', serif;
          font-size: 36px;
          font-weight: 900;
          color: #0b1f2c;
          margin-bottom: 6px;
          letter-spacing: -0.5px;
        }

        .form-subtitle {
          font-size: 14px;
          color: #8a9aac;
          margin-bottom: 32px;
        }

        .success-message {
          background: #f0fdf4;
          border: 1px solid #86efac;
          color: #15803d;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 20px;
          font-weight: 600;
          animation: slideDown 0.3s ease;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 20px;
          font-weight: 500;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .field-group { margin-bottom: 20px; }

        .field-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          color: #3d5a6e;
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .field-input {
          width: 100%;
          padding: 14px 16px;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          color: #0b1f2c;
          transition: all 0.25s;
          outline: none;
          appearance: none;
        }

        .field-input:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 4px rgba(22,163,74,0.08);
          transform: translateY(-1px);
        }

        .field-select {
          width: 100%;
          padding: 14px 16px;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          color: #0b1f2c;
          transition: all 0.25s;
          outline: none;
          cursor: pointer;
        }

        .field-select:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 4px rgba(22,163,74,0.08);
        }

        .field-hint {
          font-size: 11px;
          color: #8a9aac;
          margin-top: 5px;
        }

        .submit-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(22,163,74,0.35);
          margin-top: 24px;
        }

        .submit-btn::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }
        .submit-btn:hover::before { left: 100%; }
        .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(22,163,74,0.45); }
        .submit-btn:active { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

        .btn-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .logout-btn {
          width: 100%;
          padding: 14px;
          background: transparent;
          color: #ef4444;
          border: 2px solid #ef4444;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 16px;
        }

        .logout-btn:hover {
          background: #ef4444;
          color: #fff;
        }

        .bottom-nav {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e9eef3;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nav-brand {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 700;
          color: #0b1f2c;
          letter-spacing: -0.3px;
        }

        .nav-brand span { color: #16a34a; }

        /* MOBILE */
        @media (max-width: 768px) {
          .left-panel { display: none; }
          .right-panel {
            width: 100%;
            padding: 40px 28px;
          }
          .right-panel::before { display: none; }
        }
      `}</style>

      <div className="profile-root">
        {/* LEFT - Mountain Background */}
        <div className="left-panel">
          <div className="left-content">
            <div className="brand-tag">
              🏔 <span>Solo</span>-Hiker
            </div>
            <h1 className="left-headline">
              Your <em>Journey</em>,<br />Your Profile.
            </h1>
            <p className="left-sub">
              Complete your profile to unlock the full Solo-Hiker experience
              and connect with fellow adventurers.
            </p>

            {/* User Card */}
            <div className="user-card">
              <div className="user-avatar">{userInitial}</div>
              <div className="user-name">{session?.user?.name || "Hiker"}</div>
              <div className="user-email">{session?.user?.email}</div>
            </div>
          </div>
        </div>

        {/* RIGHT - Form */}
        <div className="right-panel">
          <div className="form-container">
            <p className="form-eyebrow">Complete Your Profile</p>
            <h2 className="form-title">Profile Settings</h2>
            <p className="form-subtitle">
              Add your details to enhance your hiking experience
            </p>

            {/* Success/Error Messages */}
            {message && (
              <div className={messageType === "success" ? "success-message" : "error-message"}>
                {messageType === "success" ? "✅" : "⚠"} {message}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* CNIC Field */}
              <div className="field-group">
                <label className="field-label" htmlFor="cnic">
                  CNIC Number
                </label>
                <input
                  id="cnic"
                  type="text"
                  value={formData.cnic}
                  onChange={(e) => handleChange("cnic", e.target.value)}
                  placeholder="12345-1234567-1"
                  className="field-input"
                />
                <p className="field-hint">
                  Required format: XXXXX-XXXXXXX-X (for verification)
                </p>
              </div>

              {/* Hiking Level */}
              <div className="field-group">
                <label className="field-label" htmlFor="hikingLevel">
                  Hiking Experience Level
                </label>
                <select
                  id="hikingLevel"
                  value={formData.hikingLevel}
                  onChange={(e) => handleChange("hikingLevel", e.target.value)}
                  className="field-select"
                >
                  <option value="BEGINNER">🌱 Beginner - New to hiking</option>
                  <option value="INTERMEDIATE">⛰ Intermediate - Some experience</option>
                  <option value="ADVANCED">🏔 Advanced - Experienced hiker</option>
                </select>
                <p className="field-hint">
                  Help us match you with suitable trails and groups
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="submit-btn"
                disabled={isLoading}
              >
                <span className="btn-content">
                  {isLoading ? (
                    <>
                      <span className="spinner" />
                      Updating...
                    </>
                  ) : (
                    "Save Profile →"
                  )}
                </span>
              </button>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="logout-btn"
              >
                🚪 Logout
              </button>
            </form>

            <div className="bottom-nav">
              <span className="nav-brand">
                Solo<span>-</span>Hiker
              </span>
              <Link href="/" style={{ fontSize: "13px", color: "#8a9aac", textDecoration: "none" }}>
                ← Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}