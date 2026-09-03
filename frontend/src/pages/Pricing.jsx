import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Get started with essential AI-powered exam preparation.",
    button: "Get Started",
    buttonLink: "/register",
    popular: false,
    features: [
      "20 MCQs per day",
      "2 AI notes per day",
      "1 AI study plan per month",
      "Basic quiz access",
      "Study progress tracking",
      "Save your notes",
    ],
  },
  {
    name: "Pro",
    price: "₹699",
    period: "per month",
    description:
      "Everything you need for serious and consistent exam preparation.",
    button: "Start with Pro",
    buttonLink: "/register",
    popular: true,
    features: [
      "200 MCQs per day",
      "10 AI notes per day",
      "5 AI study plans per month",
      "Advanced quiz practice",
      "Unlimited saved notes",
      "Study progress tracking",
      "Priority AI generation",
      "No ads",
    ],
  },
];

const faqs = [
  {
    question: "Is Pro really ₹699 per month?",
    answer:
      "Yes. ExamAce Pro is ₹699 per month. There are no additional platform charges from ExamAce for the plan itself.",
  },
  {
    question: "Can I use all 200 MCQs every day?",
    answer:
      "Yes. Pro includes up to 200 AI-generated MCQs per day, subject to ExamAce's fair-use and security protections.",
  },
  {
    question: "How many AI study plans can I generate?",
    answer:
      "Pro includes up to 5 AI study-plan generations per month. This keeps the feature useful while preventing unnecessary repeated plan generation.",
  },
  {
    question: "Can I cancel Pro?",
    answer:
      "Yes. You can cancel your subscription according to the subscription and billing terms applicable at the time of purchase.",
  },
  {
    question: "Do I need Pro to use ExamAce?",
    answer:
      "No. You can use the Free plan without paying. Pro is designed for students who want substantially higher AI usage.",
  },
];

