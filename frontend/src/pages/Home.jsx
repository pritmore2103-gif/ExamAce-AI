import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <nav className="flex justify-between items-center px-8 py-6">
        <h1 className="text-3xl font-bold">
          ExamAce AI
        </h1>

        <Link
          to="/login"
          className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg"
        >
          Login
        </Link>
      </nav>

      <section className="text-center mt-24 px-6">
        <h1 className="text-6xl font-bold">
          Ace Every Exam
          <br />
          with AI
        </h1>

        <p className="text-xl text-slate-300 mt-6 max-w-3xl mx-auto">
          Your AI-powered study companion for Maharashtra Board,
          CBSE, MHT-CET, JEE and NEET.
        </p>

        <Link
          to="/login"
          className="inline-block mt-8 bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl text-lg font-semibold"
        >
          Get Started Free
        </Link>
      </section>

      <section className="mt-24 max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8">

          <div className="bg-slate-900 p-6 rounded-2xl">
            <h3 className="text-2xl font-bold mb-3">
              🤖 AI Doubt Solver
            </h3>

            <p className="text-slate-400">
              Ask questions and get instant explanations.
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl">
            <h3 className="text-2xl font-bold mb-3">
              📅 Study Planner
            </h3>

            <p className="text-slate-400">
              Generate personalized study schedules.
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl">
            <h3 className="text-2xl font-bold mb-3">
              📝 Notes Generator
            </h3>

            <p className="text-slate-400">
              Create revision notes instantly.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
}