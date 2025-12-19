// routes/verify-identity.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ApiService } from "../utils/api";

export default function VerifyIdentity() {
  // --- STATE (From Logic Source) ---
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // --- HANDLERS (From Logic Source) ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file); // ✅ IMPORTANT

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    setSelectedFile(null); // ✅ IMPORTANT

    const fileInput = document.getElementById("file") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData();

    // --- 🛠️ FIX HERE ---
    // Access the file input element directly via its 'name' property

    if (!selectedFile) {
      setToast({
        type: "error",
        title: "Missing file",
        message: "Please upload your CIN document",
      });
      setIsSubmitting(false);
      return;
    }

    formData.append("file", selectedFile);

    formData.append(
      "cin",
      (form.elements.namedItem("cin") as HTMLInputElement).value
    );
    formData.append(
      "dob",
      (form.elements.namedItem("dob") as HTMLInputElement).value
    );
    formData.append(
      "firstName",
      (form.elements.namedItem("firstName") as HTMLInputElement).value
    );
    formData.append(
      "lastName",
      (form.elements.namedItem("lastName") as HTMLInputElement).value
    );

    setIsSubmitting(true);
    setVerificationResult(null);

    try {
      const data = await ApiService.submitVerification(formData);
      setVerificationResult(data);

      // ... existing toast logic for success/info ...
      setToast({
        type: data.status === "APPROVED" ? "success" : "info",
        title:
          data.status === "APPROVED"
            ? "Verification Submitted"
            : "Verification Status",
        message:
          data.status === "APPROVED"
            ? "Your identity has been verified successfully! You can now vote."
            : `Status: ${data.status}. ${data.rejectionReason || ""}`,
      });
    } catch (err: any) {
      setToast({
        type: "error",
        title: "Verification Failed",
        message: err.message || "Something went wrong during verification",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- RENDER (From Design Source) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div
            className={`p-4 rounded-lg shadow-lg border ${
              toast.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : toast.type === "error"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {toast.type === "success" ? (
                  <svg
                    className="h-6 w-6 text-green-600"
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
                ) : toast.type === "error" ? (
                  <svg
                    className="h-6 w-6 text-red-600"
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
                ) : (
                  <svg
                    className="h-6 w-6 text-blue-600"
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
                )}
              </div>
              <div className="ml-3">
                <h3 className="font-medium">{toast.title}</h3>
                <p className="mt-1 text-sm">{toast.message}</p>
              </div>
              <button
                onClick={() => setToast(null)}
                className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 hover:opacity-75"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-5 w-5"
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
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Identity Verification
            </h1>
            <p className="text-gray-600 mt-2">
              Upload your National ID (CIN) to verify your identity for voting
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {/* Note: Standard form with onSubmit instead of Remix <Form> */}
              <form onSubmit={handleSubmit} encType="multipart/form-data">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="cin"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        CIN Number *
                      </label>
                      <input
                        type="text"
                        id="cin"
                        name="cin"
                        required
                        pattern="[A-Z0-9]{6,10}"
                        title="CIN should be 6-10 alphanumeric characters"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="e.g., BW22536"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Enter your National ID number
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="dob"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        id="dob"
                        name="dob"
                        required
                        max={new Date().toISOString().split("T")[0]}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="Enter your first name"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Last Name *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition"
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="file"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      CIN Document Image *
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-500 transition">
                      <div className="space-y-1 text-center">
                        {previewImage ? (
                          <div className="space-y-2">
                            <img
                              src={previewImage}
                              alt="CIN preview"
                              className="mx-auto h-32 object-contain rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Remove image
                            </button>
                          </div>
                        ) : (
                          <>
                            <svg
                              className="mx-auto h-12 w-12 text-gray-400"
                              stroke="currentColor"
                              fill="none"
                              viewBox="0 0 48 48"
                              aria-hidden="true"
                            >
                              <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <div className="flex text-sm text-gray-600">
                              <label
                                htmlFor="file"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-800 focus-within:outline-none"
                              >
                                <span>Upload a file</span>
                                <input
                                  id="file"
                                  name="file"
                                  type="file"
                                  required
                                  accept="image/*,.pdf"
                                  onChange={handleFileChange}
                                  className="sr-only"
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, PDF up to 5MB
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-yellow-400"
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
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Important Information
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>
                              Your CIN information will be cross-verified with
                              the uploaded document
                            </li>
                            <li>
                              Ensure the CIN image is clear and all information
                              is readable
                            </li>
                            <li>
                              Verification process may take up to 24 hours
                            </li>
                            <li>
                              You will be notified once verification is complete
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                        Verifying...
                      </span>
                    ) : (
                      "Submit for Verification"
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column - Information */}
            <div className="space-y-6">
              {/* Verification Status Card */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Verification Status
                </h3>
                {verificationResult ? (
                  <div className="space-y-4">
                    <div
                      className={`p-4 rounded-lg ${
                        verificationResult.status === "APPROVED"
                          ? "bg-green-50 border border-green-200"
                          : verificationResult.status === "REJECTED"
                            ? "bg-red-50 border border-red-200"
                            : "bg-blue-50 border border-blue-200"
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            verificationResult.status === "APPROVED"
                              ? "bg-green-500"
                              : verificationResult.status === "REJECTED"
                                ? "bg-red-500"
                                : "bg-blue-500"
                          }`}
                        ></div>
                        <span
                          className={`font-medium ${
                            verificationResult.status === "APPROVED"
                              ? "text-green-800"
                              : verificationResult.status === "REJECTED"
                                ? "text-red-800"
                                : "text-blue-800"
                          }`}
                        >
                          {verificationResult.status}
                        </span>
                      </div>
                      {verificationResult.rejectionReason && (
                        <p className="mt-2 text-sm text-gray-600">
                          Reason: {verificationResult.rejectionReason}
                        </p>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>
                        <strong>Verification ID:</strong>{" "}
                        {verificationResult.id}
                      </p>
                      {verificationResult.createdAt && (
                        <p>
                          <strong>Submitted:</strong>{" "}
                          {new Date(
                            verificationResult.createdAt
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
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
                    </div>
                    <p className="text-gray-600">
                      Submit your information to begin verification
                    </p>
                  </div>
                )}
              </div>

              {/* Requirements Card */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Requirements
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
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
                    <span className="text-gray-700">
                      Valid National ID (CIN)
                    </span>
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
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
                    <span className="text-gray-700">
                      Clear photo of CIN document
                    </span>
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
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
                    <span className="text-gray-700">
                      Matching personal information
                    </span>
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
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
                    <span className="text-gray-700">
                      Minimum voting age requirement met
                    </span>
                  </li>
                </ul>
              </div>

              {/* Help Card */}
              <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Need Help?
                </h3>
                <p className="text-gray-700 mb-4">
                  If you encounter any issues during verification, please
                  contact support.
                </p>
                <div className="space-y-2">
                  <a
                    href="mailto:support@evote.com"
                    className="flex items-center text-blue-600 hover:text-blue-800"
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
                        d="M3 8l7.89-5.26a2 2 0 012.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    support@evote.com
                  </a>
                  <a
                    href="tel:+212612345678"
                    className="flex items-center text-blue-600 hover:text-blue-800"
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
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    +212 612-345-678
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
