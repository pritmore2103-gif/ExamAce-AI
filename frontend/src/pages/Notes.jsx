import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";

const API_URL = "https://examace-ai-cp3e.onrender.com";

const SUBJECTS = [
  "Physics",
  "Chemistry",
  "Mathematics",
  "Biology",
  "Computer Science",
  "Other",
];

const DIFFICULTIES = [
  {
    value: "Beginner",
    label: "🟢 Beginner",
    description: "Simple explanations and fundamentals",
  },
  {
    value: "Standard",
    label: "🔵 Standard",
    description: "Balanced school/exam preparation",
  },
  {
    value: "Advanced",
    label: "🟣 Advanced",
    description: "Deeper concepts and connections",
  },
  {
    value: "Exam-focused",
    label: "🔥 Exam Focused",
    description: "Important points, formulas and exam tips",
  },
];

const NOTE_LENGTHS = [
  {
    value: "Quick",
    label: "⚡ Quick Revision",
    description: "Short and highly focused",
  },
  {
    value: "Standard",
    label: "📘 Standard",
    description: "Complete notes for normal study",
  },
  {
    value: "Detailed",
    label: "📚 Detailed",
    description: "Deep explanations and examples",
  },
];

export default function Notes() {
  // ============================================================
  // GENERATOR STATE
  // ============================================================

  const [subject, setSubject] = useState("Physics");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Standard");
  const [noteLength, setNoteLength] = useState("Standard");

  // ============================================================
  // GENERATED NOTES
  // ============================================================

  const [generatedNotes, setGeneratedNotes] = useState("");
  const [generatedTitle, setGeneratedTitle] = useState("");

  const [loading, setLoading] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  // ============================================================
  // SAVED NOTES
  // ============================================================

  const [savedNotes, setSavedNotes] = useState([]);
  const [loadingSavedNotes, setLoadingSavedNotes] = useState(true);

  // ============================================================
  // SEARCH
  // ============================================================

  const [search, setSearch] = useState("");

  // ============================================================
  // UI
  // ============================================================

  const [activeTab, setActiveTab] = useState("generator");
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  // ============================================================
  // AUTH
  // ============================================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  const getAuthHeaders = () => {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  // ============================================================
  // LOAD SAVED NOTES
  // ============================================================

  const loadSavedNotes = async () => {
    const token = getToken();

    if (!token) {
      setLoadingSavedNotes(false);
      return;
    }

    try {
      setLoadingSavedNotes(true);
      setError("");

      const response = await fetch(`${API_URL}/notes`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        throw new Error(
          "Your login session has expired. Please login again."
        );
      }

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          errorText || "Could not load saved notes."
        );
      }

      const data = await response.json();

      setSavedNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load notes error:", err);

      setError(
        err.message || "Could not load saved notes."
      );
    } finally {
      setLoadingSavedNotes(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadSavedNotes();
  }, []);

  // ============================================================
  // AUTO CLEAR SUCCESS MESSAGE
  // ============================================================

  useEffect(() => {
    if (!successMessage) return;

    const timer = setTimeout(() => {
      setSuccessMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [successMessage]);

  // ============================================================
  // GENERATE NOTES
  // ============================================================

  const generateNotes = async () => {
    const cleanTopic = topic.trim();

    if (!cleanTopic) {
      setError("Please enter a topic first.");
      return;
    }

    if (cleanTopic.length < 2) {
      setError("Topic is too short.");
      return;
    }

    const token = getToken();

    if (!token) {
      setError(
        "Please login first to generate notes."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      /*
       * Current backend accepts:
       *
       * {
       *   topic: string
       * }
       *
       * Therefore all generation preferences are
       * included inside the topic prompt.
       */

      const enhancedTopic = `
Subject: ${subject}

Topic: ${cleanTopic}

Difficulty Level: ${difficulty}

Note Length: ${noteLength}

Create high-quality structured educational study notes.

Requirements:
- Explain the topic clearly.
- Use headings and subheadings.
- Include important definitions.
- Include formulas when relevant.
- Include important concepts.
- Include examples where useful.
- Include common mistakes.
- Include exam tips.
- Make the notes easy to revise.
- Keep the explanation appropriate for the selected difficulty.
- Make the length appropriate for the selected note length.
      `.trim();

      const response = await fetch(
        `${API_URL}/generate-notes`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            topic: enhancedTopic,
          }),
        }
      );

      if (response.status === 401) {
        throw new Error(
          "Your login session has expired. Please login again."
        );
      }

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          `Backend returned ${response.status}: ${
            errorText || "Unknown error"
          }`
        );
      }

      const data = await response.json();

      if (!data.content) {
        throw new Error(
          "AI returned empty notes."
        );
      }

      let content = data.content;

      /*
       * Handle APIs that may return an object
       * instead of a normal string.
       */

      if (typeof content === "object") {
        content = JSON.stringify(
          content,
          null,
          2
        );
      }

      content = String(content).trim();

      if (!content) {
        throw new Error(
          "AI returned empty notes."
        );
      }

      setGeneratedNotes(content);

      setGeneratedTitle(
        `${subject} — ${cleanTopic}`
      );

      setActiveTab("generator");

      setSuccessMessage(
        "Notes generated successfully!"
      );
    } catch (err) {
      console.error(
        "Generate notes error:",
        err
      );

      setError(
        err.message ||
          "Failed to generate notes."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // SAVE NOTE
  // ============================================================

  const saveNote = async () => {
    if (!generatedNotes.trim()) {
      setError(
        "Generate some notes before saving."
      );
      return;
    }

    const token = getToken();

    if (!token) {
      setError("Please login first.");
      return;
    }

    try {
      setSavingNote(true);
      setError("");
      setSuccessMessage("");

      const title =
        generatedTitle ||
        `${subject} — ${topic.trim()}`;

      const response = await fetch(
        `${API_URL}/notes`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            title,
            content: generatedNotes,
          }),
        }
      );

      if (response.status === 401) {
        throw new Error(
          "Your login session has expired. Please login again."
        );
      }

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          errorText ||
            "Could not save notes."
        );
      }

      const data = await response.json();

      setSavedNotes((previous) => [
        data,
        ...previous,
      ]);

      setSuccessMessage(
        "Notes saved successfully!"
      );
    } catch (err) {
      console.error(
        "Save note error:",
        err
      );

      setError(
        err.message ||
          "Could not save notes."
      );
    } finally {
      setSavingNote(false);
    }
  };

  // ============================================================
  // OPEN SAVED NOTE
  // ============================================================

  const openSavedNote = (note) => {
    setGeneratedTitle(
      note.title || "Saved Note"
    );

    setGeneratedNotes(
      note.content || ""
    );

    setActiveTab("generator");

    setError("");
    setSuccessMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ============================================================
  // COPY NOTES
  // ============================================================

  const copyNotes = async () => {
    if (!generatedNotes) return;

    try {
      await navigator.clipboard.writeText(
        generatedNotes
      );

      setSuccessMessage(
        "Notes copied to clipboard!"
      );
    } catch (err) {
      console.error(
        "Copy error:",
        err
      );

      setError(
        "Could not copy notes."
      );
    }
  };

  // ============================================================
  // PRINT NOTES
  // ============================================================

  const printNotes = () => {
    if (!generatedNotes) return;

    const printWindow =
      window.open(
        "",
        "_blank"
      );

    if (!printWindow) {
      setError(
        "Please allow pop-ups to print your notes."
      );

      return;
    }

    const title =
      generatedTitle ||
      "ExamAce AI Notes";

    /*
     * Escape HTML to avoid accidentally
     * injecting generated content into
     * the print document.
     */

    const escapeHTML = (text) => {
      return String(text)
        .replace(
          /&/g,
          "&amp;"
        )
        .replace(
          /</g,
          "&lt;"
        )
        .replace(
          />/g,
          "&gt;"
        )
        .replace(
          /"/g,
          "&quot;"
        )
        .replace(
          /'/g,
          "&#039;"
        );
    };

    const escapedTitle =
      escapeHTML(title);

    const escapedContent =
      escapeHTML(
        generatedNotes
      );

    const printableContent =
      escapedContent.replace(
        /\n/g,
        "<br/>"
      );

    printWindow.document.write(`
      <!DOCTYPE html>

      <html>

        <head>

          <meta charset="UTF-8" />

          <title>
            ${escapedTitle}
          </title>

          <style>

            body {
              font-family:
                Arial,
                Helvetica,
                sans-serif;

              max-width:
                850px;

              margin:
                40px auto;

              padding:
                20px;

              line-height:
                1.7;

              color:
                #111;

              background:
                #fff;
            }

            h1 {
              font-size:
                28px;

              margin-bottom:
                30px;
            }

            .notes {
              font-size:
                15px;

              white-space:
                normal;
            }

            @media print {

              body {
                margin:
                  20px;
              }

            }

          </style>

        </head>

        <body>

          <h1>
            ${escapedTitle}
          </h1>

          <div class="notes">
            ${printableContent}
          </div>

        </body>

      </html>
    `);

    printWindow.document.close();

    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  // ============================================================
  // CLEAR GENERATED NOTES
  // ============================================================

  const clearGeneratedNotes = () => {
    setGeneratedNotes("");
    setGeneratedTitle("");
    setError("");
    setSuccessMessage("");
  };

  // ============================================================
  // NEW NOTE
  // ============================================================

  const startNewNote = () => {
    setTopic("");
    setGeneratedNotes("");
    setGeneratedTitle("");
    setError("");
    setSuccessMessage("");
    setActiveTab("generator");
  };

  // ============================================================
  // FILTER SAVED NOTES
  // ============================================================

  const filteredNotes = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return savedNotes;
    }

    return savedNotes.filter(
      (note) =>
        note.title
          ?.toLowerCase()
          .includes(query) ||
        note.content
          ?.toLowerCase()
          .includes(query)
    );
  }, [savedNotes, search]);

  // ============================================================
  // NOTE PREVIEW
  // ============================================================

  const getPreview = (content) => {
    if (!content) {
      return "No content";
    }

    const clean = content
      .replace(/\s+/g, " ")
      .trim();

    if (clean.length <= 150) {
      return clean;
    }

    return (
      clean.substring(0, 150) +
      "..."
    );
  };

  // ============================================================
  // LOADING SAVED NOTES
  // ============================================================

  if (loadingSavedNotes) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col md:flex-row">

        <Sidebar />

        <main className="flex-1 flex items-center justify-center p-6">

          <div className="text-center">

            <div className="text-6xl mb-5 animate-pulse">
              📚
            </div>

            <h2 className="text-2xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
              Loading notes
            </h2>

            <p className="text-slate-400 mt-2">
              Getting your saved study library...
            </p>

          </div>

        </main>

      </div>
    );
  }

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col md:flex-row">

      <Sidebar />

      <main className="flex-1 p-5 md:p-8 overflow-y-auto">

        <div className="max-w-6xl mx-auto">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="mb-8">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div>

                <div className="flex items-center gap-3">

                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-600/30 flex items-center justify-center text-2xl">
                    📚
                  </div>

                  <div>

                    <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
                      AI notes generator
                    </h1>

                    <p className="text-slate-400 mt-1">
                      Turn any topic into smart study notes.
                    </p>

                  </div>

                </div>

              </div>

              <div className="hidden md:block">

                <div className="bg-[#151922] border border-slate-800 rounded-xl px-4 py-3">

                  <p className="text-xs text-slate-500">
                    SAVED NOTES
                  </p>

                  <p className="text-xl font-bold text-indigo-400">
                    {savedNotes.length}
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* ==================================================
              SUCCESS
          ================================================== */}

          {successMessage && (
            <div className="mb-6 bg-emerald-950/40 border border-emerald-800 text-emerald-300 p-4 rounded-xl">

              <div className="flex items-center gap-3">

                <span className="text-xl">
                  ✓
                </span>

                <p className="font-medium">
                  {successMessage}
                </p>

              </div>

            </div>
          )}

          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <div className="mb-6 bg-rose-950/40 border border-rose-800 text-rose-300 p-4 rounded-xl">

              <div className="flex justify-between gap-4">

                <div>

                  <p className="font-semibold">
                    Something went wrong
                  </p>

                  <p className="mt-1 text-sm">
                    {error}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setError("")
                  }
                  className="text-rose-300 hover:text-white text-lg"
                >
                  ✕
                </button>

              </div>

            </div>
          )}

          {/* ==================================================
              TABS
          ================================================== */}

          <div className="flex gap-2 mb-7 border-b border-slate-800">

            <button
              type="button"
              onClick={() =>
                setActiveTab(
                  "generator"
                )
              }
              className={`px-5 py-3 font-semibold border-b-2 transition ${
                activeTab ===
                "generator"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              Generator
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveTab(
                  "saved"
                )
              }
              className={`px-5 py-3 font-semibold border-b-2 transition ${
                activeTab ===
                "saved"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              Saved notes

              {savedNotes.length >
                0 && (
                <span className="ml-2 text-xs bg-slate-800 px-2 py-1 rounded-full">
                  {savedNotes.length}
                </span>
              )}

            </button>

          </div>

          {/* ==================================================
              GENERATOR TAB
          ================================================== */}

          {activeTab ===
            "generator" && (
            <div className="space-y-8">

              {/* ==================================================
                  INPUT CARD
              ================================================== */}

              <section className="bg-[#151922] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">

                <div className="mb-7">

                  <h2 className="text-xl md:text-2xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
                    Create new notes
                  </h2>

                  <p className="text-sm text-slate-400 mt-1">
                    Tell ExamAce what you want to learn.
                  </p>

                </div>

                {/* TOPIC */}

                <div className="mb-7">

                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Topic
                  </label>

                  <input
                    type="text"
                    value={topic}
                    onChange={(e) =>
                      setTopic(
                        e.target.value
                      )
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key ===
                          "Enter" &&
                        !loading
                      ) {
                        generateNotes();
                      }
                    }}
                    placeholder="e.g. Current Electricity"
                    className="w-full p-4 rounded-xl bg-[#0B0E14] border border-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition text-white placeholder:text-slate-500"
                  />

                  <div className="flex justify-between mt-2">

                    <p className="text-xs text-slate-500">
                      Press Enter to generate.
                    </p>

                    <p className="text-xs text-slate-500">
                      {topic.length} characters
                    </p>

                  </div>

                </div>

                {/* SUBJECT */}

                <div className="mb-7">

                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Subject
                  </label>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">

                    {SUBJECTS.map(
                      (item) => (
                        <button
                          type="button"
                          key={item}
                          onClick={() =>
                            setSubject(
                              item
                            )
                          }
                          className={`p-3.5 rounded-xl border text-sm font-medium transition ${
                            subject ===
                            item
                              ? "bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-900/20"
                              : "bg-[#0B0E14] border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}

                  </div>

                </div>

                {/* DIFFICULTY */}

                <div className="mb-7">

                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Difficulty
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                    {DIFFICULTIES.map(
                      (item) => (
                        <button
                          type="button"
                          key={
                            item.value
                          }
                          onClick={() =>
                            setDifficulty(
                              item.value
                            )
                          }
                          className={`text-left p-4 rounded-xl border transition ${
                            difficulty ===
                            item.value
                              ? "bg-indigo-600/15 border-indigo-500"
                              : "bg-[#0B0E14] border-slate-800 hover:border-slate-700"
                          }`}
                        >

                          <div className="font-semibold">
                            {item.label}
                          </div>

                          <div className="text-xs text-slate-400 mt-1">
                            {
                              item.description
                            }
                          </div>

                        </button>
                      )
                    )}

                  </div>

                </div>

                {/* NOTE LENGTH */}

                <div className="mb-8">

                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Note length
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                    {NOTE_LENGTHS.map(
                      (item) => (
                        <button
                          type="button"
                          key={
                            item.value
                          }
                          onClick={() =>
                            setNoteLength(
                              item.value
                            )
                          }
                          className={`text-left p-4 rounded-xl border transition ${
                            noteLength ===
                            item.value
                              ? "bg-amber-500/15 border-amber-500"
                              : "bg-[#0B0E14] border-slate-800 hover:border-slate-700"
                          }`}
                        >

                          <div className="font-semibold">
                            {item.label}
                          </div>

                          <div className="text-xs text-slate-400 mt-1">
                            {
                              item.description
                            }
                          </div>

                        </button>
                      )
                    )}

                  </div>

                </div>

                {/* GENERATE BUTTON */}

                <button
                  type="button"
                  onClick={
                    generateNotes
                  }
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed py-4 rounded-xl font-bold text-lg transition shadow-lg shadow-indigo-900/20"
                >

                  {loading ? (
                    <span className="flex items-center justify-center gap-3">

                      <span className="animate-spin">
                        ◌
                      </span>

                      AI is writing your notes...

                    </span>
                  ) : (
                    "Generate AI notes"
                  )}

                </button>

              </section>

              {/* ==================================================
                  GENERATED NOTES
              ================================================== */}

              {generatedNotes && (
                <section className="bg-[#151922] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">

                  {/* HEADER */}

                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-6">

                    <div>

                      <p className="text-sm text-indigo-400 font-bold tracking-wider mb-2">
                        GENERATED NOTES
                      </p>

                      <h2 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
                        {generatedTitle}
                      </h2>

                      <div className="flex flex-wrap gap-2 mt-3">

                        <span className="text-xs px-3 py-1 rounded-full bg-[#0B0E14] border border-slate-800 text-slate-300">
                          {subject}
                        </span>

                        <span className="text-xs px-3 py-1 rounded-full bg-[#0B0E14] border border-slate-800 text-slate-300">
                          {difficulty}
                        </span>

                        <span className="text-xs px-3 py-1 rounded-full bg-[#0B0E14] border border-slate-800 text-slate-300">
                          {noteLength}
                        </span>

                      </div>

                    </div>

                    <div className="flex flex-wrap gap-2">

                      <button
                        type="button"
                        onClick={
                          copyNotes
                        }
                        className="px-4 py-2.5 rounded-lg bg-[#0B0E14] hover:bg-slate-800 border border-slate-800 transition"
                      >
                        Copy
                      </button>

                      <button
                        type="button"
                        onClick={
                          printNotes
                        }
                        className="px-4 py-2.5 rounded-lg bg-[#0B0E14] hover:bg-slate-800 border border-slate-800 transition"
                      >
                        Print
                      </button>

                      <button
                        type="button"
                        onClick={
                          clearGeneratedNotes
                        }
                        className="px-4 py-2.5 rounded-lg bg-rose-950/40 hover:bg-rose-950/60 border border-rose-800 text-rose-300 transition"
                      >
                        Clear
                      </button>

                    </div>

                  </div>

                  {/* NOTES CONTENT */}

                  <div className="bg-[#0B0E14] border border-slate-800 rounded-xl p-5 md:p-7">

                    <div className="whitespace-pre-wrap text-slate-200 leading-8 text-[15px] md:text-base">
                      {generatedNotes}
                    </div>

                  </div>

                  {/* ACTIONS */}

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">

                    <button
                      type="button"
                      onClick={
                        saveNote
                      }
                      disabled={
                        savingNote
                      }
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-500 px-6 py-3.5 rounded-xl font-semibold transition"
                    >

                      {savingNote
                        ? "Saving..."
                        : "Save notes"}

                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab(
                          "saved"
                        )
                      }
                      className="px-6 py-3.5 rounded-xl bg-[#0B0E14] hover:bg-slate-800 border border-slate-800 font-semibold transition"
                    >
                      View saved notes →
                    </button>

                  </div>

                </section>
              )}

              {/* ==================================================
                  EMPTY STATE
              ================================================== */}

              {!generatedNotes &&
                !loading && (
                  <section className="text-center py-14">

                    <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-5xl">
                      📖
                    </div>

                    <h3 className="text-xl font-bold text-slate-300">
                      Ready to learn?
                    </h3>

                    <p className="text-slate-500 mt-2 max-w-lg mx-auto leading-7">
                      Enter a topic above and let
                      ExamAce AI transform it into
                      easy-to-understand study notes.
                    </p>

                  </section>
                )}

            </div>
          )}

          {/* ==================================================
              SAVED NOTES TAB
          ================================================== */}

          {activeTab ===
            "saved" && (
            <section className="bg-[#151922] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">

              {/* HEADER */}

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">

                <div>

                  <h2 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
                    Saved notes
                  </h2>

                  <p className="text-sm text-slate-400 mt-1">
                    Your personal study library.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    startNewNote
                  }
                  className="w-fit bg-indigo-600 hover:bg-indigo-700 px-5 py-3 rounded-xl font-semibold transition"
                >
                  New notes
                </button>

              </div>

              {/* SEARCH */}

              <div className="mb-7">

                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    🔍
                  </span>

                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search your notes..."
                    className="w-full p-4 pl-11 rounded-xl bg-[#0B0E14] border border-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition"
                  />

                </div>

              </div>

              {/* NO NOTES */}

              {savedNotes.length ===
                0 && (
                <div className="text-center py-14">

                  <div className="text-6xl mb-5">
                    📚
                  </div>

                  <h3 className="text-xl font-semibold text-slate-300">
                    No saved notes yet
                  </h3>

                  <p className="text-slate-500 mt-2 max-w-md mx-auto">
                    Generate your first set of
                    notes and save them here.
                  </p>

                  <button
                    type="button"
                    onClick={
                      startNewNote
                    }
                    className="mt-6 bg-indigo-600 hover:bg-indigo-700 px-5 py-3 rounded-xl font-semibold transition"
                  >
                    Create your first notes
                  </button>

                </div>
              )}

              {/* SEARCH EMPTY */}

              {savedNotes.length >
                0 &&
                filteredNotes.length ===
                  0 && (
                  <div className="text-center py-14">

                    <div className="text-5xl mb-5">
                      🔎
                    </div>

                    <h3 className="text-lg font-semibold text-slate-300">
                      No matching notes
                    </h3>

                    <p className="text-slate-500 mt-2">
                      Try another search term.
                    </p>

                  </div>
                )}

              {/* SAVED NOTES GRID */}

              {filteredNotes.length >
                0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {filteredNotes.map(
                    (note) => (
                      <button
                        type="button"
                        key={note.id}
                        onClick={() =>
                          openSavedNote(
                            note
                          )
                        }
                        className="text-left bg-[#0B0E14] hover:bg-slate-900 border border-slate-800 hover:border-indigo-600/50 p-5 rounded-xl transition group"
                      >

                        <div className="flex items-start justify-between gap-4">

                          <div className="flex-1 min-w-0">

                            <h3 className="font-bold text-lg text-white truncate group-hover:text-indigo-400 transition">
                              {note.title ||
                                "Untitled Note"}
                            </h3>

                            <p className="text-sm text-slate-400 mt-3 leading-6">
                              {getPreview(
                                note.content
                              )}
                            </p>

                          </div>

                          <span className="text-2xl">
                            📖
                          </span>

                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-800">

                          <span className="text-xs text-indigo-400 group-hover:text-indigo-300">
                            Open notes →
                          </span>

                        </div>

                      </button>
                    )
                  )}

                </div>
              )}

            </section>
          )}

        </div>

      </main>

    </div>
  );
}
