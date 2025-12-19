// routes/admin/voters.tsx
import type { Route } from "../+types/home";
import { useEffect, useState } from "react";
import { AuthService } from "../../utils/auth";

interface Voter {
  id: number;
  userId: number;
  cin: string;
  firstName: string;
  lastName: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  rejectionReason?: string;
  cinImagePath: string;
  createdAt?: string;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Voter Management - Admin" },
    {
      name: "description",
      content: "Manage voter registrations and verifications",
    },
  ];
}

export default function VoterManagement() {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [imageLoading, setImageLoading] = useState<{ [key: number]: boolean }>(
    {}
  );

  const [cinPreviewUrl, setCinPreviewUrl] = useState<string | null>(null);
  const [cinLoading, setCinLoading] = useState(false);

  const loadCinImage = async (voterId: number) => {
    try {
      setCinLoading(true);
      const token = AuthService.getAccessToken();

      const response = await fetch(getCinImageUrl(voterId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load CIN image");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      setCinPreviewUrl(url);
    } catch (e) {
      console.error(e);
      setCinPreviewUrl(null);
      setToast({
        type: "error",
        message: "Unable to load CIN document",
      });
    } finally {
      setCinLoading(false);
    }
  };

  useEffect(() => {
    if (selectedVoter) {
      loadCinImage(selectedVoter.id);
    }

    return () => {
      if (cinPreviewUrl) URL.revokeObjectURL(cinPreviewUrl);
    };
  }, [selectedVoter]);

  useEffect(() => {
    fetchVoters();
  }, []);

  const fetchVoters = async () => {
    try {
      setLoading(true);
      const accessToken = AuthService.getAccessToken();

      const response = await fetch("http://localhost:8080/admin/voters", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch voters");
      }

      const data = await response.json();
      setVoters(data);
    } catch (error) {
      console.error("Error fetching voters:", error);
      setToast({
        type: "error",
        message: "Failed to load voters data",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCinImageUrl = (voterId: number) => {
    return `http://localhost:8080/voter/${voterId}/cin-image`;
  };

  const handleViewImage = async (voterId: number) => {
    try {
      setImageLoading((prev) => ({ ...prev, [voterId]: true }));

      const accessToken = AuthService.getAccessToken();

      const response = await fetch(getCinImageUrl(voterId), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load image");
      }

      // Convert response to blob
      const blob = await response.blob();

      // Create temporary object URL
      const imageUrl = URL.createObjectURL(blob);

      // Open image in new tab
      const imageWindow = window.open(imageUrl, "_blank");

      if (!imageWindow) {
        setToast({
          type: "error",
          message: "Please allow popups to view the image",
        });
      }

      // Optional: cleanup later
      setTimeout(() => URL.revokeObjectURL(imageUrl), 60_000);
    } catch (error) {
      console.error("Error loading image:", error);
      setToast({
        type: "error",
        message: "Failed to load CIN image",
      });
    } finally {
      setImageLoading((prev) => ({ ...prev, [voterId]: false }));
    }
  };

  const approveVoter = async (voterId: number) => {
    try {
      setApprovingId(voterId);
      const accessToken = AuthService.getAccessToken();

      const response = await fetch(
        `http://localhost:8080/admin/voters/${voterId}/approve`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to approve voter");
      }

      // Update the voter status locally
      setVoters(
        voters.map((voter) =>
          voter.id === voterId ? { ...voter, status: "VERIFIED" } : voter
        )
      );

      setToast({
        type: "success",
        message: "Voter approved successfully!",
      });
    } catch (error) {
      console.error("Error approving voter:", error);
      setToast({
        type: "error",
        message: "Failed to approve voter",
      });
    } finally {
      setApprovingId(null);
    }
  };

  const filteredVoters = voters.filter((voter) => {
    const matchesSearch =
      voter.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.cin.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || voter.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading voters...</p>
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Voter Management</h1>
        <p className="text-gray-600 mt-2">
          Manage voter registrations, verifications, and approvals
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Voters</p>
          <p className="text-2xl font-bold text-gray-900">{voters.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Verified</p>
          <p className="text-2xl font-bold text-green-600">
            {voters.filter((v) => v.status === "VERIFIED").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {voters.filter((v) => v.status === "PENDING").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Rejected</p>
          <p className="text-2xl font-bold text-red-600">
            {voters.filter((v) => v.status === "REJECTED").length}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Voters
            </label>
            <input
              type="text"
              placeholder="Search by name or CIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Voters Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Voter ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CIN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVoters.map((voter) => (
                <tr key={voter.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {voter.userId}
                    </div>
                    <div className="text-xs text-gray-500">
                      Reg ID: {voter.id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-gray-600">👤</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {voter.firstName} {voter.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono">
                      {voter.cin}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(voter.status)}`}
                    >
                      {voter.status}
                    </span>
                    {voter.rejectionReason && (
                      <div
                        className="text-xs text-gray-500 mt-1 max-w-xs truncate"
                        title={voter.rejectionReason}
                      >
                        {voter.rejectionReason}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleViewImage(voter.id)}
                        disabled={imageLoading[voter.id]}
                        className="text-indigo-600 hover:text-indigo-900 px-3 py-1 border border-indigo-600 rounded hover:bg-indigo-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {imageLoading[voter.id] ? (
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
                            Loading...
                          </span>
                        ) : (
                          "View CIN"
                        )}
                      </button>

                      <button
                        onClick={() => setSelectedVoter(voter)}
                        className="text-gray-600 hover:text-gray-900 px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition"
                      >
                        Details
                      </button>

                      {voter.status === "PENDING" && (
                        <button
                          onClick={() => approveVoter(voter.id)}
                          disabled={approvingId === voter.id}
                          className="bg-green-600 text-white hover:bg-green-700 px-3 py-1 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {approvingId === voter.id ? (
                            <span className="flex items-center">
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
                              Approving...
                            </span>
                          ) : (
                            "Approve"
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredVoters.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No voters found
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "No voter registrations yet"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Voter Details Modal */}
      {selectedVoter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Voter Details
                  </h3>
                  <p className="text-gray-600">
                    Review complete voter information
                  </p>
                </div>
                <button
                  onClick={() => setSelectedVoter(null)}
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

              {/* Voter Information */}
              <div className="space-y-6">
                {/* Personal Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-2">
                      Personal Information
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Full Name:</span>
                        <span className="font-medium">
                          {selectedVoter.firstName} {selectedVoter.lastName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">CIN Number:</span>
                        <span className="font-mono font-medium">
                          {selectedVoter.cin}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">User ID:</span>
                        <span className="font-medium">
                          {selectedVoter.userId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Registration ID:</span>
                        <span className="font-medium">{selectedVoter.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-2">
                      Verification Status
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedVoter.status)}`}
                        >
                          {selectedVoter.status}
                        </span>
                      </div>
                      {selectedVoter.rejectionReason && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            Rejection Reason:
                          </p>
                          <p className="text-sm bg-red-50 p-3 rounded border border-red-200">
                            {selectedVoter.rejectionReason}
                          </p>
                        </div>
                      )}
                      {selectedVoter.createdAt && (
                        <div className="text-sm text-gray-600">
                          Submitted:{" "}
                          {new Date(
                            selectedVoter.createdAt
                          ).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* CIN Image Preview */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">
                    CIN Document
                  </h4>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-center">
                      <div className="mb-4">
                        {cinLoading ? (
                          <div className="text-gray-500">
                            Loading CIN image...
                          </div>
                        ) : cinPreviewUrl ? (
                          <img
                            src={cinPreviewUrl}
                            alt="CIN Document"
                            className="max-h-64 mx-auto rounded-lg shadow"
                          />
                        ) : (
                          <img
                            src="https://via.placeholder.com/400x300?text=CIN+Document"
                            alt="Placeholder"
                            className="max-h-64 mx-auto rounded-lg shadow"
                          />
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {/* DOWNLOAD */}
                        <a
                          href={cinPreviewUrl ?? "#"}
                          download={`cin-${selectedVoter.id}.jpg`}
                          className={`inline-flex items-center justify-center px-4 py-2 rounded-lg transition
            ${
              cinPreviewUrl
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
                        >
                          Download Full Image
                        </a>

                        {/* VIEW */}
                        <button
                          disabled={!cinPreviewUrl}
                          onClick={() =>
                            cinPreviewUrl &&
                            window.open(cinPreviewUrl, "_blank")
                          }
                          className={`inline-flex items-center justify-center px-4 py-2 border rounded-lg transition
            ${
              cinPreviewUrl
                ? "border-gray-300 hover:bg-gray-50"
                : "border-gray-200 text-gray-400 cursor-not-allowed"
            }`}
                        >
                          View in New Tab
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setSelectedVoter(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Close
                  </button>
                  {selectedVoter.status !== "VERIFIED" && (
                    <button
                      onClick={() => {
                        approveVoter(selectedVoter.id);
                        setSelectedVoter(null);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Approve Verification
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
