import { useState } from "react";
import { Link } from "react-router-dom";
import { registerUser } from "../services/api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);

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
        setRegistered(true);
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
  // SUCCESS STATE - shown after registering, before verifying
  // ============================================================

  if (registered) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="bg-slate-900 p-8 rounded-2xl w-full max-w-md text-center">
          <div className="text-5xl mb-4">📧</div>

          <h1 className="text-2xl font-bold text-white mb-3">
            Check your email
          </h1>

          <p className="text-slate-400">
            We've sent a verification link to{" "}
            <span className="text-white font-semibold">{email}</span>.
            Please click the link to activate your account before logging in.
          </p>

          <Link
            to="/login"
            className="block mt-6 text-blue-400 hover:text-blue-300"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // ============================================================
  // REGISTRATION FORM
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="bg-slate-900 p-8 rounded-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-white">
          Create Account
        </h1>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 rounded-lg bg-slate-800 text-white"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-slate-800
