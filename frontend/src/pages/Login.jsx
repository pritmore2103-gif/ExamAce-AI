import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await loginUser({
        email,
        password,
      });

      if (response.access_token) {
        localStorage.setItem(
          "token",
          response.access_token
        );

        localStorage.setItem(
          "user",
          JSON.stringify(response)
        );

        navigate("/dashboard");
      } else {
        alert(response.error || "Login failed");
      }
    } catch (error) {
      console.error(error);
      alert("Server error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">

      <div className="bg-slate-900 p-8 rounded-2xl w-full max-w-md">

        <h1 className="text-3xl font-bold text-white text-center mb-6">
          ExamAce AI
        </h1>

        <p className="text-slate-400 text-center mb-8">
          Welcome Back
        </p>

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
            className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold"
          >
            Login
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