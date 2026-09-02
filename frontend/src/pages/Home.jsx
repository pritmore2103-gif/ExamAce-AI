import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white overflow-hidden">

      {/* ============================================================
          NAVBAR
      ============================================================ */}

      <nav className="border-b border-slate-800/60 bg-[#0B0E14]/80 backdrop-blur-xl sticky top-0 z-50">

        <div className="max-w-7xl mx-auto px-6 py-4">

          <div className="flex items-center justify-between">

            {/* LOGO */}

            <Link
              to="/"
              className="flex items-center gap-3"
            >

              <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-xl">
                🧠
              </div>

              <div>
                <h1
                  className="text-xl font-bold"
                  style={{
                    fontFamily: "'Sora', sans-serif",
                  }}
                >
                  ExamAce <span className="text-indigo-400">AI</span>
                </h1>

                <p className="text-[10px] text-slate-500 tracking-wider uppercase">
                  Study smarter
                </p>
              </div>

            </Link>


            {/* NAVIGATION */}

            <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">

              <a
                href="#features"
                className="hover:text-white transition"
              >
                Features
              </a>

              <a
                href="#how-it-works"
                className="hover:text-white transition"
              >
                How it works
              </a>

              <a
                href="#who"
                className="hover:text-white transition"
              >
                Who it's for
              </a>

            </div>


            {/* AUTH */}

            <div className="flex items-center gap-3">

              <Link
                to="/login"
                className="hidden sm:block px-4 py-2 text-sm text-slate-300 hover:text-white transition"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold transition shadow-lg shadow-indigo-600/20"
              >
                Register Free
              </Link>

            </div>

          </div>

        </div>

      </nav>


      {/* ============================================================
          HERO
      ============================================================ */}

      <section className="relative">

        {/* Background glow */}

        <div className="absolute inset-0 pointer-events-none">

          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full" />

          <div className="absolute top-40 left-10 w-40 h-40 bg-purple-600/5 blur-[80px] rounded-full" />

        </div>


        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-20 md:pt-32 md:pb-28">

          <div className="max-w-4xl mx-auto text-center">

            {/* BADGE */}

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm mb-7">

              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />

              AI-powered exam preparation

            </div>


            {/* HEADLINE */}

            <h1
              className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight"
              style={{
                fontFamily: "'Sora', sans-serif",
              }}
            >

              Stop studying harder.

              <br />

              <span className="text-indigo-400">
                Start studying smarter.
              </span>

            </h1>


            {/* DESCRIPTION */}

            <p className="mt-7 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">

              ExamAce AI turns your syllabus into personalized
              questions, notes, quizzes, and study plans —
              so you always know{" "}
              <span className="text-slate-200">
                what to study next.
              </span>

            </p>


            {/* CTA */}

            <div className="mt-9 flex flex-col sm:flex-row justify-center gap-4">

              <Link
                to="/register"
                className="px-7 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold text-lg transition shadow-xl shadow-indigo-600/20"
              >
                Start Preparing Free →
              </Link>

              <a
                href="#features"
                className="px-7 py-4 rounded-xl bg-[#151922] border border-slate-800 hover:border-slate-700 hover:bg-slate-800 font-semibold text-lg transition"
              >
                Explore Features
              </a>

            </div>


            <p className="mt-5 text-sm text-slate-600">
              Built for students who want a smarter way to prepare.
            </p>

          </div>


          {/* ========================================================
              HERO PRODUCT PREVIEW
          ======================================================== */}

          <div className="mt-20 max-w-5xl mx-auto">

            <div className="relative rounded-2xl border border-slate-800 bg-[#11151E] shadow-2xl shadow-black/40 overflow-hidden">

              {/* Browser top */}

              <div className="h-12 border-b border-slate-800 flex items-center px-5 gap-2">

                <div className="w-3 h-3 rounded-full bg-slate-700" />
                <div className="w-3 h-3 rounded-full bg-slate-700" />
                <div className="w-3 h-3 rounded-full bg-slate-700" />

                <div className="ml-5 flex-1 max-w-md mx-auto h-7 rounded-lg bg-[#0B0E14] border border-slate-800 flex items-center justify-center text-xs text-slate-600">
                  app.examace.ai
                </div>

              </div>


              {/* Dashboard preview */}

              <div className="p-5 md:p-8">

                <div className="grid md:grid-cols-3 gap-4">

                  {/* Stats */}

                  <div className="md:col-span-2 grid grid-cols-2 gap-4">

                    <div className="bg-[#151922] border border-slate-800 rounded-xl p-5">

                      <p className="text-sm text-slate-500">
                        Questions practiced
                      </p>

                      <p className="text-3xl font-bold mt-2">
                        1,248
                      </p>

                      <p className="text-xs text-emerald-400 mt-2">
                        ↑ Keep going
                      </p>

                    </div>


                    <div className="bg-[#151922] border border-slate-800 rounded-xl p-5">

                      <p className="text-sm text-slate-500">
                        Average score
                      </p>

                      <p className="text-3xl font-bold mt-2">
                        82%
                      </p>

                      <p className="text-xs text-indigo-400 mt-2">
                        Your progress
                      </p>

                    </div>


                    <div className="col-span-2 bg-[#151922] border border-slate-800 rounded-xl p-5">

                      <div className="flex items-center justify-between mb-5">

                        <div>
                          <p className="font-semibold">
                            Today's study plan
                          </p>

                          <p className="text-xs text-slate-500 mt-1">
                            Personalized by AI
                          </p>
                        </div>

                        <span className="text-indigo-400 text-sm">
                          68%
                        </span>

                      </div>


                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">

                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{
                            width: "68%",
                          }}
                        />

                      </div>


                      <div className="grid grid-cols-3 gap-3 mt-5">

                        <div className="bg-[#0B0E14] rounded-lg p-3">

                          <p className="text-xs text-slate-500">
                            Physics
                          </p>

                          <p className="text-sm font-semibold mt-1">
                            Current Electricity
                          </p>

                        </div>


                        <div className="bg-[#0B0E14] rounded-lg p-3">

                          <p className="text-xs text-slate-500">
                            Maths
                          </p>

                          <p className="text-sm font-semibold mt-1">
                            Matrices
                          </p>

                        </div>


                        <div className="bg-[#0B0E14] rounded-lg p-3">

                          <p className="text-xs text-slate-500">
                            Chemistry
                          </p>

                          <p className="text-sm font-semibold mt-1">
                            Solutions
                          </p>

                        </div>

                      </div>

                    </div>

                  </div>


                  {/* AI card */}

                  <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-5">

                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-xl">
                      ✨
                    </div>

                    <p className="font-semibold mt-4">
                      AI Study Assistant
                    </p>

                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                      Generate practice questions,
                      create notes and build a
                      personalized study plan.
                    </p>

                    <div className="mt-6 p-3 rounded-lg bg-[#0B0E14] border border-slate-800">

                      <p className="text-xs text-slate-500">
                        Recommended
                      </p>

                      <p className="text-sm mt-1">
                        Practice 10 Physics MCQs
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ============================================================
          TRUST / VALUE STRIP
      ============================================================ */}

      <section className="border-y border-slate-800/60 bg-[#0E1118]">

        <div className="max-w-6xl mx-auto px-6 py-10">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">

            <div>
              <p className="text-2xl font-bold">
                AI-powered
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Study assistance
              </p>
            </div>

            <div>
              <p className="text-2xl font-bold">
                Personalized
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Study plans
              </p>
            </div>

            <div>
              <p className="text-2xl font-bold">
                Practice
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Whenever you need
              </p>
            </div>

            <div>
              <p className="text-2xl font-bold">
                One place
              </p>
              <p className="text-sm text-slate-500 mt-1">
                For your preparation
              </p>
            </div>

          </div>

        </div>

      </section>


      {/* ============================================================
          FEATURES
      ============================================================ */}

      <section
        id="features"
        className="max-w-7xl mx-auto px-6 py-24 md:py-32"
      >

        <div className="max-w-2xl mb-14">

          <p className="text-indigo-400 font-semibold text-sm uppercase tracking-wider">
            Everything you need
          </p>

          <h2
            className="text-3xl md:text-5xl font-bold mt-3"
            style={{
              fontFamily: "'Sora', sans-serif",
            }}
          >
            Your AI-powered study toolkit.
          </h2>

          <p className="text-slate-400 text-lg mt-5 leading-relaxed">
            Instead of jumping between different tools,
            ExamAce AI brings the important parts of
            exam preparation together.
          </p>

        </div>


        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* MCQ */}

          <FeatureCard
            icon="🧠"
            title="AI MCQ Generator"
            description="Generate exam-focused multiple-choice questions based on your subject, topic and difficulty."
          />

          {/* Notes */}

          <FeatureCard
            icon="📝"
            title="Smart Notes"
            description="Turn topics into structured study notes designed to help you understand and revise faster."
          />

          {/* Planner */}

          <FeatureCard
            icon="📅"
            title="AI Study Planner"
            description="Create a personalized study schedule based on your subjects, available time and preparation goals."
          />

          {/* Quiz */}

          <FeatureCard
            icon="🎯"
            title="Practice Quizzes"
            description="Test yourself with generated quizzes and immediately see where you need more practice."
          />

          {/* Progress */}

          <FeatureCard
            icon="📊"
            title="Track Your Progress"
            description="See your study activity and quiz performance so you can make better decisions about what to revise."
          />

          {/* AI */}

          <FeatureCard
            icon="✨"
            title="AI Assistance"
            description="Use AI as a study companion to make preparation more organized, focused and efficient."
          />

        </div>

      </section>


      {/* ============================================================
          HOW IT WORKS
      ============================================================ */}

      <section
        id="how-it-works"
        className="bg-[#0E1118] border-y border-slate-800/60"
      >

        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">

          <div className="text-center max-w-2xl mx-auto">

            <p className="text-indigo-400 font-semibold text-sm uppercase tracking-wider">
              Simple workflow
            </p>

            <h2
              className="text-3xl md:text-5xl font-bold mt-3"
              style={{
                fontFamily: "'Sora', sans-serif",
              }}
            >
              From syllabus to study plan.
            </h2>

            <p className="text-slate-400 mt-5 text-lg">
              ExamAce AI helps turn a vague study session
              into a clear plan of action.
            </p>

          </div>


          <div className="grid md:grid-cols-3 gap-8 mt-16">

            <Step
              number="01"
              icon="📚"
              title="Choose what you're studying"
              description="Select your exam, subject, topic and difficulty."
            />

            <Step
              number="02"
              icon="🤖"
              title="Let AI prepare it"
              description="Generate questions, notes, quizzes or a study plan."
            />

            <Step
              number="03"
              icon="🚀"
              title="Study and improve"
              description="Practice, review your results and keep improving."
            />

          </div>

        </div>

      </section>


      {/* ============================================================
          WHO IT'S FOR
      ============================================================ */}

      <section
        id="who"
        className="max-w-7xl mx-auto px-6 py-24 md:py-32"
      >

        <div className="grid lg:grid-cols-2 gap-16 items-center">

          <div>

            <p className="text-indigo-400 font-semibold text-sm uppercase tracking-wider">
              Built for students
            </p>

            <h2
              className="text-3xl md:text-5xl font-bold mt-3"
              style={{
                fontFamily: "'Sora', sans-serif",
              }}
            >
              One platform.
              <br />
              Different study goals.
            </h2>

            <p className="text-slate-400 text-lg mt-6 leading-relaxed">
              Whether you're starting a chapter, revising
              before an exam or trying to improve your
              practice score, ExamAce AI is designed to
              adapt to your study session.
            </p>

          </div>


          <div className="space-y-4">

            <AudienceCard
              icon="🎓"
              title="School & junior college students"
              description="Prepare for board and competitive exams with structured practice."
            />

            <AudienceCard
              icon="🔥"
              title="Competitive exam aspirants"
              description="Practice topic-wise questions and focus on the areas that matter."
            />

            <AudienceCard
              icon="⚡"
              title="Students with limited study time"
              description="Use AI to quickly organize what to study instead of wasting time planning."
            />

          </div>

        </div>

      </section>


      {/* ============================================================
          BIG CTA
      ============================================================ */}

      <section className="px-6 pb-24 md:pb-32">

        <div className="max-w-5xl mx-auto relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-indigo-600/10 p-10 md:p-16 text-center">

          <div className="absolute inset-0 pointer-events-none">

            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-indigo-500/20 blur-[100px]" />

          </div>


          <div className="relative">

            <div className="text-4xl mb-5">
              🚀
            </div>

            <h2
              className="text-3xl md:text-5xl font-bold"
              style={{
                fontFamily: "'Sora', sans-serif",
              }}
            >
              Ready to study smarter?
            </h2>

            <p className="text-slate-400 text-lg mt-5 max-w-xl mx-auto">
              Create your ExamAce AI account and start
              building a better study routine today.
            </p>

            <Link
              to="/register"
              className="inline-flex mt-8 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold text-lg transition shadow-xl shadow-indigo-600/20"
            >
              Create Your Free Account →
            </Link>

          </div>

        </div>

      </section>


      {/* ============================================================
          FOOTER
      ============================================================ */}

      <footer className="border-t border-slate-800/60">

        <div className="max-w-7xl mx-auto px-6 py-8">

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="w-8 h-8 rounded-lg bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center">
                🧠
              </div>

              <span className="font-semibold">
                ExamAce <span className="text-indigo-400">AI</span>
              </span>

            </div>


            <p className="text-sm text-slate-600">
              AI-powered exam preparation.
            </p>


            <div className="flex gap-5 text-sm text-slate-500">

              <Link
                to="/login"
                className="hover:text-white transition"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="hover:text-white transition"
              >
                Register
              </Link>

            </div>

          </div>

        </div>

      </footer>

    </div>
  );
}


