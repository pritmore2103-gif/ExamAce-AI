import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, verifyOTP, resendOTP } from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // OTP STATE
  // ============================================================

  const [showOtpStep, setShowOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [resending, setResending] = useState(false);

  // ============================================================
  // REGISTER
  // ============================================================

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await registerUser({
        name,
        email,
        password,
      });

      if (response.message) {
        setShowOtpStep(true);
      } else {
        setError(response.error || "Registration failed.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
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
        setOtpSuccess("Email verified! Redirecting to login...");

        setTimeout(() => {
          navigate("/login");
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
  // SHARED LOGO
  // ============================================================

  const Logo = () => (
    <Link to="/" className="flex items-center justify-center gap-2 mb-8">
      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
        <span className="text-white font-bold text-sm">✓</span>
      </div>
      <span
        className="text-xl font-bold text-white"
        style={{ fontFamily: "'Sora', sans-serif" }}
      >
        ExamAce<span className="text-indigo-500">AI</span>
      </span>
    </Link>
  );

  // ============================================================
  // OTP STEP UI
  // ============================================================

  if (showOtpStep) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Logo />

          <div className="bg-[#151922] border border-slate-800 p-8 rounded-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/15 flex items-center justify-center mx-auto mb-5">
              <span className="text-2xl">📧</span>
            </div>

            <h1
              className="text-2xl font-bold text-white mb-2"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Verify your email
            </h1>

            <p className="text-slate-400 mb-6 text-sm leading-relaxed">
              We've sent a 6-digit code to{" "}
              <span className="text-white font-semibold">{email}</span>
            </p>

            {otpError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-sm">
                {otpError}
              </div>
            )}

            {otpSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-sm">
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
              className="w-full p-4 rounded-lg bg-[#0B0E14] border border-slate-800 focus:border-indigo-600 text-white text-center text-2xl tracking-[0.5em] mb-4 outline-none transition"
            />

            <button
              onClick={handleVerifyOtp}
              disabled={verifyingOtp}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 py-3 rounded-lg font-semibold mb-3 transition"
            >
              {verifyingOtp ? "Verifying..." : "Verify email"}
            </button>

            <button
              onClick={handleResendOtp}
              disabled={resending}
              className="text-sm text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 transition"
            >
              {resending ? "Sending..." : "Didn't get a code? Resend"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // REGISTRATION FORM
  // ============================================================

  return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Logo />

        <div className="bg-[#151922] border border-slate-800 p-8 rounded-2xl">
          <h1
            className="text-2xl font-bold text-center mb-1 text-white"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Create your account
          </h1>
          <p className="text-slate-400 text-center text-sm mb-6">
            Start preparing smarter, for free.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#0B0E14] border border-slate-800 focus:border-indigo-600 text-white outline-none transition"
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#0B0E14] border border-slate-800 focus:border-indigo-600 text-white outline-none transition"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#0B0E14] border border-slate-800 focus:border-indigo-600 text-white outline-none transition"
            />
            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 py-3 rounded-lg font-semibold transition"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </div>

          <Link
            to="/login"
            className="block text-center mt-6 text-sm text-slate-400 hover:text-white transition"
          >
            Already have an account? <span className="text-indigo-400">Log in</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
