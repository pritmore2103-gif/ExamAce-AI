import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useEffect, useState } from "react";
import { getDashboard, getUsage } from "../services/api";

function UsageCard({ title, icon, data, accent }) {

  const used = data?.used ?? 0;
  const limit = data?.limit ?? 0;
  const remaining = data?.remaining ?? Math.max(0, limit - used);

  const percentage = limit > 0
    ? Math.min(100, Math.round((used / limit) * 100))
    : 0;

  return (
    <div className="bg-[#151922] border border-slate-800 p-5 rounded-2xl">

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
            <span className="text-lg">{icon}</span>
          </div>

          <div>
            <h3 className="font-semibold text-white">
              {title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {data?.period === "monthly" ? "Resets monthly" : "Resets daily"}
            </p>
          </div>
        </div>

        <span className="text-sm font-semibold text-slate-300">
          {used} / {limit}
        </span>
      </div>

      <div className="mt-5 h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between items-center mt-3 text-xs">
        <span className="text-slate-500">
          {percentage}% used
        </span>
        <span className={remaining === 0 ? "text-red-400 font-medium" : "text-slate-300"}>
          {remaining} remaining
        </span>
      </div>

    </div>
  );
}

export default function Dashboard() {

  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total_notes: 0,
    recent_notes: [],
  });

  const [usage, setUsage] = useState(null);
  const [usageError, setUsageError] = useState("");

  useEffect(() => {

    async function loadDashboard() {

      try {
        const data = await getDashboard();
        setStats(data);
      } catch (error) {
        console.error(error);
      }

      try {
        const usageData = await getUsage();
        setUsage(usageData);
        setUsageError("");
      } catch (error) {
        console.error(error);
        setUsageError(error.message || "Unable to load usage.");
      }
    }

    loadDashboard();

  }, []);

  const isPro = usage?.plan === "pro";

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col md:flex-row">

      <Sidebar />

      <div className="flex-1 p-4 md:p-8">

        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

          <div>
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

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl border border-slate-700 bg-[#151922]">
              <span className="text-xs text-slate-500 mr-2">
                Current plan
              </span>
              <span className={`text-sm font-bold ${isPro ? "text-indigo-400" : "text-slate-200"}`}>
                {isPro ? "PRO" : "FREE"}
              </span>
            </div>

            {!isPro && (
              <button
                onClick={() => navigate("/pricing")}
                className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition text-sm font-semibold"
              >
                Upgrade to Pro
              </button>
            )}
          </div>

        </div>

        {/* Usage */}
        <div className="mb-10">

          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <h2
                className="text-2xl font-bold"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                AI usage
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Keep track of your ExamAce generation limits.
              </p>
            </div>

            {usage && (
              <button
                onClick={() => navigate("/pricing")}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition"
              >
                View plans →
              </button>
            )}
          </div>

          {usageError ? (
            <div className="bg-[#151922] border border-red-500/20 rounded-2xl p-5 text-sm text-red-300">
              {usageError}
            </div>
          ) : usage ? (
            <>
              <div className="grid md:grid-cols-3 gap-5">

                <UsageCard
                  title="MCQs"
                  icon="🧠"
                  data={usage.mcq}
                  accent="bg-emerald-500/15"
                />

                <UsageCard
                  title="AI Notes"
                  icon="📝"
                  data={usage.notes}
                  accent="bg-amber-500/15"
                />

                <UsageCard
                  title="Study Plans"
                  icon="📅"
                  data={usage.planner}
                  accent="bg-indigo-500/15"
                />

              </div>

              <div className="mt-4 bg-[#151922] border border-slate-800 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-sm text-slate-400">
                  AI tokens used across your account
                </span>
                <span className="text-sm font-semibold text-slate-200">
                  {(usage.ai_usage?.total_tokens ?? 0).toLocaleString()} tokens
                </span>
              </div>
            </>
          ) : (
            <div className="bg-[#151922] border border-slate-800 rounded-2xl p-6 text-sm text-slate-500">
              Loading usage...
            </div>
          )}

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

        {/* Learning overview */}
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
              Keep generating, practicing, and completing your study tasks to build your preparation history.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}
