import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import MathText from "../components/MathText";

const API_URL = "https://examace-ai-cp3e.onrender.com";

const SUBJECTS = [
  "Physics",
  "Chemistry",
  "Mathematics",
  "Biology",
  "Computer Science",
  "Other",
];

const EXAMS = [
  "MHT-CET",
  "JEE",
  "NEET",
  "HSC",
  "CBSE",
  "Other",
];

function getToken() {
  return localStorage.getItem("token");
}

function getLocalISODate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDaysRemaining(examDate) {
  if (!examDate) return 0;

  const today = new Date(`${getLocalISODate()}T00:00:00`);
  const exam = new Date(`${examDate}T00:00:00`);

  const difference = exam.getTime() - today.getTime();

  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

function normalizePlan(plan) {
  if (!plan || typeof plan !== "object") {
    return null;
  }

  const dailyPlan = Array.isArray(plan.daily_plan)
    ? plan.daily_plan
    : [];

  return {
    ...plan,
    daily_plan: dailyPlan.map((day, index) => ({
      day: day?.day ?? index + 1,
      date: day?.date ?? "",
      tasks: Array.isArray(day?.tasks)
        ? day.tasks.map((task) => ({
            id: task?.id ?? null,
            subject: task?.subject ?? "",
            topic: task?.topic ?? "",
            activity: task?.activity ?? "",
            hours: Number(task?.hours ?? 0),
            completed: Boolean(task?.completed),
          }))
        : [],
    })),
  };
}

export default function Planner() {
  const [mode, setMode] = useState("ai");

  const [exam, setExam] = useState("MHT-CET");
  const [examDate, setExamDate] = useState("");
  const [hours, setHours] = useState(6);

  const [subjects, setSubjects] = useState(
    SUBJECTS.slice(0, 3).map((subject) => ({
      name: subject,
      strength: "Medium",
    }))
  );

  const [aiPlan, setAiPlan] = useState(null);
  const [planId, setPlanId] = useState(null);

  const [loadingPlan, setLoadingPlan] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [manualText, setManualText] = useState("");
  const [manualSubject, setManualSubject] = useState("Mathematics");
  const [manualDate, setManualDate] = useState(getLocalISODate());
  const [manualHours, setManualHours] = useState(1);

  const [addingTask, setAddingTask] = useState(false);
  const [deletingTask, setDeletingTask] = useState(null);
  const [deletingPlan, setDeletingPlan] = useState(false);

  const daysRemaining = useMemo(
    () => getDaysRemaining(examDate),
    [examDate]
  );

  // ============================================================
  // AUTH HEADERS
  // ============================================================

  function authHeaders() {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  // ============================================================
  // LOAD SAVED PLAN
  // ============================================================

  async function loadSavedPlan() {
    const token = getToken();

    if (!token) {
      setLoadingPlan(false);
      return;
    }

    try {
      setLoadingPlan(true);
      setError("");

      const response = await fetch(
        `${API_URL}/my-plan`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "Failed to load saved plan."
        );
      }

      if (!data.plan) {
        setAiPlan(null);
        setPlanId(null);
        return;
      }

      const loadedPlan = normalizePlan(data.plan);

      setAiPlan(loadedPlan);
      setPlanId(data.plan_id ?? null);

      if (data.exam) {
        setExam(data.exam);
      }

      if (data.exam_date) {
        setExamDate(data.exam_date);
      }

      if (data.hours_per_day) {
        setHours(data.hours_per_day);
      }

      if (data.mode) {
        setMode(data.mode);
      }
    } catch (err) {
      console.error("Load plan error:", err);
      setError(err.message || "Failed to load saved plan.");
    } finally {
      setLoadingPlan(false);
    }
  }

  useEffect(() => {
    loadSavedPlan();
  }, []);

  // ============================================================
  // SUBJECT HANDLING
  // ============================================================

  function addSubject() {
    const existingNames = subjects.map((item) => item.name);

    const available = SUBJECTS.find(
      (subject) => !existingNames.includes(subject)
    );

    if (!available) return;

    setSubjects((prev) => [
      ...prev,
      {
        name: available,
        strength: "Medium",
      },
    ]);
  }

  function removeSubject(index) {
    setSubjects((prev) =>
      prev.filter((_, i) => i !== index)
    );
  }

  function updateSubject(index, field, value) {
    setSubjects((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  // ============================================================
  // SAVE PLAN
  // ============================================================
  //
  // IMPORTANT:
  // /save-plan already creates StudyTask rows in the backend.
  //
  // Therefore we DO NOT loop through the AI tasks and call
  // /study-task here.
  //
  // After saving, /my-plan is called again so the frontend gets
  // the real database task IDs.
  // ============================================================

  async function saveAIPlan(plan) {
    if (!plan) return false;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/save-plan`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            exam,
            today: getLocalISODate(),
            exam_date: examDate,
            days_remaining: daysRemaining,
            hours_per_day: Number(hours),
            mode: "ai",
            plan_data: plan,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "Failed to save study plan."
        );
      }

      setPlanId(data.plan_id ?? null);

      // Reload from database.
      // This gives every task its real database ID.
      await loadSavedPlan();

      setSuccess("Study plan saved successfully.");

      return true;
    } catch (err) {
      console.error("Save plan error:", err);

      setError(
        err.message || "Failed to save study plan."
      );

      return false;
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // GENERATE AI PLAN
  // ============================================================

  async function generateAIPlan() {
    setError("");
    setSuccess("");

    if (!examDate) {
      setError("Please select your exam date.");
      return;
    }

    if (daysRemaining <= 0) {
      setError("Exam date must be in the future.");
      return;
    }

    if (!hours || Number(hours) <= 0) {
      setError("Study hours must be greater than zero.");
      return;
    }

    if (!subjects.length) {
      setError("Please select at least one subject.");
      return;
    }

    try {
      setGenerating(true);

      const response = await fetch(
        `${API_URL}/generate-plan`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            exam,
            today: getLocalISODate(),
            exam_date: examDate,
            days_remaining: daysRemaining,
            hours_per_day: Number(hours),
            subjects,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "Failed to generate study plan."
        );
      }

      if (!data.content) {
        throw new Error(
          "The AI returned an empty study plan."
        );
      }

      let parsedPlan;

      try {
        parsedPlan =
          typeof data.content === "string"
            ? JSON.parse(data.content)
            : data.content;
      } catch (parseError) {
        console.error(
          "Plan JSON parsing error:",
          parseError
        );

        throw new Error(
          "AI returned an invalid study plan format. Please try again."
        );
      }

      const normalized = normalizePlan(parsedPlan);

      if (
        !normalized ||
        !Array.isArray(normalized.daily_plan)
      ) {
        throw new Error(
          "AI returned an invalid study plan."
        );
      }

      setAiPlan(normalized);

      // Automatically save.
      await saveAIPlan(normalized);
    } catch (err) {
      console.error("Generate plan error:", err);

      setError(
        err.message ||
          "Failed to generate study plan."
      );
    } finally {
      setGenerating(false);
    }
  }

  // ============================================================
  // TOGGLE TASK
  // ============================================================

  async function toggleTask(taskId) {
    if (!taskId) {
      setError(
        "This task is not connected to the database yet. Please reload the plan."
      );
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/study-task/${taskId}`,
        {
          method: "PATCH",
          headers: authHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "Failed to update task."
        );
      }

      setAiPlan((previous) => {
        if (!previous) return previous;

        return {
          ...previous,
          daily_plan: previous.daily_plan.map(
            (day) => ({
              ...day,
              tasks: day.tasks.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      completed: Boolean(
                        data.completed
                      ),
                    }
                  : task
              ),
            })
          ),
        };
      });
    } catch (err) {
      console.error("Toggle task error:", err);
      setError(
        err.message || "Failed to update task."
      );
    }
  }

  // ============================================================
  // DELETE TASK
  // ============================================================

  async function deleteTask(taskId) {
    if (!taskId) return;

    try {
      setDeletingTask(taskId);
      setError("");

      const response = await fetch(
        `${API_URL}/study-task/${taskId}`,
        {
          method: "DELETE",
          headers: authHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "Failed to delete task."
        );
      }

      setAiPlan((previous) => {
        if (!previous) return previous;

        return {
          ...previous,
          daily_plan: previous.daily_plan
            .map((day) => ({
              ...day,
              tasks: day.tasks.filter(
                (task) => task.id !== taskId
              ),
            }))
            .filter(
              (day) => day.tasks.length > 0
            ),
        };
      });

      setSuccess("Task deleted.");
    } catch (err) {
      console.error("Delete task error:", err);

      setError(
        err.message || "Failed to delete task."
      );
    } finally {
      setDeletingTask(null);
    }
  }

  // ============================================================
  // ADD MANUAL TASK
  // ============================================================

  async function addTask(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!manualText.trim()) {
      setError("Enter a task.");
      return;
    }

    if (!manualDate) {
      setError("Select a date.");
      return;
    }

    try {
      setAddingTask(true);

      const response = await fetch(
        `${API_URL}/study-task`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            text: manualText.trim(),
            subject: manualSubject,
            date: manualDate,
            hours: Number(manualHours),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "Failed to add task."
        );
      }

      setManualText("");
      setManualHours(1);

      await loadSavedPlan();

      setSuccess("Task added successfully.");
    } catch (err) {
      console.error("Add task error:", err);

      setError(
        err.message || "Failed to add task."
      );
    } finally {
      setAddingTask(false);
    }
  }

  // ============================================================
  // DELETE ENTIRE PLAN
  // ============================================================

  async function deletePlan() {
    if (!window.confirm(
      "Delete your entire study plan?"
    )) {
      return;
    }

    try {
      setDeletingPlan(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/my-plan`,
        {
          method: "DELETE",
          headers: authHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "Failed to delete plan."
        );
      }

      setAiPlan(null);
      setPlanId(null);

      setSuccess("Study plan deleted.");
    } catch (err) {
      console.error("Delete plan error:", err);

      setError(
        err.message || "Failed to delete study plan."
      );
    } finally {
      setDeletingPlan(false);
    }
  }

  // ============================================================
  // STATISTICS
  // ============================================================

  const statistics = useMemo(() => {
    if (!aiPlan?.daily_plan) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        totalHours: 0,
        completedHours: 0,
        progress: 0,
      };
    }

    const allTasks = aiPlan.daily_plan.flatMap(
      (day) => day.tasks || []
    );

    const totalTasks = allTasks.length;

    const completedTasks = allTasks.filter(
      (task) => task.completed
    ).length;

    const totalHours = allTasks.reduce(
      (sum, task) =>
        sum + Number(task.hours || 0),
      0
    );

    const completedHours = allTasks
      .filter((task) => task.completed)
      .reduce(
        (sum, task) =>
          sum + Number(task.hours || 0),
        0
      );

    const progress =
      totalTasks > 0
        ? Math.round(
            (completedTasks / totalTasks) * 100
          )
        : 0;

    return {
      totalTasks,
      completedTasks,
      totalHours,
      completedHours,
      progress,
    };
  }, [aiPlan]);

  // ============================================================
  // LOADING
  // ============================================================

  if (loadingPlan) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex">
        <Sidebar />

        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-10 h-10 border-4 border-slate-600 border-t-blue-500 rounded-full mx-auto mb-4" />

            <p className="text-slate-300">
              Loading your study plan...
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <Sidebar />

      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">

          {/* HEADER */}

          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div>
                <h1 className="text-3xl md:text-4xl font-bold">
                  AI Study Planner
                </h1>

                <p className="text-slate-400 mt-2">
                  Build a personalized preparation plan
                  and track your progress.
                </p>
              </div>

              {aiPlan && (
                <button
                  onClick={deletePlan}
                  disabled={deletingPlan}
                  className="px-4 py-2 rounded-lg bg-red-600/20 border border-red-500/30 text-red-300 hover:bg-red-600/30 disabled:opacity-50"
                >
                  {deletingPlan
                    ? "Deleting..."
                    : "Delete Plan"}
                </button>
              )}
            </div>
          </div>

          {/* ERROR */}

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
              {error}
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">
              {success}
            </div>
          )}

          {/* SETUP */}

          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-7 mb-8">

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">
                  Plan Settings
                </h2>

                <p className="text-slate-400 text-sm mt-1">
                  Tell ExamAce about your preparation.
                </p>
              </div>

              <div className="flex rounded-lg bg-slate-800 p-1">
                <button
                  onClick={() => setMode("ai")}
                  className={`px-4 py-2 rounded-md text-sm ${
                    mode === "ai"
                      ? "bg-blue-600 text-white"
                      : "text-slate-400"
                  }`}
                >
                  AI Plan
                </button>

                <button
                  onClick={() => setMode("manual")}
                  className={`px-4 py-2 rounded-md text-sm ${
                    mode === "manual"
                      ? "bg-blue-600 text-white"
                      : "text-slate-400"
                  }`}
                >
                  Manual
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* EXAM */}

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Exam
                </label>

                <select
                  value={exam}
                  onChange={(e) =>
                    setExam(e.target.value)
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
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

              {/* EXAM DATE */}

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Exam Date
                </label>

                <input
                  type="date"
                  value={examDate}
                  min={getLocalISODate()}
                  onChange={(e) =>
                    setExamDate(e.target.value)
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                />

                {examDate && (
                  <p className="text-sm text-blue-400 mt-2">
                    {daysRemaining > 0
                      ? `${daysRemaining} days remaining`
                      : "Exam date has passed"}
                  </p>
                )}
              </div>

              {/* HOURS */}

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Study Hours / Day
                </label>

                <input
                  type="number"
                  min="1"
                  max="24"
                  step="0.5"
                  value={hours}
                  onChange={(e) =>
                    setHours(e.target.value)
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* SUBJECTS */}

            <div className="mt-7">

              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold">
                    Subjects
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    Your weaker subjects receive more
                    attention.
                  </p>
                </div>

                <button
                  onClick={addSubject}
                  className="text-sm px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700"
                >
                  + Add Subject
                </button>
              </div>

              <div className="space-y-3">
                {subjects.map(
                  (subject, index) => (
                    <div
                      key={`${subject.name}-${index}`}
                      className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3"
                    >

                      <select
                        value={subject.name}
                        onChange={(e) =>
                          updateSubject(
                            index,
                            "name",
                            e.target.value
                          )
                        }
                        className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
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

                      <select
                        value={subject.strength}
                        onChange={(e) =>
                          updateSubject(
                            index,
                            "strength",
                            e.target.value
                          )
                        }
                        className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
                      >
                        <option value="Weak">
                          🔴 Weak
                        </option>

                        <option value="Medium">
                          🟡 Medium
                        </option>

                        <option value="Strong">
                          🟢 Strong
                        </option>
                      </select>

                      <button
                        onClick={() =>
                          removeSubject(index)
                        }
                        disabled={
                          subjects.length <= 1
                        }
                        className="px-4 py-3 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20 disabled:opacity-30"
                      >
                        Remove
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* GENERATE */}

            {mode === "ai" && (
              <button
                onClick={generateAIPlan}
                disabled={
                  generating ||
                  saving ||
                  !examDate
                }
                className="mt-7 w-full md:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating
                  ? "Generating..."
                  : saving
                  ? "Saving..."
                  : "Generate AI Study Plan"}
              </button>
            )}
          </section>

          {/* MANUAL TASK */}

          {mode === "manual" && (
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-7 mb-8">

              <h2 className="text-xl font-bold mb-1">
                Add Manual Task
              </h2>

              <p className="text-slate-400 text-sm mb-6">
                Add your own study task to the current
                plan.
              </p>

              {!aiPlan && (
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 mb-5">
                  Generate an AI plan first. Manual
                  tasks are attached to the current
                  saved plan.
                </div>
              )}

              <form
                onSubmit={addTask}
                className="grid grid-cols-1 md:grid-cols-4 gap-4"
              >

                <input
                  value={manualText}
                  onChange={(e) =>
                    setManualText(e.target.value)
                  }
                  placeholder="e.g. Revise trigonometric identities"
                  className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
                />

                <select
                  value={manualSubject}
                  onChange={(e) =>
                    setManualSubject(e.target.value)
                  }
                  className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
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

                <input
                  type="date"
                  value={manualDate}
                  min={getLocalISODate()}
                  onChange={(e) =>
                    setManualDate(e.target.value)
                  }
                  className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
                />

                <input
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={manualHours}
                  onChange={(e) =>
                    setManualHours(e.target.value)
                  }
                  className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3"
                />

                <button
                  type="submit"
                  disabled={
                    addingTask || !aiPlan
                  }
                  className="md:col-span-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg px-5 py-3 font-semibold disabled:opacity-50"
                >
                  {addingTask
                    ? "Adding..."
                    : "Add Task"}
                </button>
              </form>
            </section>
          )}

          {/* NO PLAN */}

          {!aiPlan && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">

              <div className="text-5xl mb-4">
                📚
              </div>

              <h2 className="text-2xl font-bold mb-2">
                No study plan yet
              </h2>

              <p className="text-slate-400 max-w-lg mx-auto">
                Select your exam, exam date, subjects
                and daily study hours above, then generate
                your personalized ExamAce AI study plan.
              </p>
            </div>
          )}

          {/* PLAN */}

          {aiPlan && (
            <>
              {/* STATISTICS */}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <p className="text-slate-400 text-sm">
                    Tasks
                  </p>

                  <p className="text-2xl font-bold mt-1">
                    {statistics.completedTasks}/
                    {statistics.totalTasks}
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <p className="text-slate-400 text-sm">
                    Study Hours
                  </p>

                  <p className="text-2xl font-bold mt-1">
                    {statistics.completedHours.toFixed(
                      1
                    )}
                    /
                    {statistics.totalHours.toFixed(
                      1
                    )}
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <p className="text-slate-400 text-sm">
                    Progress
                  </p>

                  <p className="text-2xl font-bold mt-1">
                    {statistics.progress}%
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <p className="text-slate-400 text-sm">
                    Days Left
                  </p>

                  <p className="text-2xl font-bold mt-1">
                    {daysRemaining > 0
                      ? daysRemaining
                      : "—"}
                  </p>
                </div>
              </div>

              {/* PROGRESS BAR */}

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8">

                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-300">
                    Overall Progress
                  </span>

                  <span className="text-blue-400">
                    {statistics.progress}%
                  </span>
                </div>

                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-500"
                    style={{
                      width: `${statistics.progress}%`,
                    }}
                  />
                </div>
              </div>

              {/* OVERVIEW */}

              {aiPlan.overview && (
                <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-7 mb-8">

                  <h2 className="text-xl font-bold mb-4">
                    Plan Overview
                  </h2>

                  <div className="text-slate-300 leading-7">
                    <MathText
                      text={aiPlan.overview}
                    />
                  </div>
                </section>
              )}

              {/* PHASES */}

              {Array.isArray(aiPlan.phases) &&
                aiPlan.phases.length > 0 && (
                  <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-7 mb-8">

                    <h2 className="text-xl font-bold mb-5">
                      Preparation Phases
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      {aiPlan.phases.map(
                        (phase, index) => (
                          <div
                            key={index}
                            className="bg-slate-800/60 border border-slate-700 rounded-xl p-5"
                          >
                            <div className="text-blue-400 text-sm font-semibold mb-2">
                              Phase{" "}
                              {phase.phase ??
                                index + 1}
                            </div>

                            <h3 className="font-bold text-lg mb-2">
                              <MathText
                                text={
                                  phase.name ||
                                  phase.title ||
                                  ""
                                }
                              />
                            </h3>

                            {(phase.goal ||
                              phase.description) && (
                              <div className="text-slate-400 text-sm leading-6">
                                <MathText
                                  text={
                                    phase.goal ||
                                    phase.description
                                  }
                                />
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </section>
                )}

              {/* DAILY PLAN */}

              <section>

                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-2xl font-bold">
                    Daily Study Plan
                  </h2>

                  {planId && (
                    <span className="text-xs text-slate-500">
                      Saved Plan #{planId}
                    </span>
                  )}
                </div>

                <div className="space-y-5">

                  {aiPlan.daily_plan.map(
                    (day, dayIndex) => (
                      <div
                        key={`${day.day}-${day.date}-${dayIndex}`}
                        className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
                      >

                        {/* DAY HEADER */}

                        <div className="bg-slate-800/70 px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">

                          <div>
                            <h3 className="font-bold text-lg">
                              Day {day.day}
                            </h3>

                            {day.date && (
                              <p className="text-slate-400 text-sm">
                                {day.date}
                              </p>
                            )}
                          </div>

                          <div className="text-sm text-slate-400">
                            {day.tasks?.length || 0}{" "}
                            tasks
                          </div>
                        </div>

                        {/* TASKS */}

                        <div className="p-4 md:p-5 space-y-3">

                          {day.tasks?.length ===
                            0 && (
                            <p className="text-slate-500 text-sm">
                              No tasks for this day.
                            </p>
                          )}

                          {day.tasks?.map(
                            (task, taskIndex) => (
                              <div
                                key={
                                  task.id ??
                                  `${dayIndex}-${taskIndex}`
                                }
                                className={`border rounded-xl p-4 transition ${
                                  task.completed
                                    ? "border-emerald-500/20 bg-emerald-500/5"
                                    : "border-slate-700 bg-slate-800/30"
                                }`}
                              >

                                <div className="flex items-start gap-3">

                                  <button
                                    onClick={() =>
                                      toggleTask(
                                        task.id
                                      )
                                    }
                                    disabled={
                                      !task.id
                                    }
                                    className={`mt-1 w-6 h-6 rounded-md border flex items-center justify-center flex-shrink-0 ${
                                      task.completed
                                        ? "bg-emerald-600 border-emerald-500"
                                        : "border-slate-600 hover:border-blue-500"
                                    }`}
                                  >
                                    {task.completed &&
                                      "✓"}
                                  </button>

                                  <div className="flex-1 min-w-0">

                                    <div className="flex flex-wrap gap-2 mb-2">

                                      {task.subject && (
                                        <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-300 text-xs">
                                          <MathText
                                            text={
                                              task.subject
                                            }
                                          />
                                        </span>
                                      )}

                                      {task.hours > 0 && (
                                        <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-400 text-xs">
                                          {task.hours}{" "}
                                          hr
                                        </span>
                                      )}
                                    </div>

                                    {task.topic && (
                                      <h4
                                        className={`font-semibold ${
                                          task.completed
                                            ? "text-slate-500 line-through"
                                            : "text-white"
                                        }`}
                                      >
                                        <MathText
                                          text={
                                            task.topic
                                          }
                                        />
                                      </h4>
                                    )}

                                    {task.activity && (
                                      <div className="text-slate-400 text-sm mt-2 leading-6">
                                        <MathText
                                          text={
                                            task.activity
                                          }
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {task.id && (
                                    <button
                                      onClick={() =>
                                        deleteTask(
                                          task.id
                                        )
                                      }
                                      disabled={
                                        deletingTask ===
                                        task.id
                                      }
                                      className="text-slate-500 hover:text-red-400 text-sm"
                                    >
                                      {deletingTask ===
                                      task.id
                                        ? "..."
                                        : "Delete"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
