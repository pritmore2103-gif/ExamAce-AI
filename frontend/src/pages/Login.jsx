import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, verifyOTP, resendOTP } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // UNVERIFIED / OTP STATE
  // ============================================================

  const [showOtpStep, setShowOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [resending, setResending] = useState(false);

  // ============================================================
  // LOGIN
  // ============================================================

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await loginUser({
        email,
        password,
      });

      if (response.access_token) {
        localStorage.setItem("token", response.access_token);
        localStorage.setItem("user", JSON.stringify(response));
        navigate("/dashboard");
        return;
      }

      if (response.unverified) {
        setShowOtpStep(true);
        return;
      }

      setError(response.error || "Login failed");
    } catch (err) {
      console.error(err);
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // VERIFY OTP
  // ============================================================

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      setOtpError("Please enter the 6-digit code.");
      return;
    }

    try {
      setVerifyingOtp(true);
      setOtpError("");
      setOtpSuccess("");

      const response = await verifyOTP(email, otp.trim());

      if (response.message && !response.detail) {
        setOtpSuccess("✅ Email verified! You can now log in.");

        setTimeout(() => {
          setShowOtpStep(false);
          setOtp("");
        }, 1500);
      } else {
        setOtpError(response.detail || "Invalid code. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setOtpError("Something went wrong. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // ============================================================
  // RESEND OTP
  // ============================================================

  const handleResendOtp = async () => {
    try {
      setResending(true);
      setOtpError("");
      setOtpSuccess("");

      const response = await resendOTP(email);

      setOtpSuccess(response.message || "A new code has been sent.");
    } catch (err) {
      console.error(err);
      setOtpError("Could not resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // ============================================================
  // OTP STEP UI
  // ============================================================

  if (showOtpStep) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="bg-slate-900 p-8 rounded-2xl w-full max-w-md text-center">
          <div className="text-5xl mb-4">📧</div>

          <h1 className="text-2xl font-bold text-white mb-2">
            Verify your email
          </h1>

          <p className="text-slate-400 mb-6">
            Your account isn't verified yet. Enter the code sent to{" "}
            <span className="text-white font-semibold">{email}</span>, or
            request a new one below.
          </p>

          {otpError && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700 text-red-300 text-sm">
              {otpError}
            </div>
          )}

          {otpSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-900/30 border border-emerald-700 text-emerald-300 text-sm">
              {otpSuccess}
            </div>
          )}

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter 6-digit code"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/[^0-9]/g, ""))
            }
            className="w-full p-4 rounded-lg bg-slate-800 text-white text-center text-2xl tracking-[0.5em] mb-4 outline-none"
          />

          <button
            onClick={handleVerifyOtp}
            disabled={verifyingOtp}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 py-3 rounded-lg font-semibold mb-3"
          >
            {verifyingOtp ? "Verifying..." : "Verify Email"}
          </button>

          <button
            onClick={handleResendOtp}
            disabled={resending}
            className="text-sm text-blue-400 hover:text-blue-300 disabled:text-slate-600 mb-4 block mx-auto"
          >
            {resending ? "Sending..." : "Didn't get a code? Resend"}
          </button>

          <button
            onClick={() => {
              setShowOtpStep(false);
              setOtp("");
              setOtpError("");
              setOtpSuccess("");
            }}
            className="text-sm text-slate-500 hover:text-slate-400"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // LOGIN FORM
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="bg-slate-900 p-8 rounded-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-6">
          ExamAce AI
        </h1>
        <p className="text-slate-400 text-center mb-8">
          Welcome Back
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-slate-800 text-white outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-slate-800 text-white outline-none"
          />
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 py-3 rounded-lg font-semibold"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>

        <Link
          to="/register"
          className="block text-center mt-6 text-blue-400"
        >
          Don't have an account? Register
        </Link>
        <Link
          to="/"
          className="block text-center mt-2 text-slate-400"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
