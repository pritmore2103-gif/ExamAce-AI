import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verifyEmail } from "../services/api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function runVerification() {
      if (!token) {
        setStatus("error");
        setMessage("No verification token found in the link.");
        return;
      }

      try {
        const response = await verifyEmail(token);

        if (response.message) {
          setStatus("success");
          setMessage(response.message);
        } else {
          setStatus("error");
          setMessage(response.detail || "Verification failed.");
        }
      } catch (err) {
        console.error(err);
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    }

    runVerification();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="bg-slate-900 p-8 rounded-2xl w-full max-w-md text-center">

        {status === "loading" && (
          <>
            <div className="text-5xl mb-4 animate-pulse">📧</div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Verifying your email...
            </h1>
            <p className="text-slate-400">Please wait a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Email Verified!
            </h1>
            <p className="text-slate-400 mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold text-white"
            >
              Go to Login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Verification Failed
            </h1>
            <p className="text-slate-400 mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-block bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-semibold text-white"
            >
              Back to Login
            </Link>
          </>
        )}

      </div>
    </div>
  );
}
