import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white">

      <nav className="max-w-7xl mx-auto px-6 md:px-10 py-6">
        <Link to="/" className="text-xl font-bold">
          ExamAce<span className="text-indigo-500">AI</span>
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">

        <h1 className="text-4xl font-bold">
          Privacy Policy
        </h1>

        <p className="text-slate-500 text-sm mt-3">
          Last updated: September 2, 2026
        </p>

        <div className="mt-12 space-y-10 text-slate-400 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white mb-3">
              1. Introduction
            </h2>

            <p>
              ExamAce AI respects your privacy. This Privacy Policy explains
              what information may be collected when you use ExamAce AI and
              how that information may be used.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">
              2. Information we collect
            </h2>

            <p>
              Depending on how you use the platform, ExamAce AI may collect
              information such as your name, email address, account
              information, study preferences and information that you
              provide while using study features.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">
              3. How information is used
            </h2>

            <p>
              Information may be used to provide and improve the ExamAce AI
              service, authenticate accounts, generate personalized study
              content, maintain user preferences and communicate important
              service-related information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">
              4. AI-generated content
            </h2>

            <p>
              ExamAce AI uses artificial intelligence services to generate
              educational content such as study plans, notes and practice
              questions. Information necessary to provide these features may
              be processed by third-party AI service providers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">
              5. Data security
            </h2>

            <p>
              We take reasonable measures to protect information associated
              with your account. However, no online service can guarantee
              absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">
              6. Third-party services
            </h2>

            <p>
              ExamAce AI may use third-party services for hosting,
              authentication, AI processing, email communication, analytics
              or other infrastructure required to operate the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">
              7. Your choices
            </h2>

            <p>
              You may contact us regarding your account or personal
              information and request appropriate changes or deletion where
              applicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">
              8. Contact
            </h2>

            <p>
              For privacy-related questions, contact us through the
              ExamAce AI support page.
            </p>
          </section>

        </div>

      </main>

    </div>
  );
}