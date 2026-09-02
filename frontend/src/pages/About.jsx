import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white">

      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-6 md:px-10 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <span className="font-bold">✓</span>
          </div>

          <span
            className="text-xl font-bold"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            ExamAce<span className="text-indigo-500">AI</span>
          </span>
        </Link>

        <Link
          to="/register"
          className="bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-lg text-sm font-semibold transition"
        >
          Get started
        </Link>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">

        <div className="text-center mb-16">
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-wider">
            About ExamAce AI
          </p>

          <h1
            className="text-4xl md:text-5xl font-bold mt-4"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Making exam preparation more organized.
          </h1>

          <p className="text-slate-400 mt-6 text-lg leading-relaxed">
            ExamAce AI is an AI-powered study platform designed to help
            students plan their preparation, revise important concepts and
            practice questions in one place.
          </p>
        </div>

        <div className="space-y-8">

          <section className="bg-[#11151D] border border-slate-800 rounded-2xl p-7">
            <h2 className="text-2xl font-bold mb-4">
              Our mission
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Preparing for an exam can become overwhelming when students
              have to manage their syllabus, revision, practice and time
              separately. ExamAce AI aims to bring these parts together into
              a simple study experience.
            </p>
          </section>

          <section className="bg-[#11151D] border border-slate-800 rounded-2xl p-7">
            <h2 className="text-2xl font-bold mb-4">
              What ExamAce AI does
            </h2>

            <div className="grid md:grid-cols-3 gap-5">

              <div>
                <div className="text-2xl mb-3">📅</div>
                <h3 className="font-semibold">Plan</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Create structured study plans around your exam goals.
                </p>
              </div>

              <div>
                <div className="text-2xl mb-3">📝</div>
                <h3 className="font-semibold">Revise</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Generate concise revision material for your topics.
                </p>
              </div>

              <div>
                <div className="text-2xl mb-3">🧠</div>
                <h3 className="font-semibold">Practice</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Practice AI-generated questions and review explanations.
                </p>
              </div>

            </div>
          </section>

          <section className="bg-[#11151D] border border-slate-800 rounded-2xl p-7">
            <h2 className="text-2xl font-bold mb-4">
              Built by
            </h2>

            <p className="text-slate-400 leading-relaxed">
              ExamAce AI is developed by{" "}
              <span className="text-white font-semibold">
                Pritam More
              </span>
              , with the goal of building a practical AI-powered learning
              platform for students.
            </p>
          </section>

        </div>

      </main>

      <footer className="border-t border-slate-800 mt-10 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} ExamAce AI. All rights reserved.
      </footer>

    </div>
  );
}