function CheckIcon() {
  return (
    <svg
      className="w-5 h-5 text-indigo-400 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

export default function Pricing() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white">
      {/* NAVBAR */}
      <nav className="border-b border-white/10 bg-[#0B0E14]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="text-2xl font-bold tracking-tight"
          >
            ExamAce<span className="text-indigo-400"> AI</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-gray-300">
            <Link
              to="/"
              className="hover:text-white transition"
            >
              Home
            </Link>

            <Link
              to="/about"
              className="hover:text-white transition"
            >
              About
            </Link>

            <Link
              to="/pricing"
              className="text-white"
            >
              Pricing
            </Link>

            <Link
              to="/contact"
              className="hover:text-white transition"
            >
              Support
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:block px-4 py-2 text-sm text-gray-300 hover:text-white transition"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition text-sm font-semibold"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/20 blur-[120px] rounded-full" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-14 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 text-indigo-300 text-sm mb-7">
            Simple pricing. Powerful preparation.
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
            Choose the plan that
            <span className="text-indigo-400"> fits your preparation.</span>
          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-400 leading-relaxed">
            Start for free and upgrade to ExamAce Pro when you need more AI
            practice, notes, and personalized study planning.
          </p>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl border p-8 ${
                plan.popular
                  ? "border-indigo-500/60 bg-gradient-to-b from-indigo-500/15 to-[#11151F] shadow-2xl shadow-indigo-500/10"
                  : "border-white/10 bg-[#11151F]"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="px-5 py-2 rounded-full bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h2 className="text-2xl font-bold">
                  {plan.name}
                </h2>

                <p className="mt-3 text-gray-400 text-sm leading-relaxed min-h-[48px]">
                  {plan.description}
                </p>
              </div>

              <div className="flex items-end gap-2 mb-8">
                <span className="text-5xl font-bold">
                  {plan.price}
                </span>

                <span className="text-gray-500 pb-2">
                  / {plan.period}
                </span>
              </div>

              <Link
                to={plan.buttonLink}
                className={`block w-full text-center py-3.5 rounded-xl font-semibold transition ${
                  plan.popular
                    ? "bg-indigo-500 hover:bg-indigo-600 text-white"
                    : "border border-white/10 bg-white/5 hover:bg-white/10 text-white"
                }`}
              >
                {plan.button}
              </Link>

              <div className="mt-8 pt-8 border-t border-white/10">
                <p className="text-sm font-semibold text-gray-300 mb-5">
                  What's included
                </p>

                <div className="space-y-4">
                  {plan.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-3"
                    >
                      <CheckIcon />

                      <span className="text-sm text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRO HIGHLIGHT */}
      <section className="border-y border-white/10 bg-[#0F131C]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-indigo-400 font-semibold text-sm uppercase tracking-wider">
              ExamAce Pro
            </p>

            <h2 className="mt-3 text-3xl md:text-4xl font-bold">
              Built for serious exam preparation.
            </h2>

            <p className="mt-5 text-gray-400 leading-relaxed">
              Stop switching between different tools for practice,
              revision, and planning. ExamAce Pro brings the core preparation
              workflow together in one place.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5 mt-12">
            <div className="rounded-2xl border border-white/10 bg-[#11151F] p-6">
              <div className="text-3xl font-bold text-indigo-400">
                200
              </div>

              <p className="mt-2 font-semibold">
                MCQs / day
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Practice concepts with AI-generated questions.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#11151F] p-6">
              <div className="text-3xl font-bold text-indigo-400">
                10
              </div>

              <p className="mt-2 font-semibold">
                AI notes / day
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Generate structured revision material whenever you need it.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#11151F] p-6">
              <div className="text-3xl font-bold text-indigo-400">
                5
              </div>

              <p className="mt-2 font-semibold">
                AI plans / month
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Build personalized preparation strategies around your exam.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ACADEMY */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 to-transparent p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <p className="text-indigo-400 text-sm font-semibold uppercase tracking-wider">
                For Academies
              </p>

              <h2 className="mt-3 text-2xl md:text-3xl font-bold">
                Want ExamAce for your students?
              </h2>

              <p className="mt-4 text-gray-400 max-w-xl leading-relaxed">
                Talk to us about academy partnerships, student accounts,
                customized usage limits, and institutional deployments.
              </p>
            </div>

            <Link
              to="/contact"
              className="flex-shrink-0 px-6 py-3.5 rounded-xl border border-indigo-400/30 bg-indigo-500/10 hover:bg-indigo-500/20 transition font-semibold text-center"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-white/10 bg-[#0F131C]">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-indigo-400 text-sm font-semibold uppercase tracking-wider">
              FAQ
            </p>

            <h2 className="mt-3 text-3xl md:text-4xl font-bold">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-white/10 bg-[#11151F] overflow-hidden"
              >
                <summary className="cursor-pointer list-none px-6 py-5 flex items-center justify-between gap-5">
                  <span className="font-semibold text-gray-200">
                    {faq.question}
                  </span>

                  <span className="text-gray-500 text-xl group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>

                <div className="px-6 pb-5 text-sm text-gray-400 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[-150px] w-[600px] h-[300px] bg-indigo-600/20 blur-[120px] rounded-full" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 py-24 text-center">
          <h2 className="text-3xl md:text-5xl font-bold">
            Ready to study smarter?
          </h2>

          <p className="mt-5 text-gray-400 max-w-xl mx-auto">
            Start with ExamAce for free and upgrade to Pro whenever you're
            ready.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="px-7 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition font-semibold"
            >
              Create Free Account
            </Link>

            <Link
              to="/"
              className="px-7 py-3.5 rounded-xl border border-white/10 hover:bg-white/5 transition font-semibold"
            >
              Explore ExamAce
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="text-xl font-bold">
                ExamAce<span className="text-indigo-400"> AI</span>
              </div>

              <p className="mt-2 text-sm text-gray-500">
                AI-powered exam preparation.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-5 text-sm text-gray-500">
              <Link
                to="/about"
                className="hover:text-white transition"
              >
                About
              </Link>

              <Link
                to="/pricing"
                className="hover:text-white transition"
              >
                Pricing
              </Link>

              <Link
                to="/contact"
                className="hover:text-white transition"
              >
                Support
              </Link>

              <Link
                to="/privacy"
                className="hover:text-white transition"
              >
                Privacy
              </Link>

              <Link
                to="/terms"
                className="hover:text-white transition"
              >
                Terms
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs text-gray-600">
            © {new Date().getFullYear()} ExamAce AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
