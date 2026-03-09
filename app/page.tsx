"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // If user is logged in, redirect to dashboard
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  // While checking session, show loading
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        /* ANIMATED CLOUDS */
        @keyframes float {
          0%, 100% {
            transform: translateX(0) translateY(0);
          }
          50% {
            transform: translateX(30px) translateY(-10px);
          }
        }

        @keyframes float-slow {
          0%, 100% {
            transform: translateX(0) translateY(0);
          }
          50% {
            transform: translateX(-40px) translateY(-15px);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .cloud {
          animation: float 20s ease-in-out infinite;
        }

        .cloud-slow {
          animation: float-slow 30s ease-in-out infinite;
        }

        .fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>

      <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-blue-400 via-blue-300 to-blue-100">
        {/* NAVBAR */}
        <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-4 fade-in">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <span className="text-3xl">🏔️</span>
              <span className="text-2xl font-bold text-white drop-shadow-lg">
                Solo-Hiker
              </span>
            </div>

            {/* Sign In Button */}
            <Link
              href="/login"
              className="bg-white text-gray-800 px-6 py-2.5 rounded-full font-semibold hover:bg-gray-100 transition shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Sign In
            </Link>
          </div>
        </nav>

        {/* ANIMATED CLOUDS */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Cloud 1 */}
          <div className="cloud absolute top-20 left-10 opacity-70">
            <svg width="100" height="50" viewBox="0 0 100 50">
              <ellipse cx="25" cy="35" rx="25" ry="15" fill="white" />
              <ellipse cx="45" cy="30" rx="30" ry="18" fill="white" />
              <ellipse cx="70" cy="35" rx="25" ry="15" fill="white" />
            </svg>
          </div>

          {/* Cloud 2 */}
          <div className="cloud-slow absolute top-40 right-20 opacity-60">
            <svg width="120" height="60" viewBox="0 0 120 60">
              <ellipse cx="30" cy="40" rx="30" ry="18" fill="white" />
              <ellipse cx="60" cy="35" rx="35" ry="20" fill="white" />
              <ellipse cx="85" cy="40" rx="30" ry="18" fill="white" />
            </svg>
          </div>

          {/* Cloud 3 */}
          <div className="cloud absolute top-32 left-1/2 opacity-50">
            <svg width="80" height="40" viewBox="0 0 80 40">
              <ellipse cx="20" cy="28" rx="20" ry="12" fill="white" />
              <ellipse cx="40" cy="25" rx="25" ry="15" fill="white" />
              <ellipse cx="60" cy="28" rx="20" ry="12" fill="white" />
            </svg>
          </div>

          {/* Cloud 4 */}
          <div className="cloud-slow absolute top-52 left-1/4 opacity-70">
            <svg width="90" height="45" viewBox="0 0 90 45">
              <ellipse cx="22" cy="32" rx="22" ry="13" fill="white" />
              <ellipse cx="45" cy="28" rx="28" ry="17" fill="white" />
              <ellipse cx="68" cy="32" rx="22" ry="13" fill="white" />
            </svg>
          </div>

          {/* Cloud 5 */}
          <div className="cloud absolute top-64 right-1/3 opacity-60">
            <svg width="110" height="55" viewBox="0 0 110 55">
              <ellipse cx="28" cy="38" rx="28" ry="17" fill="white" />
              <ellipse cx="55" cy="33" rx="33" ry="19" fill="white" />
              <ellipse cx="80" cy="38" rx="28" ry="17" fill="white" />
            </svg>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 text-center">
          <div className="fade-in mb-8">
            <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-2xl mb-4">
              Find Your Trail,
              <br />
              <span className="text-yellow-300">Find Your Tribe</span>
            </h1>
            <p className="text-xl md:text-2xl text-white drop-shadow-lg max-w-2xl mx-auto mb-8">
              Connect with fellow hikers, plan group treks, and discover
              Pakistan's most breathtaking mountain trails
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/register"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition"
              >
                Start Your Journey
              </Link>
              <Link
                href="/login"
                className="bg-white hover:bg-gray-100 text-gray-800 px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition"
              >
                I Have an Account
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto fade-in">
            <div className="text-center">
              <div className="text-4xl font-bold text-white drop-shadow-lg">
                2.4K+
              </div>
              <div className="text-white drop-shadow mt-1">Active Hikers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white drop-shadow-lg">
                380+
              </div>
              <div className="text-white drop-shadow mt-1">Trails Mapped</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white drop-shadow-lg">
                98%
              </div>
              <div className="text-white drop-shadow mt-1">Safe Returns</div>
            </div>
          </div>
        </div>

        {/* MOUNTAIN IMAGE AT BOTTOM */}
        <div className="absolute bottom-0 left-0 right-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80"
            alt="Mountain"
            className="w-full h-96 object-cover opacity-80"
            style={{
              maskImage: "linear-gradient(to top, black 50%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to top, black 50%, transparent 100%)",
            }}
          />
        </div>
      </div>
    </>
  );
}
