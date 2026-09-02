import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { generateMCQ } from "../services/api";

import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

const SUBJECTS = [
  "Physics",
  "Chemistry",
  "Mathematics",
  "Biology",
  "Computer Science",
];

const EXAMS = [
  "MHT-CET",
  "JEE",
  "NEET",
  "General",
];

const DIFFICULTIES = [
  "Easy",
  "Medium",
  "Hard",
];

// ============================================================
// MATH RENDERER
// ============================================================

const TEXT_WORDS = new Set([
  "where",
  "then",
  "when",
  "therefore",
  "hence",
  "since",
  "given",
  "such",
  "that",
  "this",
  "the",
  "is",
  "are",
  "and",
  "or",
  "for",
  "thus",
  "using",
  "find",
  "solve",
  "value",
  "of",
  "if",
  "general",
  "solution",
  "a",
  "an",
  "to",
  "in",
  "on",
  "with",
  "from",
  "by",
]);

function normalizeMath(text) {
  return String(text)
    // Square root
    .replace(/√\s*\(([^)]+)\)/g, "\\sqrt{$1}")
    .replace(/√\s*([A-Za-z0-9]+)/g, "\\sqrt{$1}")

    // Trigonometric / logarithmic functions
    .replace(
      /\b(sin|cos|tan|cot|sec|csc|log|ln)\s*\(/g,
      "\\$1("
    )

    // Greek / common symbols
    .replace(/π/g, "\\pi")
    .replace(/θ/g, "\\theta")
    .replace(/α/g, "\\alpha")
    .replace(/β/g, "\\beta")
    .replace(/γ/g, "\\gamma")
    .replace(/δ/g, "\\delta")
    .replace(/Δ/g, "\\Delta")
    .replace(/λ/g, "\\lambda")
    .replace(/μ/g, "\\mu")
    .replace(/ω/g, "\\omega")

    // Operators
    .replace(/×/g, "\\times")
    .replace(/÷/g, "\\div")
    .replace(/∞/g, "\\infty")
    .replace(/≤/g, "\\leq")
    .replace(/≥/g, "\\geq")
    .replace(/≠/g, "\\neq")
    .replace(/∈/g, "\\in")
    .replace(/∑/g, "\\sum")
    .replace(/∫/g, "\\int");
}

