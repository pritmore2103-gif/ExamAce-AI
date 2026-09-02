import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const navItems = [
    { path: "/dashboard", icon: "🏠", label: "Dashboard" },
    { path: "/planner", icon: "📅", label: "Study planner" },
    { path: "/notes", icon: "📝", label: "Notes generator" },
    { path: "/mcq-generator", icon: "🧠", label: "MCQ generator" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile top bar - just a Dashboard button, no drawer/menu */}
      <div className="md:hidden flex items-center justify-between bg-[#151922] border-b border-slate-800 p-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">✓</span>
          </div>
          <span
            className="text-lg font-bold text-white"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            ExamAce<span className="text-indigo-500">AI</span>
          </span>
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="text-white text-sm font-semibold px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition"
        >
          Dashboard
        </button>
      </div>

      {/* Full Sidebar - desktop only */}
      <div className="hidden md:flex md:flex-col w-64 bg-[#151922] border-r border-slate-800 p-6 min-h-screen">

        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">✓</span>
          </div>
          <span
            className="text-xl font-bold text-white"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            ExamAce<span className="text-indigo-500">AI</span>
          </span>
        </div>

        <div className="space-y-1 flex-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive(item.path)
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-600/30"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950/30 transition"
        >
          <span className="text-base">🚪</span>
          Log out
        </button>
      </div>
    </>
  );
}
