import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useEffect, useState } from "react";
import { getDashboard } from "../services/api";

export default function Dashboard() {

  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total_notes: 0,
    recent_notes: [],
  });

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await getDashboard();
        setStats(data);
      } catch (error) {
        console.error(error);
      }
    }

    loadDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col md:flex-row">

      <Sidebar />

      <div className="flex-1 p-4 md:p-8">

        {/* Header */}
        <div className="mb-10">

          <h1
            className="text-3xl md:text-4xl font-bold"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Welcome back
          </h1>

          <p className="text-slate-400 mt-2">
            Track your learning journey with ExamAce AI
          </p>

        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">

          <div className="bg-[#151922] border border-slate-800 p-6 rounded-2xl">

            <h2 className="text-slate-400 text-sm font-medium">
              Total notes created
            </h2>

            <p className="text-5xl font-bold mt-3">
              {stats.total_notes}
            </p>

          </div>

          <div className="bg-[#151922] border border-slate-800 p-6 rounded-2xl">

            <h2 className="text-slate-400 text-sm font-medium">
              Recent notes
            </h2>

            <div className="mt-4 space-y-2">

              {stats.recent_notes?.length > 0 ? (
                stats.recent_notes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-[#0B0E14] border border-slate-800 p-3 rounded-lg text-sm"
                  >
                    {note.title}
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm">
                  No notes yet
                </p>
              )}

            </div>

          </div>

        </div>

        {/* Quick Actions */}
        <div className="mb-10">

          <h2
            className="text-2xl font-bold mb-4"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Quick actions
          </h2>

          <div className="grid md:grid-cols-3 gap-6">

            <div
              onClick={() => navigate("/planner")}
              className="bg-[#151922] border border-slate-800 p-6 rounded-2xl cursor-pointer hover:border-indigo-600/50 transition"
            >
              <div className="w-11 h-11 rounded-xl bg-indigo-600/15 flex items-center justify-center mb-4">
                <span className="text-xl">📅</span>
              </div>

              <h3 className="text-lg font-bold mb-1">
                Planner
              </h3>

              <p className="text-slate-400 text-sm">
                Organize your study schedule.
              </p>
            </div>

            <div
              onClick={() => navigate("/notes")}
              className="bg-[#151922] border border-slate-800 p-6 rounded-2xl cursor-pointer hover:border-amber-500/50 transition"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center mb-4">
                <span className="text-xl">📝</span>
              </div>

              <h3 className="text-lg font-bold mb-1">
                Notes generator
              </h3>

              <p className="text-slate-400 text-sm">
                Generate AI study notes.
              </p>
            </div>

            <div
              onClick={() => navigate("/mcq-generator")}
              className="bg-[#151922] border border-slate-800 p-6 rounded-2xl cursor-pointer hover:border-emerald-500/50 transition"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-4">
                <span className="text-xl">🧠</span>
              </div>

              <h3 className="text-lg font-bold mb-1">
                MCQ generator
              </h3>

              <p className="text-slate-400 text-sm">
                Create AI-generated MCQs instantly.
              </p>
            </div>

          </div>

        </div>

        {/* Activity Section */}
        <div>

          <h2
            className="text-2xl font-bold mb-4"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Learning overview
          </h2>

          <div className="bg-[#151922] border border-slate-800 p-6 rounded-2xl">

            <p className="text-slate-300 text-sm">
              Total notes stored:
              <span className="font-bold ml-2 text-white">
                {stats.total_notes}
              </span>
            </p>

            <p className="text-slate-500 mt-3 text-sm">
              More analytics will appear here as you
              generate notes and MCQs.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}
