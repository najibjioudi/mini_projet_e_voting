// routes/results.tsx
import type { Route } from "./+types/home";
import { Link } from "react-router";
import { useEffect, useState } from "react";
import { AuthService } from "../utils/auth";
import ResultsChart from "../components/ResultsChart";

interface Election {
  id: number;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  status: "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED";
  candidateIds: number[];
  createdAt: string;
  updatedAt: string;
}

interface ElectionResult {
  id: number;
  electionId: number;
  candidateId: number;
  voteCount: number;
  calculatedAt: string;
}

interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  party: string;
  bio: string;
  status: string;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Election Results" },
    { name: "description", content: "View published election results" },
  ];
}

export default function Results() {
  const [elections, setElections] = useState<Election[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [results, setResults] = useState<Record<number, ElectionResult[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedElection, setSelectedElection] = useState<Election | null>(
    null
  );
  const [expandedElections, setExpandedElections] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const accessToken = AuthService.getAccessToken();

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

      if (!electionsResponse.ok) throw new Error("Failed to fetch elections");
      const electionsData = await electionsResponse.json();

      // Show CLOSED and ARCHIVED elections for voters (only elections with published results)
      const visibleElections = electionsData.filter(
        (e: Election) => e.status === "CLOSED" || e.status === "ARCHIVED"
      );

      // Fetch candidates
      const candidatesResponse = await fetch(
        "http://localhost:8080/elector/all",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!candidatesResponse.ok) throw new Error("Failed to fetch candidates");
      const candidatesData = await candidatesResponse.json();

      setElections(visibleElections);
      setCandidates(candidatesData);

      // Fetch results for each election
      const resultsPromises = visibleElections.map(
        async (election: Election) => {
          try {
            const response = await fetch(
              `http://localhost:8080/result/${election.id}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (response.ok) {
              const electionResults = await response.json();
              return { electionId: election.id, results: electionResults };
            }
            return { electionId: election.id, results: [] };
          } catch (error) {
            console.error(
              `Error fetching results for election ${election.id}:`,
              error
            );
            return { electionId: election.id, results: [] };
          }
        }
      );

      const resultsData = await Promise.all(resultsPromises);
      const resultsMap: Record<number, ElectionResult[]> = {};
      resultsData.forEach(({ electionId, results }) => {
        resultsMap[electionId] = results;
      });

      setResults(resultsMap);

      // Automatically expand elections that have results
      const newExpanded = new Set<number>();
      resultsData.forEach(({ electionId, results }) => {
        if (results.length > 0) {
          newExpanded.add(electionId);
        }
      });
      setExpandedElections(newExpanded);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleElectionExpansion = (electionId: number) => {
    const newExpanded = new Set(expandedElections);
    if (newExpanded.has(electionId)) {
      newExpanded.delete(electionId);
    } else {
      newExpanded.add(electionId);
    }
    setExpandedElections(newExpanded);
  };

  const getChartData = (electionId: number) => {
    const election = elections.find((e) => e.id === electionId);
    const electionResults = results[electionId] || [];

    return electionResults.map((result) => {
      const candidate = candidates.find((c) => c.id === result.candidateId);
      return {
        id: result.candidateId,
        label: candidate
          ? `${candidate.firstName} ${candidate.lastName}`
          : `Candidate ${result.candidateId}`,
        value: result.voteCount,
        party: candidate?.party || "Unknown",
        color: getPartyColor(candidate?.party || ""),
      };
    });
  };

  const getPartyColor = (party: string) => {
    const colors = [
      "#3B82F6",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#EC4899",
      "#14B8A6",
      "#F97316",
      "#84CC16",
      "#06B6D4",
    ];
    const hash = party
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CLOSED":
        return "bg-red-100 text-red-800";
      case "ARCHIVED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CLOSED":
        return "🔒";
      case "ARCHIVED":
        return "📚";
      default:
        return "📝";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasResults = (electionId: number) => {
    const election = elections.find((e) => e.id === electionId);

    // ARCHIVED elections always have results
    if (election?.status === "ARCHIVED") {
      return true;
    }

    return results[electionId] && results[electionId].length > 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading election results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Election Results
            </h1>
            <p className="text-gray-600 mt-2">
              View published results from completed and archived elections
            </p>
          </div>

          <div className="flex space-x-4 mb-6">
            <Link
              to="/"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition"
            >
              ← Back to Dashboard
            </Link>
            <button
              onClick={fetchData}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Refresh Results
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-2xl font-bold text-gray-900">
              {elections.length}
            </div>
            <div className="text-gray-600">Completed Elections</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(results).length}
            </div>
            <div className="text-gray-600">Published Results</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-2xl font-bold text-blue-600">
              {Object.values(results)
                .reduce(
                  (total, electionResults) =>
                    total +
                    electionResults.reduce(
                      (sum, result) => sum + result.voteCount,
                      0
                    ),
                  0
                )
                .toLocaleString()}
            </div>
            <div className="text-gray-600">Total Votes Cast</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-2xl font-bold text-red-600">
              {elections.filter((e) => e.status === "ARCHIVED").length}
            </div>
            <div className="text-gray-600">Archived Elections</div>
          </div>
        </div>

        {/* Elections List */}
        <div className="space-y-6">
          {elections.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No election results available
              </h3>
              <p className="text-gray-600 mb-6">
                There are no elections with published results yet.
              </p>
              <Link
                to="/"
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
              >
                Return to Dashboard
              </Link>
            </div>
          ) : (
            elections.map((election) => {
              const electionResults = results[election.id] || [];
              const hasElectionResults = hasResults(election.id);
              const isExpanded = expandedElections.has(election.id);
              const isArchived = election.status === "ARCHIVED";

              return (
                <div
                  key={election.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden"
                >
                  {/* Election Header */}
                  <button
                    onClick={() => toggleElectionExpansion(election.id)}
                    className="w-full p-6 text-left hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-xl font-bold text-gray-900 mr-4">
                            {election.title}
                          </h3>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(election.status)}`}
                          >
                            <span className="mr-1">
                              {getStatusIcon(election.status)}
                            </span>
                            {election.status}
                          </span>
                          {hasElectionResults && (
                            <span className="ml-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                              {isArchived
                                ? "📚 Archived Results"
                                : "📊 Results Published"}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-4">
                          {election.description}
                        </p>
                        <div className="flex items-center text-sm text-gray-500">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span>
                            {isArchived ? "Archived on" : "Completed on"}{" "}
                            {formatDate(election.endAt)}
                          </span>
                          {isArchived && (
                            <span className="ml-4">
                              <svg
                                className="w-4 h-4 inline mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                                />
                              </svg>
                              Permanent Record
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium mr-4 ${
                            hasElectionResults
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {hasElectionResults
                            ? `${electionResults.length} Candidates`
                            : "No Results"}
                        </span>
                        <svg
                          className={`w-6 h-6 text-gray-400 transition-transform ${
                            isExpanded ? "transform rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Results */}
                  {isExpanded && (
                    <div className="border-t">
                      {hasElectionResults ? (
                        <div className="p-6">
                          {isArchived && (
                            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                              <div className="flex items-center">
                                <svg
                                  className="w-5 h-5 text-purple-600 mr-2"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <p className="text-purple-800 font-medium">
                                  This election has been archived and is now a
                                  permanent record.
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Chart */}
                            <div>
                              <h4 className="font-medium text-gray-700 mb-4">
                                Vote Distribution
                              </h4>
                              <div className="h-64">
                                <ResultsChart
                                  data={getChartData(election.id)}
                                />
                              </div>
                            </div>

                            {/* Detailed Results */}
                            <div>
                              <h4 className="font-medium text-gray-700 mb-4">
                                Detailed Results
                              </h4>
                              <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                                {(() => {
                                  const chartData = getChartData(election.id);
                                  const totalVotes = chartData.reduce(
                                    (sum, item) => sum + item.value,
                                    0
                                  );
                                  const sortedResults = [...chartData].sort(
                                    (a, b) => b.value - a.value
                                  );

                                  return sortedResults.map((result, index) => (
                                    <div
                                      key={result.id}
                                      className="bg-gray-50 rounded-lg p-4"
                                    >
                                      <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center">
                                          <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                                            style={{
                                              backgroundColor: `${result.color}20`,
                                            }}
                                          >
                                            <span
                                              className="font-medium"
                                              style={{ color: result.color }}
                                            >
                                              {result.label
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")}
                                            </span>
                                          </div>
                                          <div>
                                            <h5 className="font-medium text-gray-900">
                                              {result.label}
                                            </h5>
                                            <p className="text-sm text-gray-500">
                                              {result.party}
                                            </p>
                                          </div>
                                        </div>
                                        <span
                                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            index === 0
                                              ? "bg-yellow-100 text-yellow-800"
                                              : "bg-gray-100 text-gray-800"
                                          }`}
                                        >
                                          {index === 0
                                            ? "🏆 Winner"
                                            : `#${index + 1}`}
                                        </span>
                                      </div>
                                      <div className="mt-3">
                                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                                          <span>
                                            Votes:{" "}
                                            {result.value.toLocaleString()}
                                          </span>
                                          <span>
                                            {totalVotes > 0
                                              ? (
                                                  (result.value / totalVotes) *
                                                  100
                                                ).toFixed(1)
                                              : 0}
                                            %
                                          </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                          <div
                                            className="h-2 rounded-full"
                                            style={{
                                              width: `${totalVotes > 0 ? (result.value / totalVotes) * 100 : 0}%`,
                                              backgroundColor: result.color,
                                            }}
                                          ></div>
                                        </div>
                                      </div>
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>
                          </div>

                          {/* Summary */}
                          <div className="mt-8 pt-8 border-t">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-600">
                                  Total Votes
                                </p>
                                <p className="text-2xl font-bold text-blue-900">
                                  {(() => {
                                    const chartData = getChartData(election.id);
                                    return chartData
                                      .reduce(
                                        (sum, item) => sum + item.value,
                                        0
                                      )
                                      .toLocaleString();
                                  })()}
                                </p>
                              </div>
                              <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-green-600">
                                  Candidates
                                </p>
                                <p className="text-2xl font-bold text-green-900">
                                  {electionResults.length}
                                </p>
                              </div>
                              <div className="bg-purple-50 p-4 rounded-lg">
                                <p className="text-sm text-purple-600">
                                  Results Published
                                </p>
                                <p className="text-2xl font-bold text-purple-900">
                                  {electionResults[0]?.calculatedAt
                                    ? formatDateTime(
                                        electionResults[0].calculatedAt
                                      )
                                    : "Recently"}
                                </p>
                              </div>
                              <div
                                className={`p-4 rounded-lg ${isArchived ? "bg-purple-50" : "bg-gray-50"}`}
                              >
                                <p
                                  className={`text-sm ${isArchived ? "text-purple-600" : "text-gray-600"}`}
                                >
                                  Election Status
                                </p>
                                <p
                                  className={`text-2xl font-bold ${isArchived ? "text-purple-900" : "text-gray-900"}`}
                                >
                                  {election.status}
                                </p>
                              </div>
                            </div>

                            <div className="mt-6 flex justify-between items-center">
                              <div>
                                {(() => {
                                  const chartData = getChartData(election.id);
                                  const totalVotes = chartData.reduce(
                                    (sum, item) => sum + item.value,
                                    0
                                  );
                                  const sortedResults = [...chartData].sort(
                                    (a, b) => b.value - a.value
                                  );

                                  if (sortedResults.length > 0) {
                                    return (
                                      <div className="flex items-center">
                                        <span className="text-lg font-bold text-gray-900">
                                          🏆 Winner: {sortedResults[0].label}
                                        </span>
                                        <span className="ml-4 text-sm text-gray-600">
                                          (
                                          {sortedResults[0].value.toLocaleString()}{" "}
                                          votes •
                                          {totalVotes > 0
                                            ? (
                                                (sortedResults[0].value /
                                                  totalVotes) *
                                                100
                                              ).toFixed(1)
                                            : 0}
                                          %)
                                        </span>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => window.print()}
                                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                                >
                                  Print Results
                                </button>
                                {isArchived && (
                                  <button
                                    onClick={() => {
                                      // Export results functionality
                                      const chartData = getChartData(
                                        election.id
                                      );
                                      const sortedResults = [...chartData].sort(
                                        (a, b) => b.value - a.value
                                      );
                                      const totalVotes = chartData.reduce(
                                        (sum, item) => sum + item.value,
                                        0
                                      );

                                      const dataStr = JSON.stringify(
                                        {
                                          election: {
                                            title: election.title,
                                            description: election.description,
                                            status: election.status,
                                            totalVotes: totalVotes,
                                            candidatesCount: chartData.length,
                                            results: sortedResults,
                                            exportedAt:
                                              new Date().toISOString(),
                                          },
                                        },
                                        null,
                                        2
                                      );
                                      const dataUri =
                                        "data:application/json;charset=utf-8," +
                                        encodeURIComponent(dataStr);
                                      const exportFileDefaultName = `${election.title.replace(/\s+/g, "_")}_final_results.json`;
                                      const linkElement =
                                        document.createElement("a");
                                      linkElement.setAttribute("href", dataUri);
                                      linkElement.setAttribute(
                                        "download",
                                        exportFileDefaultName
                                      );
                                      linkElement.click();
                                    }}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                                  >
                                    Export Final Results
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : isArchived ? (
                        <div className="p-6 text-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">📊</span>
                          </div>
                          <h4 className="text-lg font-medium text-gray-900 mb-2">
                            Loading Final Results
                          </h4>
                          <p className="text-gray-600">
                            The final results for this archived election are
                            being loaded...
                          </p>
                          <button
                            onClick={fetchData}
                            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                          >
                            Refresh Results
                          </button>
                        </div>
                      ) : (
                        <div className="p-6 text-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">⏳</span>
                          </div>
                          <h4 className="text-lg font-medium text-gray-900 mb-2">
                            Results Pending
                          </h4>
                          <p className="text-gray-600">
                            The results for this election are being calculated
                            and will be published soon.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* How Results Work */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            About Election Results
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">
                Transparent Process
              </h4>
              <p className="text-sm text-blue-700">
                All results are calculated using a secure, auditable system to
                ensure accuracy and fairness.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">
                Verified Results
              </h4>
              <p className="text-sm text-green-700">
                Results are verified by election officials before publication to
                ensure integrity.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">
                Archived Elections
              </h4>
              <p className="text-sm text-purple-700">
                Archived elections are permanent records that cannot be
                modified, ensuring historical accuracy.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">
                Real-time Updates
              </h4>
              <p className="text-sm text-gray-700">
                Refresh the page to see the latest published results as they
                become available.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
