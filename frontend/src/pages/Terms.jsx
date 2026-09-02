import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white">

      <nav className="max-w-7xl mx-auto px-6 md:px-10 py-6">
        <Link to="/" className="text-xl font-bold">
          ExamAce<span className="text-indigo-500">AI</span>
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">

        <h1 className="text-4xl font-bold">
          Terms of Service
        </h1>

        <p className="text-slate-500 text-sm mt-3">
          Last updated: September 2, 2026
        </p>

        <div className="mt-12 space-y-10 text-slate-400 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white mb-3">
              1. Acceptance of terms
            </h2>

            <p>
              By accessing or using ExamAce AI, you agree to these Terms of
              Service. If you do not agree with these terms, please do not
              use the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">
              2. Use of the service
            </h2>

            <p>
              ExamAce AI is intended to provide educational planning,
              revision and practice tools. Users are responsible for using
              the service appropriately and providing accurate information
              where necessary.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">
              3. AI-generated content
            </h2>

            <p>
              AI-generated study plans, notes, questions and explanations may
              contain errors or omissions. ExamAce AI should be used as a
              study aid and not as a replacement for official textbooks,
              teachers, examination authorities or official exam information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">
              4. Account responsibility
            </h2>

            <p>
              You are responsible for maintaining the security of your
              account credentials and for activity performed through your
              account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">
              5. Availability
            </h2>

            <p>
              We may modify, improve, suspend or discontinue parts of the
              service from time to time. We do not guarantee that the service
              will always be available or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">
              6. Prohibited use
            </h2>

            <p>
              Users must not misuse the platform, attempt to gain
              unauthorized access, interfere with the service or use the
              platform for unlawful purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">
              7. Changes to these terms
            </h2>

            <p>
              These terms may be updated as ExamAce AI develops. Updated
              versions will be published on this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">
              8. Contact
            </h2>

            <p>
              Questions about these Terms of Service can be submitted through
              the ExamAce AI support page.
            </p>
          </section>

        </div>

      </main>

    </div>
  );
}