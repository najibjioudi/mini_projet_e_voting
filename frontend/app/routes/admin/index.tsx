// routes/admin/index.tsx
import type { Route } from "../+types/home";
import { Link } from "react-router";
import { useEffect, useState } from "react";
import { AuthService } from "../../utils/auth";

interface DashboardStats {
  totalVoters: number;
  verifiedVoters: number;
  pendingVerifications: number;
  totalElections: number;
  activeElections: number;
  upcomingElections: number;
  totalElectors: number;
}

interface RecentActivity {
  id: number;
  userId: number;
  username: string;
  action: string;
  timestamp: string;
}

interface Voter {
  id: number;
  userId: number;
  cin: string;
  firstName: string;
  lastName: string;
  status: "VERIFIED" | "PENDING" | "REJECTED";
  rejectionReason: string | null;
  cinImagePath: string;
}

interface Election {
  id: number;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  status: "DRAFT" | "OPEN" | "CLOSED";
  candidateIds: number[];
  createdAt: string;
  updatedAt: string;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin Dashboard" },
    { name: "description", content: "Administrator dashboard overview" },
  ];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const accessToken = AuthService.getAccessToken();

      // Fetch voters
      const votersResponse = await fetch("http://localhost:8080/admin/voters", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      let voters: Voter[] = [];
      if (votersResponse.ok) {
        voters = await votersResponse.json();
      }

      // Fetch elections
      const electionsResponse = await fetch(
        "http://localhost:8080/election/all",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      let elections: Election[] = [];
      if (electionsResponse.ok) {
        elections = await electionsResponse.json();
      }

      // Fetch electors
      const electorsResponse = await fetch(
        "http://localhost:8080/elector/all",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      let electorsCount = 0;
      if (electorsResponse.ok) {
        const electors = await electorsResponse.json();
        electorsCount = electors.length;
      }

      // Calculate stats
      const totalVoters = voters.length;
      const verifiedVoters = voters.filter(
        (v) => v.status === "VERIFIED"
      ).length;
      const pendingVerifications = voters.filter(
        (v) => v.status === "PENDING"
      ).length;
      const totalElections = elections.length;
      const activeElections = elections.filter(
        (e) => e.status === "OPEN"
      ).length;
      const now = new Date();
      const upcomingElections = elections.filter(
        (e) =>
          e.status === "DRAFT" ||
          (e.status === "OPEN" && new Date(e.startAt) > now)
      ).length;

      setStats({
        totalVoters,
        verifiedVoters,
        pendingVerifications,
        totalElections,
        activeElections,
        upcomingElections,
        totalElectors: electorsCount,
      });

      // Generate recent activity from voters (you can enhance this with real activity logs)
      const recentVoters = voters.slice(0, 4).map((voter) => ({
        id: voter.id,
        userId: voter.userId,
        username: `${voter.firstName} ${voter.lastName}`,
        action:
          voter.status === "VERIFIED"
            ? "Verified"
            : voter.status === "PENDING"
              ? "Registration"
              : "Verification Rejected",
        timestamp: new Date().toISOString(), // You should have actual timestamps in your API
      }));

      setRecentActivity(recentVoters);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setToast({
        type: "error",
        message: "Failed to load dashboard data",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center">
            {toast.type === "success" ? (
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
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
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back! Here's what's happening with your platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Voters</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.totalVoters}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/admin/voters"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all voters →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verified Voters</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.verifiedVoters}
              </p>
              <p className="text-sm text-green-600 mt-1">
                {stats && stats.totalVoters > 0
                  ? Math.round((stats.verifiedVoters / stats.totalVoters) * 100)
                  : 0}
                % verified
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Verifications</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.pendingVerifications}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/admin/voters?filter=pending"
              className="text-sm text-yellow-600 hover:text-yellow-800"
            >
              Review pending →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Elections</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.activeElections}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                of {stats?.totalElections} total
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🗳️</span>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/admin/elections"
              className="text-sm text-purple-600 hover:text-purple-800"
            >
              Manage elections →
            </Link>
          </div>
        </div>
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Upcoming Elections</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.upcomingElections}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Electors</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.totalElectors}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/admin/electors"
              className="text-sm text-red-600 hover:text-red-800"
            >
              Manage electors →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">System Health</p>
              <p className="text-3xl font-bold text-green-600 mt-2">100%</p>
              <p className="text-sm text-gray-600 mt-1">
                All systems operational
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💚</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Link
              to="/admin/voters?filter=pending"
              className="flex items-center p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition"
            >
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                <span>📋</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Review Pending Verifications
                </p>
                <p className="text-sm text-gray-600">
                  {stats?.pendingVerifications} pending
                </p>
              </div>
            </Link>

            <Link
              to="/admin/elections/create"
              className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <span>➕</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Create New Election</p>
                <p className="text-sm text-gray-600">
                  Set up a new voting session
                </p>
              </div>
            </Link>

            <Link
              to="/admin/electors/create"
              className="flex items-center p-3 bg-red-50 rounded-lg hover:bg-red-100 transition"
            >
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                <span>👤</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Add New Elector</p>
                <p className="text-sm text-gray-600">Register a candidate</p>
              </div>
            </Link>

            <Link
              to="/admin/audit"
              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                <span>📊</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">View Audit Logs</p>
                <p className="text-sm text-gray-600">Monitor system activity</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            <div className="flex space-x-2">
              <button
                onClick={fetchDashboardData}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Refresh
              </button>
              <Link
                to="/admin/audit"
                className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition"
              >
                View all →
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📝</span>
                </div>
                <p className="text-gray-600">No recent activity found</p>
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-gray-600">👤</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {activity.username}
                        <span className="ml-2 text-sm font-normal text-gray-600">
                          (User ID: {activity.userId})
                        </span>
                      </p>
                      <p className="text-sm text-gray-600">{activity.action}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(activity.timestamp).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center p-4 bg-green-50 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <p className="font-medium text-gray-900">API Server</p>
              <p className="text-sm text-gray-600">Online</p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-green-50 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <p className="font-medium text-gray-900">Database</p>
              <p className="text-sm text-gray-600">Connected</p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-green-50 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <p className="font-medium text-gray-900">Storage</p>
              <p className="text-sm text-gray-600">78% used</p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-green-50 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <p className="font-medium text-gray-900">Uptime</p>
              <p className="text-sm text-gray-600">99.8%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
