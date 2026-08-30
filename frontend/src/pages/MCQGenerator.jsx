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

function MathText({ text, display = false }) {

  if (!text) {
    return null;
  }

  const value = String(text);

  /*
   * If the AI explicitly returns LaTeX using:
   *
   * $...$
   * $$...$$
   * \(...\)
   * \[...\]
   *
   * render it directly.
   */

  const hasLatex =
    value.includes("$") ||
    value.includes("\\(") ||
    value.includes("\\[") ||
    value.includes("\\frac") ||
    value.includes("\\sqrt") ||
    value.includes("\\pi") ||
    value.includes("\\theta") ||
    value.includes("\\alpha") ||
    value.includes("\\beta") ||
    value.includes("\\sin") ||
    value.includes("\\cos") ||
    value.includes("\\tan") ||
    value.includes("^");

  if (!hasLatex) {
    return (
      <span className="whitespace-pre-wrap">
        {value}
      </span>
    );
  }


  /*
   * Convert common plain-text mathematical notation
   * into LaTeX-friendly notation.
   */

  let formatted = value;

  formatted = formatted
    .replace(/√\s*\(([^)]+)\)/g, "\\sqrt{$1}")
    .replace(/√\s*([A-Za-z0-9]+)/g, "\\sqrt{$1}")

    .replace(
      /\b(sin|cos|tan|cot|sec|csc|log|ln)\s*\(/g,
      "\\$1("
    )

    .replace(/π/g, "\\pi")
    .replace(/θ/g, "\\theta")
    .replace(/α/g, "\\alpha")
    .replace(/β/g, "\\beta")
    .replace(/γ/g, "\\gamma")
    .replace(/Δ/g, "\\Delta")

    .replace(/×/g, "\\times")
    .replace(/÷/g, "\\div")

    .replace(/∞/g, "\\infty")

    .replace(/≤/g, "\\leq")
    .replace(/≥/g, "\\geq")
    .replace(/≠/g, "\\neq")

    .replace(/∈/g, "\\in")

    .replace(/∑/g, "\\sum")
    .replace(/∫/g, "\\int");


  /*
   * If the entire value looks like a mathematical expression,
   * render it as block math.
   */

  const looksLikePureMath =
    display ||
    /^[\s\dA-Za-z+\-*/=^().,√πθ∞≤≥≠∈∑∫\\{}[\]]+$/.test(
      value
    );


  if (
    value.startsWith("$$") &&
    value.endsWith("$$")
  ) {

    return (
      <BlockMath>
        {value.slice(2, -2)}
      </BlockMath>
    );
  }


  if (
    value.startsWith("\\[") &&
    value.endsWith("\\]")
  ) {

    return (
      <BlockMath>
        {value.slice(2, -2)}
      </BlockMath>
    );
  }


  if (looksLikePureMath) {

    return (
      <BlockMath>
        {formatted}
      </BlockMath>
    );
  }


  /*
   * Mixed text + mathematics.
   *
   * Example:
   * "If x^2 = 25, then x = 5."
   */

  const parts = formatted.split(
    /(\$[^$]+\$|\\\([^)]*\\\))/g
  );

  return (
    <span className="leading-8">

      {parts.map((part, index) => {

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

      setError(
        "Please enter a topic."
      );

      return;
    }


    try {

      setLoading(true);
      setError("");

      setQuestions([]);
      setCurrentQuestion(0);
      setSelectedAnswers({});
      setSubmitted(false);


      const data =
        await generateMCQ(
          topic,
          difficulty,
          count,
          subject,
          exam
        );


      if (
        !data.questions ||
        !Array.isArray(data.questions)
      ) {

        throw new Error(
          "Invalid MCQ response from server."
        );
      }


      setQuestions(
        data.questions
      );

    } catch (error) {

      console.error(error);

      setError(
        error?.message ||
        "Failed to generate MCQs. Please try again."
      );

    } finally {

      setLoading(false);

    }
  };


  // ==========================================================
  // SELECT ANSWER
  // ==========================================================

  const handleSelectAnswer =
    (option) => {

      if (submitted) return;

      setSelectedAnswers(
        (prev) => ({
          ...prev,
          [currentQuestion]:
            option,
        })
      );
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


  const score =
    calculateScore();


  const percentage =
    questions.length > 0
      ? Math.round(
          (score /
            questions.length) *
            100
        )
      : 0;


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="min-h-screen bg-slate-950 text-white flex">

      <Sidebar />


      <main className="flex-1 p-6 md:p-8 overflow-y-auto">

        <div className="max-w-5xl mx-auto">


          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="mb-8">

            <div className="flex items-center gap-3 mb-2">

              <div className="text-4xl">
                🧠
              </div>

              <h1 className="text-3xl md:text-4xl font-bold">
                MCQ Generator
              </h1>

            </div>

            <p className="text-slate-400">
              Generate AI-powered practice questions
              and test your knowledge.
            </p>

          </div>


          {/* ==================================================
              GENERATOR FORM
          ================================================== */}

          {questions.length === 0 && (

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">

              <h2 className="text-xl font-semibold mb-6">
                Create Your Quiz
              </h2>


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
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 outline-none focus:border-blue-500"
                  >

                    {EXAMS.map(
                      (item) => (

                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>

                      )
                    )}

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
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 outline-none focus:border-blue-500"
                  >

                    {SUBJECTS.map(
                      (item) => (

                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>

                      )
                    )}

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
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 outline-none focus:border-blue-500"
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
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 outline-none focus:border-blue-500"
                  >

                    {DIFFICULTIES.map(
                      (item) => (

                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>

                      )
                    )}

                  </select>

                </div>


                <div>

                  <label className="block text-sm text-slate-400 mb-2">
                    Number of Questions
                  </label>

                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={count}
                    onChange={(e) =>
                      setCount(
                        Math.min(
                          20,
                          Math.max(
                            1,
                            Number(
                              e.target.value
                            )
                          )
                        )
                      )
                    }
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 outline-none focus:border-blue-500"
                  />

                </div>

              </div>


              {/* ERROR */}

              {error && (

                <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">

                  ⚠️ {error}

                </div>

              )}


              {/* BUTTON */}

              <button
                onClick={handleGenerate}
                disabled={loading}
                className={`w-full py-3.5 rounded-xl font-semibold transition ${
                  loading
                    ? "bg-slate-700 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >

                {loading
                  ? "🧠 AI is generating questions..."
                  : "🚀 Generate MCQs"}

              </button>

            </div>

          )}


          {/* ==================================================
              QUIZ
          ================================================== */}

          {questions.length > 0 &&
            !submitted && (

              <div>


                {/* QUIZ HEADER */}

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">

                  <div>

                    <p className="text-blue-400 font-medium">
                      {exam} • {subject}
                    </p>

                    <h2 className="text-xl font-semibold">
                      {topic}
                    </h2>

                  </div>


                  <button
                    onClick={handleNewQuiz}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm"
                  >
                    ✕ Exit Quiz
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
                      className="h-full bg-blue-600 transition-all"
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

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">

                  <div className="flex gap-3 mb-7">

                    <span className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                      {currentQuestion + 1}
                    </span>

                    <div className="text-xl md:text-2xl font-semibold leading-relaxed flex-1">

                      <MathText
                        text={
                          questions[
                            currentQuestion
                          ].question
                        }
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
                                ? "border-blue-500 bg-blue-500/10"
                                : "border-slate-700 bg-slate-800/60 hover:bg-slate-800 hover:border-slate-600"
                            }`}
                          >

                            <div className="flex items-start gap-4">

                              <span
                                className={`w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center font-bold ${
                                  isSelected
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-700 text-slate-300"
                                }`}
                              >
                                {option}
                              </span>


                              <span className="pt-1 text-slate-200 flex-1">

                                <MathText
                                  text={
                                    questions[
                                      currentQuestion
                                    ].options[
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
                      onClick={
                        handlePrevious
                      }
                      disabled={
                        currentQuestion ===
                        0
                      }
                      className={`px-5 py-3 rounded-xl font-medium ${
                        currentQuestion ===
                        0
                          ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                          : "bg-slate-800 hover:bg-slate-700"
                      }`}
                    >
                      ← Previous
                    </button>


                    {currentQuestion ===
                    questions.length - 1 ? (

                      <button
                        onClick={
                          handleSubmit
                        }
                        className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 font-semibold"
                      >
                        🏁 Submit Quiz
                      </button>

                    ) : (

                      <button
                        onClick={
                          handleNext
                        }
                        className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold"
                      >
                        Next →
                      </button>

                    )}

                  </div>

                </div>


                {/* QUESTION NAVIGATOR */}

                <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-5">

                  <p className="text-sm text-slate-400 mb-3">
                    Question Navigator
                  </p>


                  <div className="flex flex-wrap gap-2">

                    {questions.map(
                      (_, index) => {

                        const answered =
                          selectedAnswers[
                            index
                          ];

                        return (

                          <button
                            key={index}
                            onClick={() =>
                              setCurrentQuestion(
                                index
                              )
                            }
                            className={`w-10 h-10 rounded-lg text-sm font-semibold ${
                              index ===
                              currentQuestion
                                ? "bg-blue-600"
                                : answered
                                ? "bg-blue-600/30 text-blue-300"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
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

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center mb-6">

                <div className="text-5xl mb-4">

                  {percentage >= 80
                    ? "🏆"
                    : percentage >= 50
                    ? "🎯"
                    : "📚"}

                </div>


                <p className="text-slate-400 mb-2">
                  Your Score
                </p>


                <h2 className="text-5xl font-bold mb-3">
                  {percentage}%
                </h2>


                <p className="text-slate-300">
                  {score} out of{" "}
                  {questions.length}{" "}
                  correct
                </p>


                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mt-7">

                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">

                    <div className="text-2xl font-bold text-green-400">
                      {score}
                    </div>

                    <div className="text-sm text-slate-400">
                      Correct
                    </div>

                  </div>


                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">

                    <div className="text-2xl font-bold text-red-400">
                      {questions.length -
                        score}
                    </div>

                    <div className="text-sm text-slate-400">
                      Incorrect
                    </div>

                  </div>

                </div>


                <button
                  onClick={
                    handleNewQuiz
                  }
                  className="mt-7 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold"
                >
                  🔄 Generate New Quiz
                </button>

              </div>


              {/* REVIEW */}

              <div>

                <h2 className="text-2xl font-bold mb-4">
                  📖 Review Answers
                </h2>


                <div className="space-y-5">

                  {questions.map(
                    (question, index) => {

                      const selected =
                        selectedAnswers[
                          index
                        ];

                      const correct =
                        selected ===
                        question.answer;


                      return (

                        <div
                          key={index}
                          className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
                        >

                          {/* QUESTION */}

                          <div className="flex gap-3 mb-5">

                            <span
                              className={`w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center font-bold ${
                                correct
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-red-500/20 text-red-400"
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
                                        ? "border-green-500/40 bg-green-500/10"
                                        : isSelected
                                        ? "border-red-500/40 bg-red-500/10"
                                        : "border-slate-800 bg-slate-800/40"
                                    }`}
                                  >

                                    <span className="font-semibold mr-2">
                                      {option}.
                                    </span>


                                    <MathText
                                      text={
                                        question
                                          .options[
                                          option
                                        ]
                                      }
                                      display={
                                        subject ===
                                        "Mathematics"
                                      }
                                    />


                                    {isCorrect && (

                                      <span className="ml-2 text-green-400 text-sm">
                                        ✓ Correct
                                      </span>

                                    )}


                                    {isSelected &&
                                      !isCorrect && (

                                        <span className="ml-2 text-red-400 text-sm">
                                          ✗ Your answer
                                        </span>

                                      )}

                                  </div>

                                );

                              }
                            )}

                          </div>


                          {/* EXPLANATION */}

                          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">

                            <p className="text-blue-400 font-semibold mb-2">
                              💡 Explanation
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