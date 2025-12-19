// routes/dashboard.tsx
import type { Route } from "./+types/home";
import type {
  Election,
  Elector,
  UserVote,
  VoteRequest,
  VoteStats,
  Voter,
} from "../types/election";
import { Link, redirect } from "react-router";
import { AuthService } from "../utils/auth";
import { useEffect, useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard - E-Voting Platform" },
    { name: "description", content: "Your voting dashboard" },
  ];
}

export function loader() {
  // Server-side check - we can't use localStorage here
  return null; // Let client handle the redirect
}

export default function Dashboard() {
  const [user, setUser] = useState<{
    username?: string;
    userId?: number;
    roles?: string[];
  } | null>(null);
  const [voter, setVoter] = useState<Voter | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [elections, setElections] = useState<Election[]>([]);
  const [electors, setElectors] = useState<Map<number, Elector>>(new Map());
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedElection, setSelectedElection] = useState<Election | null>(
    null
  );
  const [voting, setVoting] = useState<{
    electionId: number;
    candidateId: number;
  } | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [stats, setStats] = useState<VoteStats>({
    activeElections: 0,
    votesCast: 0,
    pendingElections: 0,
    timeRemaining: "None",
  });

  const isAdmin = user?.roles?.includes("ADMIN");

  useEffect(() => {
    // Client-side check
    const authStatus = AuthService.isAuthenticated();
    setIsAuthenticated(authStatus);

    if (!authStatus) {
      window.location.href = "/login";
      return;
    }

    const userData = AuthService.getUser();
    setUser(userData);

    // Fetch data including voter info
    fetchDashboardData(userData?.userId);
  }, []);

  const fetchVoterInfo = async (): Promise<Voter | null> => {
    try {
      const accessToken = AuthService.getAccessToken();
      const response = await fetch("http://localhost:8080/voter/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const voterData: Voter = await response.json();
        return voterData;
      } else if (response.status === 404) {
        // Voter not found - user hasn't registered yet
        return null;
      } else {
        throw new Error("Failed to fetch voter info");
      }
    } catch (error) {
      console.error("Error fetching voter info:", error);
      return null;
    }
  };

  const fetchDashboardData = async (userId?: number) => {
    try {
      setLoading(true);
      const accessToken = AuthService.getAccessToken();

      // Fetch voter info first
      const voterInfo = await fetchVoterInfo();
      setVoter(voterInfo);

      // Fetch all elections
      const electionsResponse = await fetch(
        "http://localhost:8080/election/all",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!electionsResponse.ok) throw new Error("Failed to fetch elections");
      const electionsData: Election[] = await electionsResponse.json();

      // Filter for active (OPEN) elections
      const activeElections = electionsData.filter((e) => e.status === "OPEN");

      // Fetch all electors (candidates)
      const electorsResponse = await fetch(
        "http://localhost:8080/admin/electors",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      let electorsMap = new Map<number, Elector>();
      if (electorsResponse.ok) {
        const electorsData: Elector[] = await electorsResponse.json();
        electorsData.forEach((elector) => {
          electorsMap.set(elector.id, elector);
        });
        setElectors(electorsMap);
      }

      // Fetch user's votes
      let userVotesData: UserVote[] = [];
      if (userId) {
        try {
          const votesResponse = await fetch(
            `http://localhost:8080/vote/my-votes`,
            {
              headers: {
                Authorization: `Bearer ${AuthService.getAccessToken()}`,
                "Content-Type": "application/json",
                "X-User-Id": String(user?.userId || ""),
              },
            }
          );

          if (votesResponse.ok) {
            userVotesData = await votesResponse.json();
          }
        } catch (error) {
          console.error("Error fetching user votes:", error);
        }
      }

      setElections(activeElections);
      setUserVotes(userVotesData);

      // Calculate stats
      const activeElectionsCount = activeElections.length;
      const votesCastCount = userVotesData.length;

      // Calculate time remaining for nearest ending election
      let timeRemaining = "None";
      const now = new Date();
      const upcomingElections = activeElections
        .filter((e) => new Date(e.endAt) > now)
        .sort(
          (a, b) => new Date(a.endAt).getTime() - new Date(b.endAt).getTime()
        );

      if (upcomingElections.length > 0) {
        const nearestEnd = new Date(upcomingElections[0].endAt);
        const diffMs = nearestEnd.getTime() - now.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours < 24) {
          timeRemaining = `${diffHours}h`;
        } else {
          const diffDays = Math.floor(diffHours / 24);
          timeRemaining = `${diffDays}d`;
        }
      }

      setStats({
        activeElections: activeElectionsCount,
        votesCast: votesCastCount,
        pendingElections: Math.max(0, activeElectionsCount - votesCastCount),
        timeRemaining,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setToast({
        type: "error",
        message: "Failed to load dashboard data",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (electionId: number, candidateId: number) => {
    try {
      // Check voter verification status
      if (!voter) {
        setToast({
          type: "error",
          message: "Please register and verify your identity first",
        });
        return;
      }

      if (voter.status !== "VERIFIED") {
        setToast({
          type: "error",
          message: `Your identity is ${voter.status.toLowerCase()}. Please complete verification to vote.`,
        });
        return;
      }

      setVoting({ electionId, candidateId });

      const voteData: VoteRequest = {
        electionId,
        candidateId,
      };

      const response = await fetch("http://localhost:8080/vote", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AuthService.getAccessToken()}`,
          "Content-Type": "application/json",
          "X-User-Id": String(user?.userId || ""),
        },
        body: JSON.stringify(voteData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to cast vote");
      }

      const result = await response.json();

      // Update user votes
      const newVote: UserVote = {
        electionId,
        candidateId,
        votedAt: new Date().toISOString(),
      };

      setUserVotes([...userVotes, newVote]);

      // Update stats
      setStats((prev) => ({
        ...prev,
        votesCast: prev.votesCast + 1,
        pendingElections: Math.max(0, prev.pendingElections - 1),
      }));

      // Close election modal if open
      if (selectedElection?.id === electionId) {
        setSelectedElection(null);
      }

      setToast({
        type: "success",
        message: "Vote cast successfully!",
      });

      // Refresh data to get updated election info
      fetchDashboardData(user?.userId);
    } catch (error: any) {
      console.error("Error casting vote:", error);
      setToast({
        type: "error",
        message: error.message || "Failed to cast vote",
      });
    } finally {
      setVoting(null);
    }
  };

  const handleLogout = () => {
    AuthService.clearTokens();
    window.location.href = "/";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasVotedInElection = (electionId: number) => {
    return userVotes.some((vote) => vote.electionId === electionId);
  };

  const getVotedElector = (electionId: number) => {
    const vote = userVotes.find((v) => v.electionId === electionId);
    if (!vote) return null;
    return electors.get(vote.candidateId);
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffMs = end.getTime() - now.getTime();

    if (diffMs <= 0) return "Ended";

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;

    if (diffDays > 0) {
      return `${diffDays}d ${remainingHours}h`;
    }
    return `${diffHours}h`;
  };

  const getElectorsForElection = (election: Election) => {
    return election.candidateIds
      .map((id) => electors.get(id))
      .filter(Boolean) as Elector[];
  };

  const getElectorInitials = (elector: Elector) => {
    return `${elector.firstName.charAt(0)}${elector.lastName.charAt(0)}`;
  };

  const getVoterStatusBadge = () => {
    if (!voter) {
      return {
        text: "Not Registered",
        color: "bg-red-100 text-red-800",
        message: "You need to register as a voter first",
      };
    }

    switch (voter.status) {
      case "VERIFIED":
        return {
          text: "Verified",
          color: "bg-green-100 text-green-800",
          message: "You can vote in elections",
        };
      case "PENDING":
        return {
          text: "Pending Review",
          color: "bg-yellow-100 text-yellow-800",
          message: "Your verification is under review",
        };
      case "REJECTED":
        return {
          text: "Rejected",
          color: "bg-red-100 text-red-800",
          message: `Verification rejected: ${voter.rejectionReason || "No reason provided"}`,
        };
      default:
        return {
          text: "Unknown",
          color: "bg-gray-100 text-gray-800",
          message: "Unknown status",
        };
    }
  };

  const canVote = () => {
    return voter?.status === "VERIFIED";
  };

  // Show loading state
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

  // Show loading state on server render
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg"></div>
                <span className="text-xl font-bold text-gray-800">E-Vote</span>
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition"
                >
                  Admin Dashboard
                </Link>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-end">
                <span className="text-gray-600">
                  Welcome, <strong>{user?.username}</strong>
                </span>
                <span className="text-sm text-gray-500">
                  Status:{" "}
                  <span className="font-medium">
                    {getVoterStatusBadge().text}
                  </span>
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Voting Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage your votes and election participation
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-2xl font-bold text-gray-900">
              {stats.activeElections}
            </div>
            <div className="text-gray-600">Active Elections</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-2xl font-bold text-green-600">
              {stats.votesCast}
            </div>
            <div className="text-gray-600">Votes Cast</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-2xl font-bold text-blue-600">
              {stats.pendingElections}
            </div>
            <div className="text-gray-600">Pending Elections</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-2xl font-bold text-purple-600">
              {stats.timeRemaining}
            </div>
            <div className="text-gray-600">Time Remaining</div>
          </div>
        </div>

        {/* Voter Status Banner */}
        <div className="mb-8">
          <div
            className={`rounded-xl shadow-lg p-6 ${!canVote() ? "bg-yellow-50 border border-yellow-200" : "bg-white"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <h2 className="text-xl font-bold text-gray-900 mr-3">
                    Voter Identity Status
                  </h2>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getVoterStatusBadge().color}`}
                  >
                    {getVoterStatusBadge().text}
                  </span>
                </div>
                <p className="text-gray-600">{getVoterStatusBadge().message}</p>
              </div>
              {(!voter || voter.status !== "VERIFIED") && (
                <Link
                  to="/verify-identity"
                  className={`px-6 py-3 font-medium rounded-lg transition ${
                    !voter
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : voter.status === "PENDING"
                        ? "bg-yellow-600 text-white hover:bg-yellow-700"
                        : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                >
                  {!voter ? "Register Now" : "View Status"}
                </Link>
              )}
            </div>
            {!canVote() && elections.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-100 rounded-lg border border-yellow-200">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.73 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <div>
                    <p className="text-yellow-800 font-medium">
                      You cannot vote until your identity is verified
                    </p>
                    <p className="text-yellow-700 text-sm mt-1">
                      Complete the identity verification process to participate
                      in elections
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Election Cards */}
        {elections.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🗳️</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No active elections
            </h3>
            <p className="text-gray-600 mb-6">
              There are currently no elections open for voting.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {elections.map((election) => {
              const hasVoted = hasVotedInElection(election.id);
              const votedElector = getVotedElector(election.id);
              const timeRemaining = getTimeRemaining(election.endAt);
              const electionElectors = getElectorsForElection(election);

              return (
                <div
                  key={election.id}
                  className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow ${
                    !canVote() && !hasVoted ? "opacity-75" : ""
                  }`}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-gray-900">
                        {election.title}
                      </h3>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        ACTIVE
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {election.description}
                    </p>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-gray-600">
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-sm">
                          Ends: {formatDate(election.endAt)}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
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
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <span className="text-sm">
                          Candidates: {election.candidateIds.length}
                        </span>
                      </div>
                    </div>

                    {hasVoted && votedElector && (
                      <div className="mb-4 p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-green-600 text-sm font-medium">
                              {getElectorInitials(votedElector)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-green-800">
                              Vote Submitted
                            </p>
                            <p className="text-xs text-green-600">
                              You voted for {votedElector.firstName}{" "}
                              {votedElector.lastName}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-6">
                      {hasVoted ? (
                        <div className="text-center py-2 bg-green-50 text-green-700 rounded-lg">
                          ✓ Vote Submitted
                        </div>
                      ) : !canVote() ? (
                        <div className="text-center py-2 bg-yellow-50 text-yellow-700 rounded-lg">
                          🔒 Verification Required
                        </div>
                      ) : election.candidateIds.length === 0 ? (
                        <div className="text-center py-2 bg-yellow-50 text-yellow-700 rounded-lg">
                          ⚠️ No candidates available
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedElection(election)}
                          className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                        >
                          Cast Your Vote
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="h-1 bg-green-500"></div>
                </div>
              );
            })}
          </div>
        )}

        {/* User Info */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Account</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">
                Account Information
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Username:</span>
                  <span className="font-medium">{user?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Full Name:</span>
                  <span className="font-medium">{voter?.firstName} {voter?.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Role:</span>
                  <span className="font-medium">
                    {user?.roles?.join(", ") || "Voter"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Voter Status:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getVoterStatusBadge().color}`}
                  >
                    {getVoterStatusBadge().text}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">
                Voting Activity
              </h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Votes Cast:</span>
                  <span className="font-medium">{userVotes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Elections:</span>
                  <span className="font-medium">{elections.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending Votes:</span>
                  <span className="font-medium">{stats.pendingElections}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Can Vote:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${canVote() ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {canVote() ? "Yes" : "No"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => fetchDashboardData(user?.userId)}
                className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Election Voting Modal */}
      {selectedElection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedElection.title}
                  </h3>
                  <p className="text-gray-600 mt-2">
                    {selectedElection.description}
                  </p>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>
                      Ends: {formatDate(selectedElection.endAt)} •{" "}
                      {getTimeRemaining(selectedElection.endAt)} remaining
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedElection(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Voter Status Warning */}
              {!canVote() && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-red-600 mr-2 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.73 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <div>
                      <p className="text-red-800 font-medium">
                        Identity Verification Required
                      </p>
                      <p className="text-red-700 text-sm mt-1">
                        You cannot vote until your identity is verified.{" "}
                        <Link
                          to="/verify-identity"
                          className="font-semibold underline hover:text-red-900"
                        >
                          Complete verification →
                        </Link>
                      </p>
                      <p className="text-red-600 text-xs mt-2">
                        Current status:{" "}
                        <strong>{getVoterStatusBadge().text}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Candidates List */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Select a Candidate
                </h4>

                {selectedElection.candidateIds.length > 0 ? (
                  <div className="space-y-4">
                    {selectedElection.candidateIds.map((candidateId) => {
                      const elector = electors.get(candidateId);

                      return (
                        <div
                          key={candidateId}
                          className={`border rounded-xl p-4 transition ${
                            canVote() &&
                            !hasVotedInElection(selectedElection.id)
                              ? "hover:border-indigo-300 hover:bg-indigo-50"
                              : "opacity-75"
                          }`}
                        >
                          <div className="flex items-start">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                              {elector ? (
                                <span className="text-indigo-600 font-medium text-lg">
                                  {getElectorInitials(elector)}
                                </span>
                              ) : (
                                <span className="text-indigo-600 font-medium text-lg">
                                  C{candidateId}
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  {elector ? (
                                    <>
                                      <h5 className="font-medium text-gray-900">
                                        {elector.firstName} {elector.lastName}
                                      </h5>
                                      <p className="text-sm text-gray-600 mt-1">
                                        Party: {elector.party}
                                      </p>
                                      <p className="text-sm text-gray-500 mt-2">
                                        {elector.bio}
                                      </p>
                                    </>
                                  ) : (
                                    <h5 className="font-medium text-gray-900">
                                      Candidate #{candidateId} (Details not
                                      loaded)
                                    </h5>
                                  )}
                                </div>
                                {elector && (
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                      elector.status === "VERIFIED"
                                        ? "bg-green-100 text-green-800"
                                        : elector.status === "PENDING"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {elector.status}
                                  </span>
                                )}
                              </div>
                              <div className="mt-4">
                                <button
                                  onClick={() =>
                                    handleVote(selectedElection.id, candidateId)
                                  }
                                  disabled={
                                    !canVote() ||
                                    hasVotedInElection(selectedElection.id) ||
                                    (voting?.electionId ===
                                      selectedElection.id &&
                                      voting?.candidateId === candidateId) ||
                                    (elector &&
                                      elector.status !== "VERIFIED") ||
                                    !elector
                                  }
                                  className={`w-full py-2 rounded-lg transition ${
                                    canVote() &&
                                    !hasVotedInElection(selectedElection.id)
                                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  }`}
                                >
                                  {!canVote() ? (
                                    "Verify Identity to Vote"
                                  ) : hasVotedInElection(
                                      selectedElection.id
                                    ) ? (
                                    "Already Voted"
                                  ) : elector &&
                                    elector.status !== "VERIFIED" ? (
                                    "Candidate Not Verified"
                                  ) : !elector ? (
                                    "Candidate Not Available"
                                  ) : voting?.electionId ===
                                      selectedElection.id &&
                                    voting?.candidateId === candidateId ? (
                                    <span className="flex items-center justify-center">
                                      <svg
                                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                      >
                                        <circle
                                          className="opacity-25"
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          stroke="currentColor"
                                          strokeWidth="4"
                                        />
                                        <path
                                          className="opacity-75"
                                          fill="currentColor"
                                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                      </svg>
                                      Casting Vote...
                                    </span>
                                  ) : (
                                    "Vote for this Candidate"
                                  )}
                                </button>
                                {!elector && (
                                  <p className="text-xs text-yellow-600 mt-2">
                                    Candidate details are still loading...
                                  </p>
                                )}
                                {!canVote() && (
                                  <p className="text-xs text-red-600 mt-2">
                                    You need to verify your identity first
                                  </p>
                                )}
                                {elector &&
                                  elector.status !== "VERIFIED" &&
                                  canVote() && (
                                    <p className="text-xs text-red-600 mt-2">
                                      Only verified candidates can be voted for
                                    </p>
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">👤</span>
                    </div>
                    <p className="text-gray-600">
                      No candidates available for this election
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={() => setSelectedElection(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
