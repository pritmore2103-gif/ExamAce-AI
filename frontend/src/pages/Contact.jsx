import { Link } from "react-router-dom";

export default function Contact() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white">

      <nav className="max-w-7xl mx-auto px-6 md:px-10 py-6 flex justify-between items-center">

        <Link to="/" className="text-xl font-bold">
          ExamAce<span className="text-indigo-500">AI</span>
        </Link>

        <Link
          to="/register"
          className="bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-lg text-sm font-semibold"
        >
          Get started
        </Link>

      </nav>


      <main className="max-w-4xl mx-auto px-6 py-16">

        <div className="text-center">

          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-wider">
            Support
          </p>

          <h1 className="text-4xl md:text-5xl font-bold mt-4">
            How can we help?
          </h1>

          <p className="text-slate-400 mt-5">
            Have a question, found a problem, or want to talk about
            ExamAce AI? We'd love to hear from you.
          </p>

        </div>


        <div className="grid md:grid-cols-2 gap-6 mt-14">

          <div className="bg-[#11151D] border border-slate-800 rounded-2xl p-7">

            <div className="text-3xl mb-5">
              💬
            </div>

            <h2 className="text-xl font-bold">
              General support
            </h2>

            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              For account problems, feature questions, bug reports or
              general assistance.
            </p>

            <a
              href="mailto:examace.ai21@gmail.com"
              className="inline-block mt-5 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
            >
              examace.ai21@gmail.com →
            </a>

          </div>


          <div className="bg-[#11151D] border border-slate-800 rounded-2xl p-7">

            <div className="text-3xl mb-5">
              🤝
            </div>

            <h2 className="text-xl font-bold">
              Partnerships
            </h2>

            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              Interested in using ExamAce AI at an academy, school or
              educational organization?
            </p>

            <a
              href="mailto:pritmore2103@gmail.com"
              className="inline-block mt-5 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
            >
              pritmore2103@gmail.com →
            </a>

          </div>

        </div>


        <div className="mt-8 bg-[#11151D] border border-slate-800 rounded-2xl p-7">

          <h2 className="text-xl font-bold">
            Before contacting us
          </h2>

          <p className="text-slate-400 text-sm mt-3 leading-relaxed">
            If you're reporting a technical issue, include the page where
            the problem occurred and a short description of what happened.
            Please do not send passwords or other sensitive account
            information.
          </p>

        </div>

      </main>

    </div>
  );
}