// ============================================================
// FEATURE CARD
// ============================================================

function FeatureCard({
  icon,
  title,
  description,
}) {
  return (
    <div className="group bg-[#151922] border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/30 hover:bg-[#181D28] transition">

      <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-2xl group-hover:scale-105 transition">
        {icon}
      </div>

      <h3 className="text-lg font-semibold mt-5">
        {title}
      </h3>

      <p className="text-slate-400 mt-2 leading-relaxed text-sm">
        {description}
      </p>

    </div>
  );
}


// ============================================================
// STEP
// ============================================================

function Step({
  number,
  icon,
  title,
  description,
}) {
  return (
    <div className="relative text-center">

      <div className="text-xs font-bold text-indigo-400 tracking-widest">
        {number}
      </div>

      <div className="w-16 h-16 mx-auto mt-4 rounded-2xl bg-[#151922] border border-slate-800 flex items-center justify-center text-2xl">
        {icon}
      </div>

      <h3 className="text-lg font-semibold mt-5">
        {title}
      </h3>

      <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-xs mx-auto">
        {description}
      </p>

    </div>
  );
}


// ============================================================
// AUDIENCE CARD
// ============================================================

function AudienceCard({
  icon,
  title,
  description,
}) {
  return (
    <div className="flex gap-4 p-5 rounded-2xl bg-[#151922] border border-slate-800">

      <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-indigo-600/10 flex items-center justify-center text-xl">
        {icon}
      </div>

      <div>

        <h3 className="font-semibold">
          {title}
        </h3>

        <p className="text-sm text-slate-400 mt-1 leading-relaxed">
          {description}
        </p>

      </div>

    </div>
  );
}
