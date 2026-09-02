import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white overflow-hidden">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="relative z-20 max-w-7xl mx-auto px-6 md:px-10 py-5">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <span className="text-white font-bold">✓</span>
            </div>

            <span
              className="text-xl font-bold tracking-tight"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              ExamAce<span className="text-indigo-500">AI</span>
            </span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-2 sm:gap-4">

            <Link
              to="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition px-3 py-2"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="bg-indigo-600 hover:bg-indigo-500 px-4 sm:px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-lg shadow-indigo-600/20"
            >
              Get started
            </Link>

          </div>
        </div>
      </nav>


      {/* =====================================================
          HERO
      ===================================================== */}

      <main>

        <section className="relative px-6 pt-20 md:pt-28 pb-24">

          {/* Background glow */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative max-w-5xl mx-auto text-center">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 text-xs sm:text-sm font-medium mb-7">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
              AI-powered exam preparation
            </div>

            <div className="text-sm text-slate-500 mb-7">
             Developed by 
             <span className="text-slate-300 font-medium">
                Pritam More
             </span>
            </div>


            {/* Heading */}
            <h1
              className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05]"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Your smarter way to
              <br />

              <span className="bg-gradient-to-r from-indigo-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                prepare for exams.
              </span>
            </h1>


            {/* Description */}
            <p className="mt-7 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-slate-400 leading-relaxed">
              ExamAce AI turns your exam goals into a personalized study
              plan, generates revision notes, and gives you unlimited-style
              practice through AI-powered MCQs.
            </p>


            {/* CTA */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-9">

              <Link
                to="/register"
                className="group bg-indigo-600 hover:bg-indigo-500 px-7 py-3.5 rounded-xl font-semibold transition shadow-xl shadow-indigo-600/20"
              >
                Start preparing free
                <span className="inline-block ml-2 group-hover:translate-x-1 transition">
                  →
                </span>
              </Link>

              <Link
                to="/login"
                className="px-7 py-3.5 rounded-xl border border-slate-700 hover:border-slate-500 bg-white/[0.02] hover:bg-white/[0.04] font-semibold transition"
              >
                I already have an account
              </Link>

            </div>


            {/* Small trust line */}
            <p className="mt-5 text-xs text-slate-500">
              Built for students preparing for MHT-CET, JEE, NEET & board exams.
            </p>

          </div>


          {/* =================================================
              PRODUCT PREVIEW
          ================================================= */}

          <div className="relative max-w-5xl mx-auto mt-20">

            <div className="rounded-2xl border border-slate-800 bg-[#11151D] shadow-2xl shadow-black/40 overflow-hidden">

              {/* Fake browser header */}
              <div className="h-11 border-b border-slate-800 flex items-center px-4 gap-2">

                <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />

                <div className="ml-4 h-6 flex-1 max-w-md mx-auto rounded-md bg-[#0B0E14] border border-slate-800" />

              </div>


              {/* Dashboard mockup */}
              <div className="p-5 sm:p-8">

                <div className="grid md:grid-cols-3 gap-5">

                  {/* Main plan */}
                  <div className="md:col-span-2 rounded-xl bg-[#0B0E14] border border-slate-800 p-5">

                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-xs text-slate-500">
                          TODAY'S PLAN
                        </p>

                        <h3 className="font-semibold mt-1">
                          Wednesday, September 2
                        </h3>
                      </div>

                      <span className="text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-lg">
                        6.5 hrs
                      </span>
                    </div>


                    <div className="space-y-3">

                      {[
                        ["Physics", "Current Electricity", "2 hrs"],
                        ["Mathematics", "Matrices & Determinants", "2 hrs"],
                        ["Chemistry", "Chemical Bonding", "1.5 hrs"],
                        ["MCQ Practice", "Mixed Revision", "1 hr"],
                      ].map(([subject, topic, time], index) => (

                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-[#151922] border border-slate-800"
                        >

                          <div className="flex items-center gap-3">

                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-xs text-indigo-400">
                              {index + 1}
                            </div>

                            <div>
                              <p className="text-sm font-medium">
                                {topic}
                              </p>

                              <p className="text-xs text-slate-500">
                                {subject}
                              </p>
                            </div>

                          </div>

                          <span className="text-xs text-slate-500">
                            {time}
                          </span>

                        </div>

                      ))}

                    </div>

                  </div>


                  {/* Progress */}
                  <div className="rounded-xl bg-[#0B0E14] border border-slate-800 p-5">

                    <p className="text-xs text-slate-500">
                      YOUR PROGRESS
                    </p>

                    <div className="mt-5">

                      <div className="flex justify-between items-end">

                        <span className="text-4xl font-bold">
                          72%
                        </span>

                        <span className="text-xs text-emerald-400">
                          +8% this week
                        </span>

                      </div>

                      <div className="h-2 bg-slate-800 rounded-full mt-4 overflow-hidden">

                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: "72%" }}
                        />

                      </div>

                    </div>


                    <div className="mt-8 space-y-4">

                      <div>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-slate-400">
                            Mathematics
                          </span>
                          <span>85%</span>
                        </div>

                        <div className="h-1.5 bg-slate-800 rounded-full">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: "85%" }}
                          />
                        </div>
                      </div>


                      <div>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-slate-400">
                            Physics
                          </span>
                          <span>61%</span>
                        </div>

                        <div className="h-1.5 bg-slate-800 rounded-full">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: "61%" }}
                          />
                        </div>
                      </div>


                      <div>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-slate-400">
                            Chemistry
                          </span>
                          <span>74%</span>
                        </div>

                        <div className="h-1.5 bg-slate-800 rounded-full">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: "74%" }}
                          />
                        </div>
                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>

            {/* Glow behind dashboard */}
            <div className="absolute -inset-5 bg-indigo-600/10 blur-3xl -z-10" />

          </div>

        </section>


        {/* =====================================================
            PROBLEM / SOLUTION
        ===================================================== */}

        <section className="border-y border-slate-800/70 bg-[#0D1118] px-6 py-24">

          <div className="max-w-6xl mx-auto">

            <div className="max-w-2xl mb-14">

              <p className="text-indigo-400 text-sm font-semibold uppercase tracking-wider">
                Stop studying randomly
              </p>

              <h2
                className="text-3xl md:text-4xl font-bold mt-3"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                Less confusion.
                <br />
                More focused preparation.
              </h2>

              <p className="text-slate-400 mt-5 leading-relaxed">
                Most students know they need to study. The difficult part is
                deciding what to study, when to study it, and whether they
                actually understand it.
              </p>

            </div>


            <div className="grid md:grid-cols-3 gap-6">

              <div className="p-6 rounded-2xl border border-slate-800 bg-[#11151D]">
                <div className="text-2xl mb-5">😵‍💫</div>

                <h3 className="font-bold text-lg">
                  Don't know where to start?
                </h3>

                <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                  Tell ExamAce your exam date, subjects and available study
                  time. It creates a structured roadmap for you.
                </p>
              </div>


              <div className="p-6 rounded-2xl border border-slate-800 bg-[#11151D]">
                <div className="text-2xl mb-5">📚</div>

                <h3 className="font-bold text-lg">
                  Too much to revise?
                </h3>

                <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                  Generate concise AI-powered revision notes so you can focus
                  on understanding instead of organizing everything yourself.
                </p>
              </div>


              <div className="p-6 rounded-2xl border border-slate-800 bg-[#11151D]">
                <div className="text-2xl mb-5">🎯</div>

                <h3 className="font-bold text-lg">
                  Not enough practice?
                </h3>

                <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                  Generate topic-specific MCQs and use them to test your
                  understanding before the real exam.
                </p>
              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            FEATURES
        ===================================================== */}

        <section className="px-6 py-24">

          <div className="max-w-6xl mx-auto">

            <div className="text-center max-w-2xl mx-auto">

              <p className="text-indigo-400 text-sm font-semibold uppercase tracking-wider">
                Everything in one place
              </p>

              <h2
                className="text-3xl md:text-4xl font-bold mt-3"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                Your AI study toolkit
              </h2>

              <p className="text-slate-400 mt-4">
                Tools designed to help you plan, learn, practice and track
                your preparation.
              </p>

            </div>


            <div className="grid md:grid-cols-3 gap-6 mt-14">

              {/* Planner */}
              <div className="group rounded-2xl border border-slate-800 bg-[#11151D] p-7 hover:border-indigo-500/50 transition">

                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-2xl mb-6">
                  📅
                </div>

                <h3 className="text-xl font-bold">
                  AI Study Planner
                </h3>

                <p className="text-slate-400 text-sm leading-relaxed mt-3">
                  Turn your exam date and available study hours into a
                  structured day-by-day preparation plan.
                </p>

                <div className="mt-6 text-xs text-indigo-400">
                  Personalized → Adaptive → Organized
                </div>

              </div>


              {/* Notes */}
              <div className="group rounded-2xl border border-slate-800 bg-[#11151D] p-7 hover:border-amber-500/50 transition">

                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-2xl mb-6">
                  📝
                </div>

                <h3 className="text-xl font-bold">
                  AI Revision Notes
                </h3>

                <p className="text-slate-400 text-sm leading-relaxed mt-3">
                  Generate clear, structured notes for the topics you need
                  to revise without spending hours making them yourself.
                </p>

                <div className="mt-6 text-xs text-amber-400">
                  Clear → Structured → Exam-focused
                </div>

              </div>


              {/* MCQ */}
              <div className="group rounded-2xl border border-slate-800 bg-[#11151D] p-7 hover:border-emerald-500/50 transition">

                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-2xl mb-6">
                  🧠
                </div>

                <h3 className="text-xl font-bold">
                  AI MCQ Practice
                </h3>

                <p className="text-slate-400 text-sm leading-relaxed mt-3">
                  Practice questions by subject, topic and difficulty, then
                  review your answers and explanations.
                </p>

                <div className="mt-6 text-xs text-emerald-400">
                  Practice → Test → Improve
                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            HOW IT WORKS
        ===================================================== */}

        <section className="px-6 py-24 bg-[#0D1118] border-y border-slate-800/70">

          <div className="max-w-6xl mx-auto">

            <div className="text-center">

              <p className="text-indigo-400 text-sm font-semibold uppercase tracking-wider">
                Simple by design
              </p>

              <h2
                className="text-3xl md:text-4xl font-bold mt-3"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                Start in minutes
              </h2>

            </div>


            <div className="grid md:grid-cols-3 gap-10 mt-16">

              <div className="text-center">

                <div className="w-12 h-12 mx-auto rounded-full bg-indigo-600 flex items-center justify-center font-bold">
                  1
                </div>

                <h3 className="font-bold text-lg mt-5">
                  Create your profile
                </h3>

                <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                  Select your exam, subjects and preparation preferences.
                </p>

              </div>


              <div className="text-center">

                <div className="w-12 h-12 mx-auto rounded-full bg-indigo-600 flex items-center justify-center font-bold">
                  2
                </div>

                <h3 className="font-bold text-lg mt-5">
                  Tell us your goals
                </h3>

                <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                  Set your exam date, available study time and subject
                  strengths.
                </p>

              </div>


              <div className="text-center">

                <div className="w-12 h-12 mx-auto rounded-full bg-indigo-600 flex items-center justify-center font-bold">
                  3
                </div>

                <h3 className="font-bold text-lg mt-5">
                  Let AI help
                </h3>

                <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                  Generate plans, notes and practice questions whenever you
                  need them.
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            WHO IS IT FOR?
        ===================================================== */}

        <section className="px-6 py-24">

          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center">

            <div>

              <p className="text-indigo-400 text-sm font-semibold uppercase tracking-wider">
                Built for students
              </p>

              <h2
                className="text-3xl md:text-4xl font-bold mt-3"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                One place for your entire preparation.
              </h2>

              <p className="text-slate-400 mt-5 leading-relaxed">
                Whether you're preparing for a competitive entrance exam or
                your board exams, ExamAce AI helps you organize your
                preparation around your own schedule.
              </p>

              <Link
                to="/register"
                className="inline-flex mt-7 bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl font-semibold transition"
              >
                Create your free account →
              </Link>

            </div>


            <div className="grid grid-cols-2 gap-4">

              {[
                ["🎓", "Board Exams", "Stay on top of your syllabus."],
                ["⚡", "MHT-CET", "Practice smarter for CET."],
                ["🚀", "JEE", "Build consistent preparation."],
                ["🩺", "NEET", "Organize your revision."],
              ].map(([icon, title, description]) => (

                <div
                  key={title}
                  className="rounded-2xl border border-slate-800 bg-[#11151D] p-5"
                >

                  <div className="text-2xl">
                    {icon}
                  </div>

                  <h3 className="font-bold mt-4">
                    {title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {description}
                  </p>

                </div>

              ))}

            </div>

          </div>

        </section>


        {/* =====================================================
            FINAL CTA
        ===================================================== */}

        <section className="px-6 py-24">

          <div className="relative max-w-5xl mx-auto overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-600/20 via-[#151922] to-[#11151D] p-10 md:p-16 text-center">

            <div className="absolute w-72 h-72 bg-indigo-600/20 blur-[100px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

            <div className="relative">

              <h2
                className="text-3xl md:text-5xl font-bold"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                Ready to study smarter?
              </h2>

              <p className="text-slate-400 mt-5 max-w-xl mx-auto">
                Create your ExamAce AI account and start building a more
                organized exam preparation routine today.
              </p>

              <Link
                to="/register"
                className="inline-flex mt-8 bg-indigo-600 hover:bg-indigo-500 px-8 py-3.5 rounded-xl font-semibold transition shadow-xl shadow-indigo-600/20"
              >
                Get started free →
              </Link>

            </div>

          </div>

        </section>

      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t border-slate-800 px-6 py-8">

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">

          <div className="flex items-center gap-2">

            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-xs font-bold">✓</span>
            </div>

            <span className="text-sm font-semibold">
              ExamAce<span className="text-indigo-500">AI</span>
            </span>

          </div>

          <p className="text-xs text-slate-500 text-center">
            © {new Date().getFullYear()} ExamAce AI. All rights reserved.
          </p>

        </div>

      </footer>

    </div>
  );
}
