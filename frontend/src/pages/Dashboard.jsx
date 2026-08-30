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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row">

      <Sidebar />

      <div className="flex-1 p-4 md:p-8">

        {/* Header */}
        <div className="mb-10">

          <h1 className="text-3xl md:text-4xl font-bold">
            Welcome Back 👋
          </h1>

          <p className="text-slate-400 mt-2">
            Track your learning journey with ExamAce AI
          </p>

        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">

          <div className="bg-slate-900 p-6 rounded-2xl">

            <h2 className="text-slate-400">
              Total Notes Created
            </h2>

            <p className="text-5xl font-bold mt-3">
              {stats.total_notes}
            </p>

          </div>

          <div className="bg-slate-900 p-6 rounded-2xl">

            <h2 className="text-slate-400">
              Recent Notes
            </h2>

            <div className="mt-4 space-y-2">

              {stats.recent_notes?.length > 0 ? (
                stats.recent_notes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-slate-800 p-3 rounded-lg"
                  >
                    {note.title}
                  </div>
                ))
              ) : (
                <p className="text-slate-500">
                  No notes yet
                </p>
              )}

            </div>

          </div>

        </div>

        {/* Quick Actions */}
        <div className="mb-10">

          <h2 className="text-2xl font-bold mb-4">
            Quick Actions
          </h2>

          <div className="grid md:grid-cols-3 gap-6">

            <div
              onClick={() => navigate("/planner")}
              className="bg-slate-900 p-6 rounded-2xl cursor-pointer hover:bg-slate-800 transition"
            >
              <h3 className="text-xl font-semibold mb-2">
                📅 Planner
              </h3>

              <p className="text-slate-400">
                Organize your study schedule.
              </p>
            </div>

            <div
              onClick={() => navigate("/notes")}
              className="bg-slate-900 p-6 rounded-2xl cursor-pointer hover:bg-slate-800 transition"
            >
              <h3 className="text-xl font-semibold mb-2">
                📝 Notes Generator
              </h3>

              <p className="text-slate-400">
                Generate AI study notes.
              </p>
            </div>

            <div
              onClick={() => navigate("/mcq-generator")}
              className="bg-slate-900 p-6 rounded-2xl cursor-pointer hover:bg-slate-800 transition"
            >
              <h3 className="text-xl font-semibold mb-2">
                🧠 MCQ Generator
              </h3>

              <p className="text-slate-400">
                Create AI-generated MCQs instantly.
              </p>
            </div>

          </div>

        </div>

        {/* Activity Section */}
        <div>

          <h2 className="text-2xl font-bold mb-4">
            Learning Overview
          </h2>

          <div className="bg-slate-900 p-6 rounded-2xl">

            <p className="text-slate-300">
              Total Notes Stored:
              <span className="font-bold ml-2">
                {stats.total_notes}
              </span>
            </p>

            <p className="text-slate-500 mt-3">
              More analytics will appear here as you
              generate notes and MCQs.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}