import type { Route } from "./+types/home";
import { Link } from "react-router";
import { AuthService } from "../utils/auth";
import { useEffect, useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Secure E-Voting Platform" },
    { name: "description", content: "A secure electronic voting platform" },
  ];
}

export default function Home() {
  // Use state to handle client-side only rendering
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ username?: string } | null>(null);

  useEffect(() => {
    // This will only run on the client side
    setIsAuthenticated(AuthService.isAuthenticated());
    setUser(AuthService.getUser());
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg"></div>
              <span className="text-xl font-bold text-gray-800">E-Vote</span>
            </div>

            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-gray-600">
                    Welcome, {user?.username}
                  </span>
                  <div className="relative">
                    <Link
                      to="/verify-identity"
                      className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition flex items-center"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      Verify Identity
                    </Link>
                  </div>
                  <Link
                    to="/dashboard"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      AuthService.clearTokens();
                      window.location.href = "/";
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-indigo-600 hover:text-indigo-800 transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Secure, Transparent, and
            <span className="text-indigo-600"> Accessible</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            A revolutionary electronic voting platform that ensures security,
            transparency, and accessibility for every vote.
          </p>

          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-4 bg-indigo-600 text-white text-lg font-medium rounded-lg hover:bg-indigo-700 transition shadow-lg"
              >
                Create Account
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 bg-white text-indigo-600 text-lg font-medium rounded-lg hover:bg-gray-50 transition shadow-lg border border-gray-200"
              >
                Sign In to Vote
              </Link>
            </div>
          )}

          {isAuthenticated && (
            <div className="mt-8 justify-center flex gap-4">
              <Link
                to="/dashboard"
                className="px-8 py-4 bg-green-600 text-white text-lg font-medium rounded-lg hover:bg-green-700 transition shadow-lg"
              >
                Go to Voting Dashboard
              </Link>
              <Link
                to="/results"
                className="px-8 py-4 bg-cyan-600 text-white text-lg font-medium rounded-lg hover:bg-cyan-700 transition shadow-lg"
              >
                Go to Results Dashboard
              </Link>
            </div>
            
          )}
        </div>

        {/* Features Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Military-Grade Security
            </h3>
            <p className="text-gray-600">
              End-to-end encryption and blockchain technology ensure your vote
              remains confidential and tamper-proof.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">👁️</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Full Transparency
            </h3>
            <p className="text-gray-600">
              Verifiable voting records allow independent audit while
              maintaining voter anonymity.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📱</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Accessible Anywhere
            </h3>
            <p className="text-gray-600">
              Vote from any device, anywhere. Designed for accessibility with
              support for screen readers and keyboard navigation.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-20 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Register",
                desc: "Create your secure account",
              },
              {
                step: "2",
                title: "Verify",
                desc: "Complete identity verification",
              },
              { step: "3", title: "Vote", desc: "Cast your vote securely" },
              {
                step: "4",
                title: "Verify Vote",
                desc: "Confirm your vote was counted",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h4 className="font-bold text-lg text-gray-900 mb-2">
                  {item.title}
                </h4>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 bg-indigo-600 rounded-2xl p-8 text-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold">99.9%</div>
              <div className="text-indigo-200">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold">256-bit</div>
              <div className="text-indigo-200">Encryption</div>
            </div>
            <div>
              <div className="text-3xl font-bold">Zero</div>
              <div className="text-indigo-200">Fraud Cases</div>
            </div>
            <div>
              <div className="text-3xl font-bold">24/7</div>
              <div className="text-indigo-200">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-400">
              © 2024 Secure E-Voting Platform. All rights reserved.
            </p>
            <p className="text-gray-400 mt-2 text-sm">
              This is a secure platform for authorized voting purposes only.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
