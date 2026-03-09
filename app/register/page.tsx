"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerSchema } from "@/src/lib/validators/register";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFieldErrors({});
    setServerError("");

    // CLIENT-SIDE ZOD VALIDATION
    const result = registerSchema.safeParse({
      name: formData.name,
      email: formData.email,
      age: Number(formData.age),
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setFieldErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          age: Number(formData.age),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        // Handle field-specific errors
        if (data.error && Array.isArray(data.error)) {
          const errors: Record<string, string> = {};
          data.error.forEach((err: any) => {
            if (err.path && err.path[0]) {
              errors[err.path[0]] = err.message;
            }
          });
          setFieldErrors(errors);
          setServerError("Please fix the errors below");
        } else if (data.message) {
          setServerError(data.message);
        } else {
          setServerError("Registration failed. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      // Success! Show congratulations screen
      setShowSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error) {
      setServerError("Unable to connect. Please try again.");
      setIsLoading(false);
    }
  };

  // SUCCESS SCREEN
  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 animate-bounce">
              <span className="text-5xl">🎉</span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Congratulations!
          </h1>

          <p className="text-lg text-gray-600 mb-2">
            Welcome to <span className="font-bold text-green-600">Solo-Hiker</span>
          </p>

          <p className="text-gray-500 mb-6">
            Your account has been created successfully.
          </p>

          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center mb-3">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {formData.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <p className="font-semibold text-gray-800">{formData.name}</p>
            <p className="text-sm text-gray-600">{formData.email}</p>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Redirecting to login page in a moment...
          </p>

          <div className="flex justify-center gap-1 mb-6">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
          </div>

          <Link
            href="/login"
            className="text-green-600 hover:text-green-700 font-semibold text-sm underline"
          >
            Go to Login Now →
          </Link>
        </div>
      </div>
    );
  }

  // REGISTRATION FORM
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .register-root {
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

        .field-group { margin-bottom: 18px; }

        .field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 18px;
        }

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

        .field-hint {
          font-size: 11px;
          color: #8a9aac;
          margin-top: 5px;
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
          .field-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="register-root">
        {/* LEFT - Mountain Background */}
        <div className="left-panel">
          <div className="left-content">
            <div className="brand-tag">
              🏔 <span>Solo</span>-Hiker
            </div>
            <h1 className="left-headline">
              Start Your <em>Adventure</em>,<br />Join the Community.
            </h1>
            <p className="left-sub">
              Create your account and connect with thousands of hikers
              exploring Pakistan's most stunning mountain trails.
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
            <p className="form-eyebrow">Get Started</p>
            <h2 className="form-title">Create Account</h2>
            <p className="form-subtitle">
              Already a member?{" "}
              <Link href="/login">Sign in here →</Link>
            </p>

            {serverError && (
              <div className="server-error">⚠ {serverError}</div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Name + Age Row */}
              <div className="field-row">
                <div className="field-group">
                  <label className="field-label" htmlFor="name">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className={`field-input ${fieldErrors.name ? "has-error" : ""}`}
                  />
                  {fieldErrors.name && (
                    <p className="field-error">⚠ {fieldErrors.name}</p>
                  )}
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="age">
                    Age
                  </label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="18"
                    min="18"
                    max="100"
                    className={`field-input ${fieldErrors.age ? "has-error" : ""}`}
                  />
                  {fieldErrors.age && (
                    <p className="field-error">⚠ {fieldErrors.age}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="field-group">
                <label className="field-label" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`field-input ${fieldErrors.email ? "has-error" : ""}`}
                />
                {fieldErrors.email && (
                  <p className="field-error">⚠ {fieldErrors.email}</p>
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
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create strong password"
                    className={`field-input ${fieldErrors.password ? "has-error" : ""}`}
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
                {fieldErrors.password && (
                  <p className="field-error">⚠ {fieldErrors.password}</p>
                )}
                {!fieldErrors.password && (
                  <p className="field-hint">
                    Min 8 chars, one uppercase, lowercase, and number
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="field-group">
                <label className="field-label" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="field-wrapper">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat your password"
                    className={`field-input ${fieldErrors.confirmPassword ? "has-error" : ""}`}
                    style={{ paddingRight: "44px" }}
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label="Toggle confirm password"
                  >
                    {showConfirm ? "🙈" : "👁"}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="field-error">⚠ {fieldErrors.confirmPassword}</p>
                )}
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
                      Creating account...
                    </>
                  ) : (
                    "Create Account →"
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