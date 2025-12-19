// app/components/VerificationStatus.tsx
import { useEffect, useState } from "react";
import { ApiService } from "../utils/api";

interface VerificationStatus {
  id: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  createdAt: string;
}

export default function VerificationStatus() {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await ApiService.getVerificationStatus();
        setStatus(data);
      } catch (error) {
        console.error("Failed to fetch verification status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!status) return null;

  const statusConfig = {
    PENDING: { color: "yellow", text: "Pending Review" },
    APPROVED: { color: "green", text: "Verified" },
    REJECTED: { color: "red", text: "Rejected" },
  };

  const config = statusConfig[status.status];

  return (
    <div
      className={`p-4 rounded-lg border bg-${config.color}-50 border-${config.color}-200`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">Verification Status</h4>
          <div className="flex items-center mt-1">
            <div
              className={`w-3 h-3 rounded-full bg-${config.color}-500 mr-2`}
            ></div>
            <span className={`text-${config.color}-800 font-medium`}>
              {config.text}
            </span>
          </div>
          {status.rejectionReason && (
            <p className="mt-2 text-sm text-gray-600">
              {status.rejectionReason}
            </p>
          )}
        </div>
        {status.status === "REJECTED" && (
          <a
            href="/verify-identity"
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
          >
            Fix Issue
          </a>
        )}
      </div>
    </div>
  );
}
