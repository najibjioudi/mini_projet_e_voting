// routes/admin/elections.tsx
import type { Route } from "../+types/home";
import { useEffect, useState } from "react";
import { AuthService } from "../../utils/auth";
import type {
  Candidate,
  Election,
  ElectionFormData,
  ElectionStatus,
} from "../../types/election";
import ResultsChart from "../../components/ResultsChart";

interface ElectionResult {
  id: number;
  electionId: number;
  candidateId: number;
  voteCount: number;
  calculatedAt: string;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Elections Management - Admin" },
    { name: "description", content: "Manage elections and candidates" },
  ];
}

export default function ElectionsManagement() {
  const [elections, setElections] = useState<Election[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddCandidateModal, setShowAddCandidateModal] = useState<
    number | null
  >(null);
  const [showStatusModal, setShowStatusModal] = useState<number | null>(null);
  const [showResultsModal, setShowResultsModal] = useState<number | null>(null);
  const [selectedElection, setSelectedElection] = useState<Election | null>(
    null
  );
  const [formData, setFormData] = useState<ElectionFormData>({
    title: "",
    description: "",
    startAt: "",
    endAt: "",
  });
  const [results, setResults] = useState<Record<number, ElectionResult[]>>({});
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [processingAction, setProcessingAction] = useState<{
    type: string;
    id: number;
  } | null>(null);

  const statusOptions: {
    value: ElectionStatus;
    label: string;
    description: string;
  }[] = [
    {
      value: "DRAFT",
      label: "Draft",
      description: "Election is in preparation phase",
    },
    {
      value: "PUBLISHED",
      label: "Published",
      description: "Election is announced to voters",
    },
    { value: "OPEN", label: "Open", description: "Voting is currently active" },
    { value: "CLOSED", label: "Closed", description: "Voting has ended" },
    {
      value: "ARCHIVED",
      label: "Archived",
      description: "Election results are finalized",
    },
  ];

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

      // Enhance elections with candidate details
      const enhancedElections = electionsData.map((election: Election) => ({
        ...election,
        candidates: candidatesData.filter((candidate: Candidate) =>
          election.candidateIds?.includes(candidate.id)
        ),
      }));

      setElections(enhancedElections);
      setCandidates(candidatesData);

      // Fetch results for all elections that are CLOSED or ARCHIVED
      const electionsWithResults = enhancedElections.filter(
        (e: Election) => e.status === "CLOSED" || e.status === "ARCHIVED"
      );

      const resultsPromises = electionsWithResults.map(
        async (election: Election) => {
          try {
            const result = await fetchElectionResults(election.id);
            return { electionId: election.id, results: result };
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
    } catch (error) {
      console.error("Error fetching data:", error);
      setToast({
        type: "error",
        message: "Failed to load data",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchElectionResults = async (electionId: number) => {
    try {
      const accessToken = AuthService.getAccessToken();
      const response = await fetch(
        `http://localhost:8080/result/${electionId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const resultsData = await response.json();
        setResults((prev) => ({
          ...prev,
          [electionId]: resultsData,
        }));
        return resultsData;
      }
      return [];
    } catch (error) {
      console.error("Error fetching results:", error);
      return [];
    }
  };

  const handleCreateElection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const accessToken = AuthService.getAccessToken();

      const response = await fetch("http://localhost:8080/admin/elections", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to create election");

      const newElection = await response.json();
      setElections([...elections, newElection]);
      setShowCreateModal(false);
      setFormData({ title: "", description: "", startAt: "", endAt: "" });

      setToast({
        type: "success",
        message: "Election created successfully!",
      });
    } catch (error) {
      console.error("Error creating election:", error);
      setToast({
        type: "error",
        message: "Failed to create election",
      });
    }
  };

  const handleAddCandidate = async (
    electionId: number,
    candidateId: number
  ) => {
    try {
      setProcessingAction({ type: "addCandidate", id: electionId });
      const accessToken = AuthService.getAccessToken();

      const response = await fetch(
        `http://localhost:8080/admin/elections/${electionId}/candidates/${candidateId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to add candidate");

      // Update elections locally
      setElections(
        elections.map((election) => {
          if (election.id === electionId) {
            const candidate = candidates.find((c) => c.id === candidateId);
            return {
              ...election,
              candidateIds: [...election.candidateIds, candidateId],
              candidates: candidate
                ? [...(election.candidates || []), candidate]
                : election.candidates,
            };
          }
          return election;
        })
      );

      setShowAddCandidateModal(null);

      setToast({
        type: "success",
        message: "Candidate added successfully!",
      });
    } catch (error) {
      console.error("Error adding candidate:", error);
      setToast({
        type: "error",
        message: "Failed to add candidate",
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const handleUpdateStatus = async (
    electionId: number,
    newStatus: ElectionStatus
  ) => {
    try {
      setProcessingAction({ type: "updateStatus", id: electionId });
      const accessToken = AuthService.getAccessToken();

      const response = await fetch(
        `http://localhost:8080/admin/elections/${electionId}/status?status=${newStatus}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to update election status");

      // Update election status locally
      setElections(
        elections.map((election) =>
          election.id === electionId
            ? { ...election, status: newStatus }
            : election
        )
      );

      setShowStatusModal(null);

      setToast({
        type: "success",
        message: `Election status updated to ${newStatus}!`,
      });
    } catch (error) {
      console.error("Error updating election status:", error);
      setToast({
        type: "error",
        message: "Failed to update election status",
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const handlePublishResults = async (electionId: number) => {
    try {
      setProcessingAction({ type: "publishResults", id: electionId });
      const accessToken = AuthService.getAccessToken();

      const response = await fetch(
        `http://localhost:8080/admin/elections/${electionId}/publish`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to publish results");

      // Fetch updated results
      await fetchElectionResults(electionId);

      setToast({
        type: "success",
        message: "Results published successfully!",
      });
    } catch (error) {
      console.error("Error publishing results:", error);
      setToast({
        type: "error",
        message: "Failed to publish results",
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const handleOpenElection = async (electionId: number) => {
    await handleUpdateStatus(electionId, "OPEN");
  };

  const handleDeleteElection = async (electionId: number) => {
    const election = elections.find((e) => e.id === electionId);
    if (election?.status === "ARCHIVED") {
      setToast({
        type: "error",
        message: "Cannot delete archived elections",
      });
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete this election? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setProcessingAction({ type: "delete", id: electionId });
      const accessToken = AuthService.getAccessToken();

      const response = await fetch(
        `http://localhost:8080/admin/elections/${electionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to delete election");

      setElections(elections.filter((election) => election.id !== electionId));

      setToast({
        type: "success",
        message: "Election deleted successfully!",
      });
    } catch (error) {
      console.error("Error deleting election:", error);
      setToast({
        type: "error",
        message: "Failed to delete election",
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "PUBLISHED":
        return "bg-blue-100 text-blue-800";
      case "OPEN":
        return "bg-green-100 text-green-800";
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
      case "DRAFT":
        return "📝";
      case "PUBLISHED":
        return "📢";
      case "OPEN":
        return "✅";
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAvailableCandidates = (electionId: number) => {
    const election = elections.find((e) => e.id === electionId);
    const existingCandidateIds = election?.candidateIds || [];
    return candidates.filter(
      (candidate) =>
        !existingCandidateIds.includes(candidate.id) &&
        candidate.status === "VERIFIED"
    );
  };

  const getNextValidStatuses = (currentStatus: ElectionStatus) => {
    const statusFlow: Record<ElectionStatus, ElectionStatus[]> = {
      DRAFT: ["PUBLISHED"],
      PUBLISHED: ["OPEN", "DRAFT"],
      OPEN: ["CLOSED"],
      CLOSED: ["ARCHIVED"],
      ARCHIVED: [],
    };
    return statusFlow[currentStatus] || [];
  };

  const hasResults = (electionId: number) => {
    const election = elections.find((e) => e.id === electionId);

    // If election is archived, we should have results
    if (election?.status === "ARCHIVED") {
      return true;
    }

    // For other statuses, check if we have results data
    return results[electionId] && results[electionId].length > 0;
  };

  const getChartData = (electionId: number) => {
    const election = elections.find((e) => e.id === electionId);
    const electionResults = results[electionId] || [];

    // For archived elections, show results if we have them
    if (election?.status === "ARCHIVED" && electionResults.length === 0) {
      // Try to fetch results if we don't have them yet
      fetchElectionResults(electionId);
    }

    return electionResults.map((result) => {
      const candidate = election?.candidates?.find(
        (c) => c.id === result.candidateId
      );
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
    // Generate consistent colors based on party name
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading elections...</p>
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

      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Elections Management
          </h1>
          <p className="text-gray-600 mt-2">
            Create, manage, and monitor elections
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition flex items-center"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Election
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Elections</p>
          <p className="text-2xl font-bold text-gray-900">{elections.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Active Elections</p>
          <p className="text-2xl font-bold text-green-600">
            {elections.filter((e) => e.status === "OPEN").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Published Results</p>
          <p className="text-2xl font-bold text-purple-600">
            {Object.keys(results).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Candidates</p>
          <p className="text-2xl font-bold text-blue-600">
            {candidates.filter((c) => c.status === "VERIFIED").length}
          </p>
        </div>
      </div>

      {/* Elections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {elections.map((election) => {
          const hasElectionResults = hasResults(election.id);
          const isArchived = election.status === "ARCHIVED";

          return (
            <div
              key={election.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-6">
                {/* Election Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {election.title}
                    </h3>
                    <div className="flex items-center mt-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(election.status)}`}
                      >
                        <span className="mr-2">
                          {getStatusIcon(election.status)}
                        </span>
                        {election.status}
                      </span>
                      {(hasElectionResults || isArchived) && (
                        <span className="ml-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                          {isArchived
                            ? "📚 Archived with Results"
                            : "📊 Results Published"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedElection(election)}
                      className="text-gray-600 hover:text-gray-900 p-2"
                      title="View Details"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Election Description */}
                <p className="text-gray-600 mb-4">{election.description}</p>

                {/* Election Details */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Start Time</p>
                    <p className="font-medium">
                      {formatDate(election.startAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">End Time</p>
                    <p className="font-medium">{formatDate(election.endAt)}</p>
                  </div>
                </div>

                {/* Results Preview - Always show for archived elections */}
                {(hasElectionResults || isArchived) && (
                  <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-purple-800">
                        {isArchived ? "Final Results" : "Results Preview"}
                      </h4>
                      <button
                        onClick={() => setShowResultsModal(election.id)}
                        className="text-sm text-purple-600 hover:text-purple-800"
                      >
                        View Full Results
                      </button>
                    </div>
                    {isArchived && results[election.id]?.length === 0 ? (
                      <div className="h-32 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-xl">📊</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Loading results...
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-32">
                        <ResultsChart data={getChartData(election.id)} />
                      </div>
                    )}
                  </div>
                )}

                {/* Candidates */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-medium text-gray-700">
                      Candidates ({election.candidates?.length || 0})
                    </p>
                    {!isArchived && (
                      <button
                        onClick={() => setShowAddCandidateModal(election.id)}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        + Add Candidate
                      </button>
                    )}
                  </div>
                  {election.candidates && election.candidates.length > 0 ? (
                    <div className="space-y-2">
                      {election.candidates.slice(0, 3).map((candidate) => (
                        <div
                          key={candidate.id}
                          className="flex items-center p-2 bg-gray-50 rounded"
                        >
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-indigo-600 text-sm font-medium">
                              {candidate.firstName?.[0]}
                              {candidate.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {candidate.firstName} {candidate.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {candidate.party}
                            </p>
                          </div>
                        </div>
                      ))}
                      {election.candidates.length > 3 && (
                        <p className="text-sm text-gray-500 text-center">
                          + {election.candidates.length - 3} more candidates
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-gray-50 rounded">
                      <p className="text-gray-500 text-sm">
                        No candidates added yet
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {!isArchived && (
                    <button
                      onClick={() => setShowStatusModal(election.id)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      Update Status
                    </button>
                  )}

                  {/* For archived elections, only show view results button */}
                  {isArchived ? (
                    <button
                      onClick={() => setShowResultsModal(election.id)}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                      View Final Results
                    </button>
                  ) : (
                    <>
                      {/* Show normal action buttons for non-archived elections */}
                      {election.status === "CLOSED" && !hasElectionResults && (
                        <button
                          onClick={() => handlePublishResults(election.id)}
                          disabled={
                            processingAction?.type === "publishResults" &&
                            processingAction.id === election.id
                          }
                          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingAction?.type === "publishResults" &&
                          processingAction.id === election.id ? (
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
                              Publishing...
                            </span>
                          ) : (
                            "Publish Results"
                          )}
                        </button>
                      )}

                      {hasElectionResults && !isArchived && (
                        <button
                          onClick={() => setShowResultsModal(election.id)}
                          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                        >
                          View Results
                        </button>
                      )}

                      {election.status === "PUBLISHED" && (
                        <button
                          onClick={() => handleOpenElection(election.id)}
                          disabled={
                            processingAction?.type === "open" &&
                            processingAction.id === election.id
                          }
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingAction?.type === "open" &&
                          processingAction.id === election.id ? (
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
                              Opening...
                            </span>
                          ) : (
                            "Open Election"
                          )}
                        </button>
                      )}

                      {election.status === "OPEN" && (
                        <button
                          disabled
                          className="flex-1 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                        >
                          Election in Progress
                        </button>
                      )}
                    </>
                  )}

                  {/* Delete button - disabled for archived elections */}
                  <button
                    onClick={() => handleDeleteElection(election.id)}
                    disabled={
                      isArchived || // Can't delete archived elections
                      (processingAction?.type === "delete" &&
                        processingAction.id === election.id)
                    }
                    className={`px-4 py-2 border rounded-lg transition ${
                      isArchived
                        ? "border-gray-300 text-gray-400 cursor-not-allowed"
                        : "border-red-300 text-red-600 hover:bg-red-50"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={
                      isArchived
                        ? "Cannot delete archived elections"
                        : "Delete election"
                    }
                  >
                    {processingAction?.type === "delete" &&
                    processingAction.id === election.id ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                        Deleting...
                      </span>
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {elections.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🗳️</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No elections yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first election to get started
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
          >
            Create Election
          </button>
        </div>
      )}

      {/* Create Election Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Create New Election
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
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

              <form onSubmit={handleCreateElection}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Election Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      placeholder="e.g., Presidential Election 2025"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      placeholder="Describe the election purpose and scope..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={formData.startAt}
                        onChange={(e) =>
                          setFormData({ ...formData, startAt: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={formData.endAt}
                        onChange={(e) =>
                          setFormData({ ...formData, endAt: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      Create Election
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Election Results
                  </h3>
                  <p className="text-gray-600 mt-2">
                    {(() => {
                      const election = elections.find(
                        (e) => e.id === showResultsModal
                      );
                      return election?.status === "ARCHIVED"
                        ? "Final archived results - This election has been permanently recorded"
                        : "Detailed voting results and statistics";
                    })()}
                  </p>
                </div>
                <button
                  onClick={() => setShowResultsModal(null)}
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

              {(() => {
                const election = elections.find(
                  (e) => e.id === showResultsModal
                );
                const electionResults = results[showResultsModal] || [];

                if (!election) return null;

                const chartData = getChartData(showResultsModal);
                const totalVotes = chartData.reduce(
                  (sum, item) => sum + item.value,
                  0
                );
                const sortedResults = [...chartData].sort(
                  (a, b) => b.value - a.value
                );

                return (
                  <div className="space-y-8">
                    {/* Election Info */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-bold text-xl text-gray-900 mb-2">
                        {election.title}
                      </h4>
                      <p className="text-gray-600 mb-4">
                        {election.description}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Total Votes</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {totalVotes}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Number of Candidates
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {chartData.length}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Results Published
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {electionResults[0]?.calculatedAt
                              ? formatDate(electionResults[0].calculatedAt)
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Results Visualization */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-4">
                          Results Distribution
                        </h4>
                        <div className="h-80">
                          <ResultsChart data={chartData} />
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-700 mb-4">
                          Detailed Results
                        </h4>
                        <div className="space-y-4 max-h-80 overflow-y-auto">
                          {sortedResults.map((result, index) => (
                            <div
                              key={result.id}
                              className="bg-white border rounded-lg p-4"
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
                                  {index === 0 ? "🏆 Winner" : `#${index + 1}`}
                                </span>
                              </div>
                              <div className="mt-3">
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                  <span>Votes: {result.value}</span>
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
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Results Summary */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h4 className="font-medium text-blue-800 mb-3">
                        Results Summary
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700">
                            Total valid votes cast:
                          </span>
                          <span className="font-bold text-blue-900">
                            {totalVotes}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700">
                            Number of candidates:
                          </span>
                          <span className="font-bold text-blue-900">
                            {chartData.length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700">Turnout rate:</span>
                          <span className="font-bold text-blue-900">
                            {totalVotes > 0 ? "Calculating..." : "No votes"}
                          </span>
                        </div>
                        {sortedResults.length > 0 && (
                          <div className="mt-4 p-4 bg-white rounded-lg">
                            <p className="text-lg font-bold text-gray-900 mb-2">
                              🏆 Winner: {sortedResults[0].label}
                            </p>
                            <p className="text-gray-600">
                              Won with {sortedResults[0].value} votes (
                              {totalVotes > 0
                                ? (
                                    (sortedResults[0].value / totalVotes) *
                                    100
                                  ).toFixed(1)
                                : 0}
                              % of total votes)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between pt-6 border-t">
                      <button
                        onClick={() => setShowResultsModal(null)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                      >
                        Close
                      </button>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => window.print()}
                          className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition"
                        >
                          Print Results
                        </button>
                        <button
                          onClick={() => {
                            // Export results functionality
                            const dataStr = JSON.stringify(
                              {
                                election: {
                                  title: election.title,
                                  description: election.description,
                                  totalVotes: totalVotes,
                                  results: sortedResults,
                                },
                              },
                              null,
                              2
                            );
                            const dataUri =
                              "data:application/json;charset=utf-8," +
                              encodeURIComponent(dataStr);
                            const exportFileDefaultName = `${election.title.replace(/\s+/g, "_")}_results.json`;
                            const linkElement = document.createElement("a");
                            linkElement.setAttribute("href", dataUri);
                            linkElement.setAttribute(
                              "download",
                              exportFileDefaultName
                            );
                            linkElement.click();
                          }}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                          Export Results
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showAddCandidateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Add Candidate
                </h3>
                <button
                  onClick={() => setShowAddCandidateModal(null)}
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

              <div className="space-y-4">
                <p className="text-gray-600">
                  Select a verified candidate to add to this election:
                </p>

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {getAvailableCandidates(showAddCandidateModal).length > 0 ? (
                    getAvailableCandidates(showAddCandidateModal).map(
                      (candidate) => (
                        <div
                          key={candidate.id}
                          className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border"
                        >
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-indigo-600 font-medium">
                                {candidate.firstName?.[0]}
                                {candidate.lastName?.[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">
                                {candidate.firstName} {candidate.lastName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {candidate.party}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              handleAddCandidate(
                                showAddCandidateModal,
                                candidate.id
                              )
                            }
                            disabled={
                              processingAction?.type === "addCandidate" &&
                              processingAction.id === showAddCandidateModal
                            }
                            className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm disabled:opacity-50"
                          >
                            Add
                          </button>
                        </div>
                      )
                    )
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-xl">👤</span>
                      </div>
                      <p className="text-gray-600">No available candidates</p>
                      <p className="text-sm text-gray-500 mt-1">
                        All verified candidates are already in this election
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setShowAddCandidateModal(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Update Election Status
                </h3>
                <button
                  onClick={() => setShowStatusModal(null)}
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

              <div className="space-y-4">
                <p className="text-gray-600">
                  Select a new status for this election:
                </p>

                <div className="space-y-3">
                  {statusOptions
                    .filter((option) => {
                      const election = elections.find(
                        (e) => e.id === showStatusModal
                      );
                      if (!election) return false;

                      // Get next valid statuses
                      const validNextStatuses = getNextValidStatuses(
                        election.status as ElectionStatus
                      );

                      // For CLOSED elections, we need to check if results are published before allowing ARCHIVED
                      if (
                        election.status === "CLOSED" &&
                        option.value === "ARCHIVED"
                      ) {
                        return hasResults(election.id); // Only allow ARCHIVED if results are published
                      }

                      // For ARCHIVED elections, show only ARCHIVED option (can't change from ARCHIVED)
                      if (election.status === "ARCHIVED") {
                        return option.value === "ARCHIVED";
                      }

                      // For other statuses, show all options
                      return true;
                    })
                    .map((option) => {
                      const election = elections.find(
                        (e) => e.id === showStatusModal
                      );
                      const isCurrentStatus = election?.status === option.value;
                      const isValidNextStatus = getNextValidStatuses(
                        election?.status as ElectionStatus
                      ).includes(option.value);
                      const isArchived = election?.status === "ARCHIVED";

                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            if (option.value === "ARCHIVED") {
                              // When archiving, we should ensure results are published
                              handleUpdateStatus(showStatusModal, option.value);
                            } else {
                              handleUpdateStatus(showStatusModal, option.value);
                            }
                          }}
                          disabled={
                            isCurrentStatus ||
                            (processingAction?.type === "updateStatus" &&
                              processingAction.id === showStatusModal) ||
                            (election?.status === "CLOSED" &&
                              option.value === "ARCHIVED" &&
                              !hasResults(election.id))
                          }
                          className={`w-full p-4 rounded-lg border text-left transition-all ${
                            isCurrentStatus
                              ? "border-2 border-indigo-500 bg-indigo-50"
                              : isValidNextStatus
                                ? "border border-green-300 hover:border-green-500 hover:bg-green-50"
                                : "border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          } ${
                            isCurrentStatus || isArchived
                              ? "cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span
                                className={`inline-flex items-center justify-center w-10 h-10 rounded-full mr-3 ${getStatusColor(
                                  option.value
                                ).replace("text-", "text-opacity-100 ")}`}
                              >
                                <span className="text-lg">
                                  {getStatusIcon(option.value)}
                                </span>
                              </span>
                              <div>
                                <div className="flex items-center">
                                  <span className="font-medium">
                                    {option.label}
                                  </span>
                                  {isCurrentStatus && (
                                    <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                                      Current
                                    </span>
                                  )}
                                  {!isCurrentStatus && isValidNextStatus && (
                                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                                      Valid Next Step
                                    </span>
                                  )}
                                  {election?.status === "CLOSED" &&
                                    option.value === "ARCHIVED" &&
                                    !hasResults(election.id) && (
                                      <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                                        Results Required
                                      </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                  {option.value === "ARCHIVED" &&
                                  election?.status === "CLOSED"
                                    ? "Finalize election with published results"
                                    : option.description}
                                </p>
                                {option.value === "ARCHIVED" && (
                                  <p className="text-xs text-purple-600 mt-1">
                                    ⚠️ Archived elections cannot be modified
                                  </p>
                                )}
                              </div>
                            </div>
                            {isCurrentStatus && (
                              <div className="text-indigo-600">
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
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between">
                    <button
                      onClick={() => setShowStatusModal(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <p className="text-sm text-gray-500 self-center">
                      {(() => {
                        const election = elections.find(
                          (e) => e.id === showStatusModal
                        );
                        if (election?.status === "CLOSED") {
                          return "Results must be published before archiving";
                        }
                        if (election?.status === "ARCHIVED") {
                          return "Archived elections cannot be modified";
                        }
                        return "Selected election will be updated immediately";
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Election Details Modal */}
      {selectedElection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedElection.title}
                  </h3>
                  <div className="flex items-center mt-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedElection.status)}`}
                    >
                      <span className="mr-2">
                        {getStatusIcon(selectedElection.status)}
                      </span>
                      {selectedElection.status}
                    </span>
                    {selectedElection.status !== "ARCHIVED" && (
                      <button
                        onClick={() => {
                          setSelectedElection(null);
                          setShowStatusModal(selectedElection.id);
                        }}
                        className="ml-4 text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        Change Status →
                      </button>
                    )}
                  </div>
                  {selectedElection.status === "ARCHIVED" && (
                    <p className="text-sm text-purple-600 mt-2">
                      ⚠️ This election has been archived and cannot be modified
                    </p>
                  )}
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

              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    Description
                  </h4>
                  <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                    {selectedElection.description}
                  </p>
                </div>

                {/* Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3">Timeline</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Start Time</p>
                        <p className="font-medium">
                          {formatDate(selectedElection.startAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">End Time</p>
                        <p className="font-medium">
                          {formatDate(selectedElection.endAt)}
                        </p>
                      </div>
                      {selectedElection.createdAt && (
                        <div>
                          <p className="text-sm text-gray-500">Created</p>
                          <p className="font-medium">
                            {formatDate(selectedElection.createdAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3">
                      Election Status
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">
                            Current Status
                          </p>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${getStatusColor(selectedElection.status)}`}
                          >
                            <span className="mr-1">
                              {getStatusIcon(selectedElection.status)}
                            </span>
                            {selectedElection.status}
                          </span>
                        </div>
                        {selectedElection.status !== "ARCHIVED" && (
                          <button
                            onClick={() => {
                              setSelectedElection(null);
                              setShowStatusModal(selectedElection.id);
                            }}
                            className="px-3 py-1 border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 transition text-sm"
                          >
                            Update
                          </button>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Total Candidates
                        </p>
                        <p className="text-xl font-bold">
                          {selectedElection.candidates?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Candidates List */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-700">
                      Candidates ({selectedElection.candidates?.length || 0})
                    </h4>
                    {selectedElection.status !== "ARCHIVED" && (
                      <button
                        onClick={() => {
                          setShowAddCandidateModal(selectedElection.id);
                          setSelectedElection(null);
                        }}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        + Add Candidate
                      </button>
                    )}
                  </div>

                  {selectedElection.candidates &&
                  selectedElection.candidates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedElection.candidates.map((candidate) => (
                        <div
                          key={candidate.id}
                          className="bg-gray-50 rounded-lg p-4"
                        >
                          <div className="flex items-start">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                              <span className="text-indigo-600 font-medium text-lg">
                                {candidate.firstName?.[0]}
                                {candidate.lastName?.[0]}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">
                                {candidate.firstName} {candidate.lastName}
                              </h5>
                              <p className="text-sm text-gray-600 mt-1">
                                {candidate.party}
                              </p>
                              <p className="text-sm text-gray-500 mt-2">
                                {candidate.bio}
                              </p>
                              <div className="mt-3">
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                    candidate.status === "VERIFIED"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {candidate.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">👤</span>
                      </div>
                      <p className="text-gray-600">
                        No candidates added to this election
                      </p>
                      {selectedElection.status !== "ARCHIVED" && (
                        <button
                          onClick={() => {
                            setShowAddCandidateModal(selectedElection.id);
                            setSelectedElection(null);
                          }}
                          className="mt-4 text-indigo-600 hover:text-indigo-800"
                        >
                          Add candidates to get started
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-between space-x-3 pt-6 border-t">
                  {selectedElection.status !== "ARCHIVED" && (
                    <button
                      onClick={() => {
                        setSelectedElection(null);
                        setShowStatusModal(selectedElection.id);
                      }}
                      className="px-4 py-2 border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
                    >
                      Change Status
                    </button>
                  )}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setSelectedElection(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    >
                      Close
                    </button>
                    {selectedElection.status === "PUBLISHED" && (
                      <button
                        onClick={() => {
                          handleOpenElection(selectedElection.id);
                          setSelectedElection(null);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        Open Election for Voting
                      </button>
                    )}
                    {selectedElection.status === "CLOSED" &&
                      !hasResults(selectedElection.id) && (
                        <button
                          onClick={() =>
                            handlePublishResults(selectedElection.id)
                          }
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                        >
                          Publish Results
                        </button>
                      )}
                    {(selectedElection.status === "ARCHIVED" ||
                      hasResults(selectedElection.id)) && (
                      <button
                        onClick={() => setShowResultsModal(selectedElection.id)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                      >
                        {selectedElection.status === "ARCHIVED"
                          ? "View Final Results"
                          : "View Results"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
