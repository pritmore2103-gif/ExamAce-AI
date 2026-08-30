import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Sidebar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const go = (path) => {
    navigate(path);
    setIsOpen(false); // close drawer after navigating on mobile
  };

  return (
    <>
      {/* Mobile top bar with hamburger button */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 p-4">
        <h1 className="text-xl font-bold text-white">ExamAce AI</h1>
        <button
          onClick={() => setIsOpen(true)}
          className="text-white text-2xl"
          aria-label="Open menu"
        >
          ☰
        </button>
      </div>

      {/* Overlay behind drawer on mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      {/* Sidebar / Drawer */}
      <div
        className={`
          fixed md:static top-0 left-0 h-full md:h-auto min-h-screen
          w-64 bg-slate-900 p-6 z-50
          transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Close button, mobile only */}
        <div className="md:hidden flex justify-end mb-4">
          <button
            onClick={() => setIsOpen(false)}
            className="text-white text-2xl"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <h1 className="hidden md:block text-3xl font-bold mb-10 text-white">
          ExamAce AI
        </h1>

        <div className="space-y-4">

          <button
            onClick={() => go("/dashboard")}
            className="w-full text-left p-3 rounded-xl hover:bg-slate-800 text-white"
          >
            🏠 Dashboard
          </button>

          <button
            onClick={() => go("/planner")}
            className="w-full text-left p-3 rounded-xl hover:bg-slate-800 text-white"
          >
            📅 Study Planner
          </button>

          <button
            onClick={() => go("/notes")}
            className="w-full text-left p-3 rounded-xl hover:bg-slate-800 text-white"
          >
            📝 Notes Generator
          </button>

          <button
            onClick={() => go("/mcq-generator")}
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