import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white">

      {/* ================================================
          NAVBAR
      ================================================ */}

      <nav className="flex justify-between items-center px-6 md:px-10 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">✓</span>
          </div>
          <span className="text-xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
            ExamAce<span className="text-indigo-500">AI</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-slate-300 hover:text-white px-4 py-2 text-sm font-medium"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-lg text-sm font-semibold transition"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* ================================================
          HERO
      ================================================ */}

      <section className="text-center mt-16 md:mt-24 px-6">
        <div className="inline-flex items-center gap-2 bg-indigo-600/10 border border-indigo-600/30 text-indigo-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
          Built for MHT-CET, JEE, NEET and Board exams
        </div>

        <h1
          className="text-5xl md:text-6xl font-bold leading-tight max-w-4xl mx-auto"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          Study smarter,<br />
          not <span className="text-indigo-500">longer</span>
        </h1>

        <p className="text-lg text-slate-400 mt-6 max-w-2xl mx-auto leading-relaxed">
          AI-generated study plans, revision notes and practice questions,
          built around your exam, your subjects and your schedule.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-9">
          <Link
            to="/register"
            className="bg-indigo-600 hover:bg-indigo-700 px-8 py-3.5 rounded-xl text-base font-semibold transition"
          >
            Get started free
          </Link>
          <Link
            to="/login"
            className="border border-slate-700 hover:border-slate-500 px-8 py-3.5 rounded-xl text-base font-semibold transition"
          >
            I already have an account
          </Link>
        </div>
      </section>

      {/* ================================================
          FEATURES
      ================================================ */}

      <section className="mt-28 md:mt-32 max-w-6xl mx-auto px-6 pb-24">

        <h2
          className="text-3xl font-bold text-center mb-3"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          Everything you need to prepare
        </h2>
        <p className="text-slate-400 text-center mb-14 max-w-xl mx-auto">
          Three tools that work together to keep your preparation on track.
        </p>

        <div className="grid md:grid-cols-3 gap-6">

          <div className="bg-[#151922] border border-slate-800 p-7 rounded-2xl hover:border-indigo-600/50 transition">
            <div className="w-11 h-11 rounded-xl bg-indigo-600/15 flex items-center justify-center mb-5">
              <span className="text-xl">📅</span>
            </div>
            <h3 className="text-lg font-bold mb-2">Study planner</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Tell it your exam date and daily hours. Get a day-by-day plan
              that adapts to how strong or weak you are in each subject.
            </p>
          </div>

          <div className="bg-[#151922] border border-slate-800 p-7 rounded-2xl hover:border-amber-500/50 transition">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center mb-5">
              <span className="text-xl">📝</span>
            </div>
            <h3 className="text-lg font-bold mb-2">AI notes generator</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Turn any topic into clear, structured revision notes in
              seconds, ready to read the night before an exam.
            </p>
          </div>

          <div className="bg-[#151922] border border-slate-800 p-7 rounded-2xl hover:border-emerald-500/50 transition">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-5">
              <span className="text-xl">🧠</span>
            </div>
            <h3 className="text-lg font-bold mb-2">MCQ practice</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Generate practice questions by topic and difficulty, with
              instant scoring and explanations for every answer.
            </p>
          </div>

        </div>
      </section>

      {/* ================================================
          FOOTER
      ================================================ */}

      <footer className="border-t border-slate-800 py-8 px-6">
        <p className="text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} ExamAce AI. All rights reserved.
        </p>
      </footer>

    </div>
  );
}
