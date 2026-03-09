"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [showEmailVerification, setShowEmailVerification] = useState(true);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Set greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Guten Morgen");
    else if (hour < 17) setGreeting("Guten Tag");
    else setGreeting("Guten Abend");
  }, []);

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ callbackUrl: "/login", redirect: true });
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  const handleSendVerification = async () => {
    setSendingEmail(true);
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setEmailSent(true);
    setSendingEmail(false);
  };

  const userInitial = session?.user?.name?.[0]?.toUpperCase() || 
                      session?.user?.email?.[0]?.toUpperCase() || "U";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .dashboard-root { min-height: 100vh; font-family: 'DM Sans', sans-serif; position: relative; overflow: hidden; background: linear-gradient(180deg, #0b1f2c 0%, #1a3a50 100%); }
        .bg-mountain { position: fixed; inset: 0; background-image: url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80'); background-size: cover; background-position: center; opacity: 0.15; animation: slowZoom 20s ease-in-out infinite alternate; z-index: 0; }
        @keyframes slowZoom { from { transform: scale(1.05); } to { transform: scale(1.15); } }
        .bg-overlay { position: fixed; inset: 0; background: linear-gradient(135deg, rgba(11,31,44,0.95) 0%, rgba(11,31,44,0.85) 50%, rgba(11,31,44,0.95) 100%); z-index: 1; }
        .navbar { position: relative; z-index: 20; background: rgba(8,20,35,0.8); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.1); padding: 1rem 2rem; animation: slideDown 0.6s ease; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .nav-container { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
        .nav-brand { display: flex; align-items: center; gap: 0.5rem; font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 900; color: #fff; }
        .nav-brand span { color: #86efac; }
        .nav-actions { display: flex; align-items: center; gap: 1rem; }
        .nav-btn { padding: 0.5rem 1rem; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; color: rgba(255,255,255,0.9); font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem; text-decoration: none; }
        .nav-btn:hover { background: rgba(134,239,172,0.15); border-color: rgba(134,239,172,0.4); }
        .logout-btn { padding: 0.5rem 1rem; background: rgba(239,68,68,0.8); border: none; border-radius: 10px; color: #fff; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem; font-family: 'DM Sans', sans-serif; }
        .logout-btn:hover { background: rgba(239,68,68,1); transform: translateY(-1px); }
        .logout-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .nav-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #86efac, #16a34a); color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; border: 2px solid rgba(134,239,172,0.4); box-shadow: 0 0 20px rgba(134,239,172,0.3); }
        .main-content { position: relative; z-index: 10; max-width: 900px; margin: 0 auto; padding: 2.5rem 1.5rem; animation: fadeUp 0.8s ease 0.2s both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .verify-banner { background: linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.15)); border: 1px solid rgba(251,191,36,0.3); border-radius: 16px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; backdrop-filter: blur(10px); animation: slideIn 0.5s ease; }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        .verify-content { display: flex; align-items: center; gap: 1rem; }
        .verify-icon { font-size: 2rem; animation: bounce 2s infinite; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .verify-text h3 { font-size: 0.95rem; font-weight: 700; color: #fbbf24; margin-bottom: 0.25rem; }
        .verify-text p { font-size: 0.8rem; color: rgba(255,255,255,0.7); }
        .verify-btn { padding: 0.6rem 1.2rem; background: #fbbf24; color: #0b1f2c; border: none; border-radius: 10px; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; white-space: nowrap; }
        .verify-btn:hover { background: #f59e0b; transform: translateY(-1px); }
        .verify-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .hero-card { background: rgba(8,20,35,0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 2rem; margin-bottom: 1.5rem; backdrop-filter: blur(20px); box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
        .hero-header { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; }
        .hero-avatar { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #86efac, #16a34a); color: #fff; font-size: 2rem; font-weight: 900; display: flex; align-items: center; justify-content: center; border: 3px solid rgba(134,239,172,0.4); box-shadow: 0 0 30px rgba(134,239,172,0.3); animation: float 3s ease-in-out infinite; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .hero-info { flex: 1; }
        .greeting { font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; color: #86efac; font-weight: 600; margin-bottom: 0.25rem; }
        .hero-name { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 900; color: #fff; margin-bottom: 0.25rem; letter-spacing: -0.02em; }
        .hero-email { font-size: 0.85rem; color: rgba(255,255,255,0.6); }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .stat-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.25rem; text-align: center; transition: all 0.3s; }
        .stat-card:hover { background: rgba(255,255,255,0.08); transform: translateY(-2px); }
        .stat-icon { font-size: 2rem; margin-bottom: 0.5rem; }
        .stat-value { font-family: 'Playfair Display', serif; font-size: 1.75rem; font-weight: 700; color: #fff; margin-bottom: 0.25rem; }
        .stat-label { font-size: 0.7rem; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.5); font-weight: 500; }
        .action-grid { display: grid; gap: 1rem; }
        .action-card { background: rgba(8,20,35,0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: 1.25rem; cursor: pointer; transition: all 0.3s; backdrop-filter: blur(20px); text-decoration: none; }
        .action-card:hover { border-color: rgba(134,239,172,0.4); transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.4); }
        .action-icon-wrap { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .action-text { flex: 1; }
        .action-title { font-size: 1rem; font-weight: 600; color: rgba(255,255,255,0.9); margin-bottom: 0.25rem; }
        .action-subtitle { font-size: 0.8rem; color: rgba(255,255,255,0.5); }
        .action-arrow { color: rgba(255,255,255,0.3); }
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .navbar { padding: 1rem; } .nav-container { flex-direction: column; gap: 1rem; } .main-content { padding: 1.5rem 1rem; } .hero-header { flex-direction: column; text-align: center; } .stats-grid { grid-template-columns: 1fr; } .verify-banner { flex-direction: column; gap: 1rem; } }
      `}</style>

      <div className="dashboard-root">
        <div className="bg-mountain" />
        <div className="bg-overlay" />

        <nav className="navbar">
          <div className="nav-container">
            <div className="nav-brand">🏔 Solo<span>-Hiker</span></div>
            <div className="nav-actions">
              <Link href="/profile" className="nav-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Complete Profile
              </Link>
              <button onClick={handleLogout} disabled={isLoggingOut} className="logout-btn">
                {isLoggingOut ? <><div className="spinner" />Logging out...</> : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>Logout</>}
              </button>
              <div className="nav-avatar">{userInitial}</div>
            </div>
          </div>
        </nav>
       <main className="main-content">
          {showEmailVerification && !emailSent && (
            <div className="verify-banner">
              <div className="verify-content">
                <span className="verify-icon">📧</span>
                <div className="verify-text">
                  <h3>Verify Your Email</h3>
                  <p>Please verify your email to unlock all features</p>
                </div>
              </div>
              <button onClick={handleSendVerification} disabled={sendingEmail} className="verify-btn">
                {sendingEmail ? "Sending..." : "Send Verification"}
              </button>
            </div>
          )}             
          <div className="hero-card">
            <div className="hero-header">
              <div className="hero-avatar">{userInitial}</div>
              <div className="hero-info">
                <p className="greeting">{greeting},</p>
                <h1 className="hero-name">{session?.user?.name || "Hiker"}</h1>
                <p className="hero-email">{session?.user?.email}</p>
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-icon">🥾</div><div className="stat-value">0</div><div className="stat-label">Trails</div></div>
              <div className="stat-card"><div className="stat-icon">⛰️</div><div className="stat-value">0</div><div className="stat-label">Elevation</div></div>
              <div className="stat-card"><div className="stat-icon">📍</div><div className="stat-value">0</div><div className="stat-label">Locations</div></div>
            </div>
          </div>

          <div className="action-grid">
            <Link href="/profile" className="action-card">
              <div className="action-icon-wrap" style={{ background: 'rgba(134,239,172,0.15)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </div>
              <div className="action-text"><div className="action-title">Complete Profile</div><div className="action-subtitle">Add CNIC & hiking level</div></div>
              <svg className="action-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </Link>
            <div className="action-card">
              <div className="action-icon-wrap" style={{ background: 'rgba(96,165,250,0.15)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
              </div>
              <div className="action-text"><div className="action-title">My Trails</div><div className="action-subtitle">Browse saved routes</div></div>
              <svg className="action-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </div>
            <div className="action-card">
              <div className="action-icon-wrap" style={{ background: 'rgba(251,146,60,0.15)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              </div>
              <div className="action-text"><div className="action-title">Safety Info</div><div className="action-subtitle">Emergency contacts & tips</div></div>
              <svg className="action-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}