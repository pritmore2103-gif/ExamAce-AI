import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    const response = await registerUser({
      name,
      email,
      password,
    });

    if (response.message) {
      alert("Registration Successful");
      navigate("/login");
    } else {
      alert(response.error || "Registration Failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">

      <div className="bg-slate-900 p-8 rounded-2xl w-full max-w-md">

        <h1 className="text-3xl font-bold text-center mb-6 text-white">
          Create Account
        </h1>

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
            className="w-full p-3 rounded-lg bg-slate-800 text-white"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-slate-800 text-white"
          />

          <button
            onClick={handleRegister}
            className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg"
          >
            Register
          </button>

        </div>

        <Link
          to="/login"
          className="block text-center mt-6 text-blue-400"
        >
          Already have an account?
        </Link>

      </div>

    </div>
  );
}