function MathText({ text, display = false }) {
  if (text === null || text === undefined || text === "") {
    return null;
  }

  const value = String(text);
  const formatted = normalizeMath(value);

  // ==========================================================
  // FULL BLOCK LATEX: $$ ... $$
  // ==========================================================

  if (
    formatted.startsWith("$$") &&
    formatted.endsWith("$$")
  ) {
    return (
      <div className="overflow-x-auto py-2">
        <BlockMath>
          {formatted.slice(2, -2)}
        </BlockMath>
      </div>
    );
  }

  // ==========================================================
  // FULL BLOCK LATEX: \[ ... \]
  // ==========================================================

  if (
    formatted.startsWith("\\[") &&
    formatted.endsWith("\\]")
  ) {
    return (
      <div className="overflow-x-auto py-2">
        <BlockMath>
          {formatted.slice(2, -2)}
        </BlockMath>
      </div>
    );
  }

  // ==========================================================
  // PURE MATH EXPRESSION
  // ==========================================================

  const looksLikePureMath =
    display &&
    /^[\s\dA-Za-z+\-*/=^().,√πθ∞≤≥≠∈∑∫\\{}[\]|]+$/.test(
      value
    );

  if (looksLikePureMath) {
    return (
      <div className="overflow-x-auto py-2">
        <BlockMath>{formatted}</BlockMath>
      </div>
    );
  }

  // ==========================================================
  // INLINE LATEX
  // ==========================================================

  const parts = formatted.split(
    /(\$[^$]+\$|\\\([^)]*\\\))/
  );

  return (
    <span className="leading-8 whitespace-pre-wrap">
      {parts.map((part, index) => {
        // $ ... $
        if (
          part.startsWith("$") &&
          part.endsWith("$")
        ) {
          return (
            <InlineMath key={index}>
              {part.slice(1, -1)}
            </InlineMath>
          );
        }

        // \( ... \)
        if (
          part.startsWith("\\(") &&
          part.endsWith("\\)")
        ) {
          return (
            <InlineMath key={index}>
              {part.slice(2, -2)}
            </InlineMath>
          );
        }

        return (
          <span key={index}>
            {part}
          </span>
        );
      })}
    </span>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function MCQGenerator() {
  const [subject, setSubject] =
    useState("Physics");

  const [exam, setExam] =
    useState("MHT-CET");

  const [topic, setTopic] =
    useState("");

  const [difficulty, setDifficulty] =
    useState("Medium");

  const [count, setCount] =
    useState(5);

  const [questions, setQuestions] =
    useState([]);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [selectedAnswers, setSelectedAnswers] =
    useState({});

  const [submitted, setSubmitted] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // ==========================================================
  // GENERATE MCQs
  // ==========================================================

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      setQuestions([]);
      setCurrentQuestion(0);
      setSelectedAnswers({});
      setSubmitted(false);

      const data = await generateMCQ(
        topic.trim(),
        difficulty,
        count,
        subject,
        exam
      );

      if (
        !data ||
        !Array.isArray(data.questions) ||
        data.questions.length === 0
      ) {
        throw new Error(
          "Invalid MCQ response from server."
        );
      }

      setQuestions(data.questions);
    } catch (err) {
      console.error(
        "MCQ generation error:",
        err
      );

      setError(
        err?.message ||
          "Failed to generate MCQs. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // SELECT ANSWER
  // ==========================================================

  const handleSelectAnswer = (option) => {
    if (submitted) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion]: option,
    }));
  };

  // ==========================================================
  // NEXT
  // ==========================================================

  const handleNext = () => {
    if (
      currentQuestion <
      questions.length - 1
    ) {
      setCurrentQuestion(
        (prev) => prev + 1
      );
    }
  };

  // ==========================================================
  // PREVIOUS
  // ==========================================================

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(
        (prev) => prev - 1
      );
    }
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = () => {
    setSubmitted(true);
    setCurrentQuestion(0);
  };

  // ==========================================================
  // RESET
  // ==========================================================

  const handleNewQuiz = () => {
    setQuestions([]);
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setSubmitted(false);
    setError("");
  };

  // ==========================================================
  // SCORE
  // ==========================================================

  const calculateScore = () => {
    return questions.reduce(
      (score, question, index) => {
        if (
          selectedAnswers[index] ===
          question.answer
        ) {
          return score + 1;
        }

        return score;
      },
      0
    );
  };

  const score = calculateScore();

  const percentage =
    questions.length > 0
      ? Math.round(
          (score / questions.length) * 100
        )
      : 0;

  // ==========================================================
  // CURRENT QUESTION
  // ==========================================================

  const current =
    questions[currentQuestion];

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col md:flex-row">

      <Sidebar />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="mb-8">

            <div className="flex items-center gap-3 mb-2">

              <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-600/30 flex items-center justify-center text-2xl">
                🧠
              </div>

              <h1
                className="text-3xl md:text-4xl font-bold"
                style={{
                  fontFamily:
                    "'Sora', sans-serif",
                }}
              >
                MCQ Generator
              </h1>

            </div>

            <p className="text-slate-400">
              Generate AI-powered practice
              questions and test your knowledge.
            </p>

          </div>

          {/* ==================================================
              GENERATOR FORM
          ================================================== */}

          {questions.length === 0 && (

            <div className="bg-[#151922] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">

              <h2 className="text-xl font-semibold mb-6">
                Create your quiz
              </h2>

              {/* EXAM + SUBJECT */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

                <div>

                  <label className="block text-sm text-slate-400 mb-2">
                    Exam
                  </label>

                  <select
                    value={exam}
                    onChange={(e) =>
                      setExam(e.target.value)
                    }
                    className="w-full p-3 rounded-xl bg-[#0B0E14] border border-slate-800 outline-none focus:border-indigo-600 transition"
                  >
                    {EXAMS.map((item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    ))}
                  </select>

                </div>

                <div>

                  <label className="block text-sm text-slate-400 mb-2">
                    Subject
                  </label>

                  <select
                    value={subject}
                    onChange={(e) =>
                      setSubject(e.target.value)
                    }
                    className="w-full p-3 rounded-xl bg-[#0B0E14] border border-slate-800 outline-none focus:border-indigo-600 transition"
                  >
                    {SUBJECTS.map((item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    ))}
                  </select>

                </div>

              </div>

              {/* TOPIC */}

              <div className="mb-4">

                <label className="block text-sm text-slate-400 mb-2">
                  Topic
                </label>

                <input
                  type="text"
                  placeholder="e.g. Current Electricity"
                  value={topic}
                  onChange={(e) =>
                    setTopic(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !loading
                    ) {
                      handleGenerate();
                    }
                  }}
                  className="w-full p-3 rounded-xl bg-[#0B0E14] border border-slate-800 outline-none focus:border-indigo-600 transition"
                />

              </div>

              {/* DIFFICULTY + COUNT */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

                <div>

                  <label className="block text-sm text-slate-400 mb-2">
                    Difficulty
                  </label>

                  <select
                    value={difficulty}
                    onChange={(e) =>
                      setDifficulty(e.target.value)
                    }
                    className="w-full p-3 rounded-xl bg-[#0B0E14] border border-slate-800 outline-none focus:border-indigo-600 transition"
                  >
                    {DIFFICULTIES.map((item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    ))}
                  </select>

                </div>

                <div>

                  <label className="block text-sm text-slate-400 mb-2">
                    Number of questions
                  </label>

                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={count}
                    onChange={(e) => {
                      const value =
                        Number(e.target.value);

                      if (
                        Number.isNaN(value)
                      ) {
                        setCount(1);
                        return;
                      }

                      setCount(
                        Math.min(
                          20,
                          Math.max(
                            1,
                            value
                          )
                        )
                      );
                    }}
                    className="w-full p-3 rounded-xl bg-[#0B0E14] border border-slate-800 outline-none focus:border-indigo-600 transition"
                  />

                </div>

              </div>

              {/* ERROR */}

              {error && (
                <div className="mb-5 p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300">
                  {error}
                </div>
              )}

              {/* BUTTON */}

              <button
                onClick={handleGenerate}
                disabled={loading}
                className={`w-full py-3.5 rounded-xl font-semibold transition ${
                  loading
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {loading
                  ? "AI is generating questions..."
                  : "Generate MCQs"}
              </button>

            </div>
          )}

          {/* ==================================================
              QUIZ
          ================================================== */}

          {questions.length > 0 &&
            !submitted &&
            current && (

              <div>

                {/* QUIZ HEADER */}

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">

                  <div>

                    <p className="text-indigo-400 font-medium">
                      {exam} • {subject}
                    </p>

                    <h2 className="text-xl font-semibold">
                      {topic}
                    </h2>

                  </div>

                  <button
                    onClick={handleNewQuiz}
                    className="px-4 py-2 rounded-xl bg-[#151922] border border-slate-800 hover:bg-slate-800 text-sm transition"
                  >
                    Exit quiz
                  </button>

                </div>

                {/* PROGRESS */}

                <div className="mb-6">

                  <div className="flex justify-between text-sm text-slate-400 mb-2">

                    <span>
                      Question{" "}
                      {currentQuestion + 1}{" "}
                      of{" "}
                      {questions.length}
                    </span>

                    <span>
                      {Math.round(
                        ((currentQuestion + 1) /
                          questions.length) *
                          100
                      )}
                      %
                    </span>

                  </div>

                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">

                    <div
                      className="h-full bg-indigo-600 transition-all"
                      style={{
                        width: `${
                          ((currentQuestion + 1) /
                            questions.length) *
                          100
                        }%`,
                      }}
                    />

                  </div>

                </div>

                {/* QUESTION CARD */}

                <div className="bg-[#151922] border border-slate-800 rounded-2xl p-6 md:p-8">

                  {/* QUESTION */}

                  <div className="flex gap-3 mb-7">

                    <span className="flex-shrink-0 w-9 h-9 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
                      {currentQuestion + 1}
                    </span>

                    <div className="text-xl md:text-2xl font-semibold leading-relaxed flex-1">

                      <MathText
                        text={current.question}
                        display={
                          subject ===
                          "Mathematics"
                        }
                      />

                    </div>

                  </div>

                  {/* OPTIONS */}

                  <div className="space-y-3">

                    {["A", "B", "C", "D"].map(
                      (option) => {

                        const isSelected =
                          selectedAnswers[
                            currentQuestion
                          ] === option;

                        return (
                          <button
                            key={option}
                            onClick={() =>
                              handleSelectAnswer(
                                option
                              )
                            }
                            className={`w-full text-left p-4 rounded-xl border transition ${
                              isSelected
                                ? "border-indigo-500 bg-indigo-500/10"
                                : "border-slate-800 bg-[#0B0E14] hover:border-slate-700"
                            }`}
                          >

                            <div className="flex items-start gap-4">

                              <span
                                className={`w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center font-bold ${
                                  isSelected
                                    ? "bg-indigo-600 text-white"
                                    : "bg-slate-800 text-slate-300"
                                }`}
                              >
                                {option}
                              </span>

                              <span className="pt-1 text-slate-200 flex-1">

                                <MathText
                                  text={
                                    current.options?.[
                                      option
                                    ]
                                  }
                                  display={
                                    subject ===
                                    "Mathematics"
                                  }
                                />

                              </span>

                            </div>

                          </button>
                        );
                      }
                    )}

                  </div>

                  {/* NAVIGATION */}

                  <div className="flex justify-between mt-8">

                    <button
                      onClick={handlePrevious}
                      disabled={
                        currentQuestion === 0
                      }
                      className={`px-5 py-3 rounded-xl font-medium transition ${
                        currentQuestion === 0
                          ? "bg-[#0B0E14] border border-slate-800 text-slate-600 cursor-not-allowed"
                          : "bg-[#0B0E14] border border-slate-800 hover:bg-slate-800"
                      }`}
                    >
                      ← Previous
                    </button>

                    {currentQuestion ===
                    questions.length - 1 ? (

                      <button
                        onClick={handleSubmit}
                        className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-semibold transition"
                      >
                        Submit Quiz
                      </button>

                    ) : (

                      <button
                        onClick={handleNext}
                        className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold transition"
                      >
                        Next →
                      </button>

                    )}

                  </div>

                </div>

                {/* QUESTION NAVIGATOR */}

                <div className="mt-6 bg-[#151922] border border-slate-800 rounded-2xl p-5">

                  <p className="text-sm text-slate-400 mb-3">
                    Question navigator
                  </p>

                  <div className="flex flex-wrap gap-2">

                    {questions.map(
                      (_, index) => {

                        const answered =
                          selectedAnswers[index];

                        return (
                          <button
                            key={index}
                            onClick={() =>
                              setCurrentQuestion(
                                index
                              )
                            }
                            className={`w-10 h-10 rounded-lg text-sm font-semibold transition ${
                              index ===
                              currentQuestion
                                ? "bg-indigo-600"
                                : answered
                                ? "bg-indigo-600/30 text-indigo-300"
                                : "bg-[#0B0E14] border border-slate-800 text-slate-400 hover:bg-slate-800"
                            }`}
                          >
                            {index + 1}
                          </button>
                        );

                      }
                    )}

                  </div>

                </div>

              </div>
            )}

          {/* ==================================================
              RESULT
          ================================================== */}

          {submitted && (

            <div>

              {/* RESULT CARD */}

              <div className="bg-[#151922] border border-slate-800 rounded-2xl p-8 text-center mb-6">

                <div className="text-5xl mb-4">

                  {percentage >= 80
                    ? "🏆"
                    : percentage >= 50
                    ? "🎯"
                    : "📚"}

                </div>

                <p className="text-slate-400 mb-2">
                  Your score
                </p>

                <h2
                  className="text-5xl font-bold mb-3"
                  style={{
                    fontFamily:
                      "'Sora', sans-serif",
                  }}
                >
                  {percentage}%
                </h2>

                <p className="text-slate-300">
                  {score} out of{" "}
                  {questions.length}{" "}
                  correct
                </p>

                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mt-7">

                  <div className="bg-emerald-950/30 border border-emerald-800 rounded-xl p-4">

                    <div className="text-2xl font-bold text-emerald-400">
                      {score}
                    </div>

                    <div className="text-sm text-slate-400">
                      Correct
                    </div>

                  </div>

                  <div className="bg-rose-950/30 border border-rose-800 rounded-xl p-4">

                    <div className="text-2xl font-bold text-rose-400">
                      {questions.length -
                        score}
                    </div>

                    <div className="text-sm text-slate-400">
                      Incorrect
                    </div>

                  </div>

                </div>

                <button
                  onClick={handleNewQuiz}
                  className="mt-7 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold transition"
                >
                  Generate new quiz
                </button>

              </div>

              {/* REVIEW */}

              <div>

                <h2
                  className="text-2xl font-bold mb-4"
                  style={{
                    fontFamily:
                      "'Sora', sans-serif",
                  }}
                >
                  Review answers
                </h2>

                <div className="space-y-5">

                  {questions.map(
                    (question, index) => {

                      const selected =
                        selectedAnswers[index];

                      const correct =
                        selected ===
                        question.answer;

                      return (
                        <div
                          key={index}
                          className="bg-[#151922] border border-slate-800 rounded-2xl p-6"
                        >

                          {/* QUESTION */}

                          <div className="flex gap-3 mb-5">

                            <span
                              className={`w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center font-bold ${
                                correct
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-rose-500/20 text-rose-400"
                              }`}
                            >
                              {index + 1}
                            </span>

                            <div className="font-semibold text-lg leading-relaxed flex-1">

                              <MathText
                                text={
                                  question.question
                                }
                                display={
                                  subject ===
                                  "Mathematics"
                                }
                              />

                            </div>

                          </div>

                          {/* ANSWERS */}

                          <div className="space-y-2 mb-5">

                            {["A", "B", "C", "D"].map(
                              (option) => {

                                const isCorrect =
                                  option ===
                                  question.answer;

                                const isSelected =
                                  option ===
                                  selected;

                                return (
                                  <div
                                    key={option}
                                    className={`p-3 rounded-lg border ${
                                      isCorrect
                                        ? "border-emerald-500/40 bg-emerald-500/10"
                                        : isSelected
                                        ? "border-rose-500/40 bg-rose-500/10"
                                        : "border-slate-800 bg-[#0B0E14]"
                                    }`}
                                  >

                                    <span className="font-semibold mr-2">
                                      {option}.
                                    </span>

                                    <MathText
                                      text={
                                        question
                                          .options?.[
                                          option
                                        ]
                                      }
                                      display={
                                        subject ===
                                        "Mathematics"
                                      }
                                    />

                                    {isCorrect && (
                                      <span className="ml-2 text-emerald-400 text-sm">
                                        ✓ Correct
                                      </span>
                                    )}

                                    {isSelected &&
                                      !isCorrect && (
                                        <span className="ml-2 text-rose-400 text-sm">
                                          ✗ Your answer
                                        </span>
                                      )}

                                  </div>
                                );
                              }
                            )}

                          </div>

                          {/* EXPLANATION */}

                          <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">

                            <p className="text-indigo-400 font-semibold mb-2">
                              Explanation
                            </p>

                            <div className="text-slate-300 leading-7">

                              <MathText
                                text={
                                  question.explanation
                                }
                                display={
                                  subject ===
                                  "Mathematics"
                                }
                              />

                            </div>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              </div>

            </div>
          )}

        </div>
      </main>

    </div>
  );
}
