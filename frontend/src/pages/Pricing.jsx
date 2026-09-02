import { Link } from "react-router-dom";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white">

      <nav className="max-w-7xl mx-auto px-6 md:px-10 py-6 flex justify-between items-center">

        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            ✓
          </div>

          <span className="text-xl font-bold">
            ExamAce<span className="text-indigo-500">AI</span>
          </span>
        </Link>

        <Link
          to="/register"
          className="bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-lg text-sm font-semibold"
        >
          Get started
        </Link>

      </nav>

      <main className="max-w-5xl mx-auto px-6 py-16">

        <div className="text-center">

          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-wider">
            Pricing
          </p>

          <h1 className="text-4xl md:text-5xl font-bold mt-4">
            Start preparing for free.
          </h1>

          <p className="text-slate-400 mt-5 max-w-xl mx-auto">
            ExamAce AI is currently free while we build and improve the
            platform for students.
          </p>

        </div>


        <div className="max-w-md mx-auto mt-14">

          <div className="relative bg-[#11151D] border border-indigo-500/40 rounded-3xl p-8 shadow-2xl shadow-indigo-600/10">

            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-indigo-600 px-4 py-1 rounded-full text-xs font-semibold">
                CURRENT PLAN
              </span>
            </div>

            <div className="text-center pt-4">

              <h2 className="text-2xl font-bold">
                Free
              </h2>

              <div className="mt-5">
                <span className="text-5xl font-bold">₹0</span>
                <span className="text-slate-500"> / currently</span>
              </div>

              <p className="text-slate-500 text-sm mt-4">
                No payment required to get started.
              </p>

            </div>


            <div className="border-t border-slate-800 my-8" />

            <ul className="space-y-4 text-sm text-slate-300">

              <li>✓ AI study planning</li>
              <li>✓ AI revision notes</li>
              <li>✓ AI MCQ generation</li>
              <li>✓ Personalized preparation</li>
              <li>✓ Study progress tracking</li>
              <li>✓ Access to the ExamAce AI platform</li>

            </ul>


            <Link
              to="/register"
              className="block text-center mt-8 bg-indigo-600 hover:bg-indigo-500 py-3.5 rounded-xl font-semibold transition"
            >
              Create free account
            </Link>

          </div>

        </div>


        <p className="text-center text-xs text-slate-600 mt-8">
          Future plans and usage limits may change as ExamAce AI evolves.
        </p>

      </main>

    </div>
  );
}