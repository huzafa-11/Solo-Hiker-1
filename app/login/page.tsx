
"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginSchema } from "@/src/lib/validators/login";

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setServerError("");
    setErrors({});

    // CLIENT-SIDE ZOD VALIDATION
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      const res = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (res?.error) {
        setServerError("Invalid email or password. Please try again.");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .login-root {
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
          background-image: url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80');
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

        .stats-row {
          display: flex;
          gap: 32px;
        }

        .stat-item { display: flex; flex-direction: column; gap: 4px; }

        .stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 700;
          color: #fff;
        }

        .stat-label {
          font-size: 11px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
        }

        /* ---- RIGHT PANEL - form ---- */
        .right-panel {
          width: 480px;
          min-height: 100vh;
          background: #f8f7f4;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 52px;
          position: relative;
          overflow: hidden;
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
          margin-bottom: 40px;
        }

        .form-subtitle a {
          color: #16a34a;
          font-weight: 600;
          text-decoration: none;
          position: relative;
        }

        .form-subtitle a::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 0;
          height: 1px;
          background: #16a34a;
          transition: width 0.3s;
        }
        .form-subtitle a:hover::after { width: 100%; }

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

        .field-wrapper {
          position: relative;
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

        .field-input.has-error {
          border-color: #ef4444;
          box-shadow: 0 0 0 4px rgba(239,68,68,0.06);
        }

        .field-input::placeholder { color: #b4c2ce; }

        .eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #8a9aac;
          cursor: pointer;
          font-size: 18px;
          transition: color 0.2s;
          padding: 0;
          line-height: 1;
        }
        .eye-btn:hover { color: #0b1f2c; }

        .field-error {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 6px;
          font-size: 12px;
          color: #ef4444;
          font-weight: 500;
        }

        .server-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .forgot-row {
          display: flex;
          justify-content: flex-end;
          margin-top: -8px;
          margin-bottom: 28px;
        }

        .forgot-link {
          font-size: 13px;
          color: #16a34a;
          text-decoration: none;
          font-weight: 600;
          transition: opacity 0.2s;
        }
        .forgot-link:hover { opacity: 0.7; }

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

        .divider {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 28px 0;
          color: #b4c2ce;
          font-size: 12px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .divider-line { flex: 1; height: 1px; background: #e2e8f0; }

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
            min-height: 100vh;
          }
          .right-panel::before { display: none; }
        }
      `}</style>

      <div className="login-root">
        {/* LEFT - Mountain Background */}
        <div className="left-panel">
          <div className="left-content">
            <div className="brand-tag">
              🏔 <span>Solo</span>-Hiker
            </div>
            <h1 className="left-headline">
              Find Your <em>Trail</em>,<br />Find Your Tribe.
            </h1>
            <p className="left-sub">
              Connect with fellow hikers, plan group treks, and
              discover Pakistan's most breathtaking routes — together.
            </p>
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-num">2.4K</span>
                <span className="stat-label">Active Hikers</span>
              </div>
              <div className="stat-item">
                <span className="stat-num">380+</span>
                <span className="stat-label">Trails Mapped</span>
              </div>
              <div className="stat-item">
                <span className="stat-num">98%</span>
                <span className="stat-label">Safe Returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT - Form */}
        <div className="right-panel">
          <div className="form-container">
            <p className="form-eyebrow">Welcome back</p>
            <h2 className="form-title">Sign In</h2>
            <p className="form-subtitle">
              No account?{" "}
              <Link href="/register">Create one free →</Link>
            </p>

            {serverError && (
              <div className="server-error">⚠ {serverError}</div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div className="field-group">
                <label className="field-label" htmlFor="email">
                  Email Address
                </label>
                <div className="field-wrapper">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className={`field-input ${errors.email ? "has-error" : ""}`}
                  />
                </div>
                {errors.email && (
                  <p className="field-error">⚠ {errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="field-group">
                <label className="field-label" htmlFor="password">
                  Password
                </label>
                <div className="field-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Your password"
                    className={`field-input ${errors.password ? "has-error" : ""}`}
                    style={{ paddingRight: "44px" }}
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password"
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
                {errors.password && (
                  <p className="field-error">⚠ {errors.password}</p>
                )}
              </div>

              <div className="forgot-row">
                <Link href="/forget-pass" className="forgot-link">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={isLoading}
              >
                <span className="btn-content">
                  {isLoading ? (
                    <>
                      <span className="spinner" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In →"
                  )}
                </span>
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
