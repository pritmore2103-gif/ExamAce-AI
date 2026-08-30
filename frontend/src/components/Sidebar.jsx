import { useNavigate } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <>
      {/* Mobile top bar - just a Dashboard button, no drawer/menu */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 p-4">
        <h1 className="text-xl font-bold text-white">ExamAce AI</h1>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-white text-sm font-semibold px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700"
        >
          🏠 Dashboard
        </button>
      </div>

      {/* Full Sidebar - desktop only */}
      <div className="hidden md:block w-64 bg-slate-900 p-6 min-h-screen">
        <h1 className="text-3xl font-bold mb-10 text-white">
          ExamAce AI
        </h1>

        <div className="space-y-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full text-left p-3 rounded-xl hover:bg-slate-800 text-white"
          >
            🏠 Dashboard
          </button>

          <button
            onClick={() => navigate("/planner")}
            className="w-full text-left p-3 rounded-xl hover:bg-slate-800 text-white"
          >
            📅 Study Planner
          </button>

          <button
            onClick={() => navigate("/notes")}
            className="w-full text-left p-3 rounded-xl hover:bg-slate-800 text-white"
          >
            📝 Notes Generator
          </button>

          <button
            onClick={() => navigate("/mcq-generator")}
            className="w-full text-left p-3 rounded-xl hover:bg-slate-800 text-white"
          >
            🧠 MCQ Generator
          </button>

          <button
            onClick={logout}
            className="w-full text-left p-3 rounded-xl bg-red-600 hover:bg-red-700 text-white"
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </>
  );
}
