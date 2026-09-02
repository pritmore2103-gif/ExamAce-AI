import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";

const API_URL = "https://examace-ai-cp3e.onrender.com";

const MODES = [
  {
    id: "ai",
    icon: "🧠",
    title: "AI Planner",
    description: "Let AI create an optimized study plan for you.",
  },
  {
    id: "normal",
    icon: "📅",
    title: "Normal Planner",
    description: "Create and manage your own study schedule.",
  },
  {
    id: "both",
    icon: "⚡",
    title: "AI + Normal",
    description: "Let AI create it, then edit and manage everything.",
  },
];

const DEFAULT_SUBJECTS = [
  { name: "Physics", level: "Average" },
  { name: "Chemistry", level: "Average" },
  { name: "Mathematics", level: "Average" },
];

export default function Planner() {
  // ============================================================
  // DATE
  // ============================================================

  const today = new Date();

  const todayISO = today.toISOString().split("T")[0];

  const todayString = today.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // ============================================================
  // PLANNER STATE
  // ============================================================

  const [mode, setMode] = useState("both");

  const [exam, setExam] = useState("");
  const [examDate, setExamDate] = useState("");
  const [hours, setHours] = useState("");

  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);

  const [planCreated, setPlanCreated] = useState(false);

  // ============================================================
  // AI STATE
  // ============================================================

  const [aiPlan, setAiPlan] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState("");

  // ============================================================
  // TASK STATE
  // ============================================================

  const [tasks, setTasks] = useState([]);

  const [taskText, setTaskText] = useState("");
  const [taskSubject, setTaskSubject] = useState("Physics");
  const [taskDate, setTaskDate] = useState("");
  const [taskHours, setTaskHours] = useState("");

  const [addingTask, setAddingTask] = useState(false);

  // ============================================================
  // DATABASE PLAN STATE
  // ============================================================

  const [planId, setPlanId] = useState(null);

  const [loadingPlan, setLoadingPlan] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

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
  // DAYS REMAINING
  // ============================================================

  const daysRemaining = useMemo(() => {
    if (!examDate) {
      return null;
    }

    const examDay = new Date(`${examDate}T00:00:00`);
    const currentDay = new Date(`${todayISO}T00:00:00`);

    return Math.ceil(
      (examDay - currentDay) / (1000 * 60 * 60 * 24)
    );
  }, [examDate, todayISO]);

  // ============================================================
  // LOAD SAVED PLAN
  // ============================================================

  const loadSavedPlan = async () => {
    const token = getToken();

    if (!token) {
      setLoadingPlan(false);
      return;
    }

    try {
      setLoadingPlan(true);
      setAiError("");

      const response = await fetch(`${API_URL}/my-plan`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        setLoadingPlan(false);
        return;
      }

      if (!response.ok) {
        throw new Error(
          `Failed to load planner (${response.status})`
        );
      }

      const data = await response.json();

      // --------------------------------------------------------
      // No saved plan
      // --------------------------------------------------------

      if (!data.plan) {
        setPlanCreated(false);
        setAiPlan(null);
        setTasks([]);
        setPlanId(null);
        return;
      }

      // --------------------------------------------------------
      // Restore planner data
      // --------------------------------------------------------

      setPlanId(data.plan_id || null);

      setExam(data.exam || "");

      setExamDate(data.exam_date || "");

      setHours(
        data.hours_per_day !== undefined &&
          data.hours_per_day !== null
          ? String(data.hours_per_day)
          : ""
      );

      setMode(data.mode || "both");

      setPlanCreated(true);

      // --------------------------------------------------------
      // Restore AI plan
      // --------------------------------------------------------

      if (data.plan) {
        setAiPlan(data.plan);
      }

      // --------------------------------------------------------
      // Restore AI tasks into task list
      // --------------------------------------------------------

      const savedTasks = [];

      if (data.plan?.daily_plan) {
        data.plan.daily_plan.forEach((day) => {
          if (!Array.isArray(day.tasks)) {
            return;
          }

          day.tasks.forEach((task) => {
            if (!task.id) {
              return;
            }

            savedTasks.push({
              id: task.id,
              text: task.topic || "",
              subject: task.subject || "",
              date: day.date || "",
              hours: Number(task.hours || 0),
              activity: task.activity || "",
              completed: Boolean(task.completed),
              aiGenerated: true,
            });
          });
        });
      }

      setTasks(savedTasks);
    } catch (error) {
      console.error("Load planner error:", error);

      setAiError(
        error.message || "Could not load your saved study plan."
      );
    } finally {
      setLoadingPlan(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadSavedPlan();
  }, []);

  // ============================================================
  // SUCCESS MESSAGE AUTO CLEAR
  // ============================================================

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccessMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [successMessage]);

  // ============================================================
  // SUBJECT LEVEL
  // ============================================================

  const updateSubjectLevel = (index, level) => {
    setSubjects((previous) =>
      previous.map((subject, subjectIndex) =>
        subjectIndex === index
          ? {
              ...subject,
              level,
            }
          : subject
      )
    );
  };

  // ============================================================
  // VALIDATE PLANNER
  // ============================================================

  const validatePlanner = () => {
    if (!exam || !examDate || !hours) {
      alert(
        "Please fill exam, exam date and daily study hours."
      );

      return false;
    }

    if (daysRemaining === null || daysRemaining <= 0) {
      alert("Please select a future exam date.");
      return false;
    }

    const numericHours = Number(hours);

    if (
      Number.isNaN(numericHours) ||
      numericHours <= 0
    ) {
      alert("Study hours must be greater than zero.");
      return false;
    }

    if (numericHours > 16) {
      alert("Study hours cannot be more than 16 per day.");
      return false;
    }

    return true;
  };

  // ============================================================
  // GENERATE AI PLAN
  // ============================================================

  const generateAIPlan = async () => {
    if (!validatePlanner()) {
      return null;
    }

    const token = getToken();

    if (!token) {
      alert("Please login first to use the AI Planner.");
      return null;
    }

    try {
      setLoadingAI(true);
      setAiError("");
      setSuccessMessage("");

      const numericHours = Number(hours);

      const response = await fetch(
        `${API_URL}/generate-plan`,
        {
          method: "POST",

          headers: getAuthHeaders(),

          body: JSON.stringify({
            exam,
            today: todayISO,
            exam_date: examDate,
            days_remaining: daysRemaining,
            hours_per_day: numericHours,
            subjects,
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

        console.error(
          "AI backend error:",
          errorText
        );

        throw new Error(
          `Backend returned ${response.status}: ${errorText}`
        );
      }

      const data = await response.json();

      // --------------------------------------------------------
      // Parse AI response
      // --------------------------------------------------------

      let parsedPlan;

      if (typeof data.content === "string") {
        try {
          parsedPlan = JSON.parse(data.content);
        } catch (error) {
          console.error(
            "AI JSON parse error:",
            error
          );

          throw new Error(
            "AI returned an invalid study plan format."
          );
        }
      } else {
        parsedPlan = data.content;
      }

      if (
        !parsedPlan ||
        typeof parsedPlan !== "object"
      ) {
        throw new Error(
          "AI returned an empty study plan."
        );
      }

      // --------------------------------------------------------
      // Ensure daily_plan exists
      // --------------------------------------------------------

      if (!Array.isArray(parsedPlan.daily_plan)) {
        parsedPlan.daily_plan = [];
      }

      // --------------------------------------------------------
      // Set plan
      // --------------------------------------------------------

      setAiPlan(parsedPlan);

      setPlanCreated(true);

      // --------------------------------------------------------
      // Save to database
      // --------------------------------------------------------

      await saveAIPlan(parsedPlan);

      return parsedPlan;
    } catch (error) {
      console.error(
        "AI Planner Error:",
        error
      );

      setAiError(
        error.message ||
          "Failed to generate study plan."
      );

      return null;
    } finally {
      setLoadingAI(false);
    }
  };

  // ============================================================
  // SAVE AI PLAN
  // ============================================================

  const saveAIPlan = async (planToSave = aiPlan) => {
    if (!planToSave) {
      return;
    }

    const token = getToken();

    if (!token) {
      throw new Error("Please login first.");
    }

    try {
      setSavingPlan(true);

      const response = await fetch(
        `${API_URL}/save-plan`,
        {
          method: "POST",

          headers: getAuthHeaders(),

          body: JSON.stringify({
            exam,
            today: todayISO,
            exam_date: examDate,
            days_remaining: daysRemaining,
            hours_per_day: Number(hours),
            mode,
            plan_data: planToSave,
          }),
        }
      );

      if (response.status === 401) {
        throw new Error(
          "Your login session has expired."
        );
      }

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          `Failed to save plan: ${errorText}`
        );
      }

      const data = await response.json();

      if (data.plan_id) {
        setPlanId(data.plan_id);
      }

      setSuccessMessage(
        "Study plan saved successfully!"
      );

      // --------------------------------------------------------
      // Reload database version
      // --------------------------------------------------------

      await loadSavedPlan();
    } catch (error) {
      console.error(
        "Save plan error:",
        error
      );

      throw error;
    } finally {
      setSavingPlan(false);
    }
  };

  // ============================================================
  // CREATE PLANNER
  // ============================================================

  const createPlanner = async () => {
    if (!validatePlanner()) {
      return;
    }

    setPlanCreated(true);

    // Normal planner
    if (mode === "normal") {
      setAiError("");

      setSuccessMessage(
        "Your planner is ready. Add your study tasks below."
      );

      return;
    }

    // AI or AI + Normal
    await generateAIPlan();
  };

  // ============================================================
  // AI TASK COUNTS
  // ============================================================

  const totalAITasks =
    aiPlan?.daily_plan?.reduce(
      (total, day) =>
        total + (Array.isArray(day.tasks) ? day.tasks.length : 0),
      0
    ) || 0;

  const completedAITaskCount =
    aiPlan?.daily_plan?.reduce(
      (total, day) =>
        total +
        (Array.isArray(day.tasks)
          ? day.tasks.filter(
              (task) => task.completed === true
            ).length
          : 0),
      0
    ) || 0;

  const aiProgress =
    totalAITasks === 0
      ? 0
      : Math.round(
          (completedAITaskCount /
            totalAITasks) *
            100
        );

  // ============================================================
  // MANUAL TASK PROGRESS
  // ============================================================

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  const progress =
    tasks.length === 0
      ? 0
      : Math.round(
          (completedTasks / tasks.length) *
            100
        );

  // ============================================================
  // UPDATE AI PLAN TASK
  // ============================================================

  const updateAIPlanTask = (
    taskId,
    completed
  ) => {
    setAiPlan((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,

        daily_plan:
          previous.daily_plan?.map((day) => ({
            ...day,

            tasks: day.tasks?.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    completed,
                  }
                : task
            ),
          })),
      };
    });
  };

  // ============================================================
  // TOGGLE TASK
  // ============================================================

  const toggleAITask = async (taskId) => {
    if (!taskId) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/study-task/${taskId}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        }
      );

      if (response.status === 401) {
        throw new Error(
          "Your login session has expired."
        );
      }

      if (!response.ok) {
        throw new Error(
          "Could not update task."
        );
      }

      const data = await response.json();

      const completed = Boolean(
        data.completed
      );

      updateAIPlanTask(
        taskId,
        completed
      );

      setTasks((previous) =>
        previous.map((task) =>
          task.id === taskId
            ? {
                ...task,
                completed,
              }
            : task
        )
      );
    } catch (error) {
      console.error(
        "AI task update error:",
        error
      );

      alert(
        error.message ||
          "Could not update task."
      );
    }
  };

  // ============================================================
  // ADD MANUAL TASK
  // ============================================================

  const addTask = async () => {
    if (
      !taskText.trim() ||
      !taskDate ||
      !taskHours
    ) {
      alert("Please fill all task fields.");
      return;
    }

    const numericHours = Number(taskHours);

    if (
      Number.isNaN(numericHours) ||
      numericHours <= 0
    ) {
      alert("Please enter valid study hours.");
      return;
    }

    if (numericHours > 24) {
      alert(
        "Task hours cannot be more than 24."
      );
      return;
    }

    const token = getToken();

    if (!token) {
      alert("Please login first.");
      return;
    }

    try {
      setAddingTask(true);

      const response = await fetch(
        `${API_URL}/study-task`,
        {
          method: "POST",

          headers: getAuthHeaders(),

          body: JSON.stringify({
            text: taskText.trim(),
            subject: taskSubject,
            date: taskDate,
            hours: numericHours,
          }),
        }
      );

      if (response.status === 401) {
        throw new Error(
          "Your login session has expired."
        );
      }

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          errorText ||
            "Could not add task."
        );
      }

      const data = await response.json();

      if (data.task) {
        setTasks((previous) => [
          ...previous,

          {
            id: data.task.id,
            text: data.task.topic || "",
            subject: data.task.subject || "",
            date: data.task.date || "",
            hours: Number(data.task.hours || 0),
            activity: data.task.activity || "",
            completed: Boolean(
              data.task.completed
            ),
            aiGenerated: false,
          },
        ]);
      }

      setTaskText("");
      setTaskDate("");
      setTaskHours("");

      setSuccessMessage(
        "Task added successfully!"
      );
    } catch (error) {
      console.error(
        "Add task error:",
        error
      );

      alert(
        error.message ||
          "Could not add task."
      );
    } finally {
      setAddingTask(false);
    }
  };

  // ============================================================
  // TOGGLE MANUAL TASK
  // ============================================================

  const toggleTask = async (id) => {
    if (!id) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/study-task/${id}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        }
      );

      if (response.status === 401) {
        throw new Error(
          "Your login session has expired."
        );
      }

      if (!response.ok) {
        throw new Error(
          "Could not update task."
        );
      }

      const data = await response.json();

      const completed = Boolean(
        data.completed
      );

      setTasks((previous) =>
        previous.map((task) =>
          task.id === id
            ? {
                ...task,
                completed,
              }
            : task
        )
      );

      updateAIPlanTask(
        id,
        completed
      );
    } catch (error) {
      console.error(
        "Toggle task error:",
        error
      );

      alert(
        error.message ||
          "Could not update task."
      );
    }
  };

  // ============================================================
  // DELETE TASK
  // ============================================================

  const deleteTask = async (id) => {
    if (!id) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this study task?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/study-task/${id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.status === 401) {
        throw new Error(
          "Your login session has expired."
        );
      }

      if (!response.ok) {
        throw new Error(
          "Could not delete task."
        );
      }

      setTasks((previous) =>
        previous.filter(
          (task) => task.id !== id
        )
      );

      setAiPlan((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,

          daily_plan:
            previous.daily_plan?.map(
              (day) => ({
                ...day,

                tasks:
                  day.tasks?.filter(
                    (task) =>
                      task.id !== id
                  ),
              })
            ),
        };
      });

      setSuccessMessage(
        "Task deleted."
      );
    } catch (error) {
      console.error(
        "Delete task error:",
        error
      );

      alert(
        error.message ||
          "Could not delete task."
      );
    }
  };

  // ============================================================
  // DELETE ENTIRE PLAN
  // ============================================================

  const deletePlan = async () => {
    const confirmed = window.confirm(
      "Delete your entire study plan? This cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    const token = getToken();

    if (!token) {
      alert("Please login first.");
      return;
    }

    try {
      setDeletingPlan(true);

      const response = await fetch(
        `${API_URL}/my-plan`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (response.status === 401) {
        throw new Error(
          "Your login session has expired."
        );
      }

      if (!response.ok) {
        throw new Error(
          "Could not delete planner."
        );
      }

      setAiPlan(null);
      setTasks([]);
      setPlanId(null);
      setPlanCreated(false);

      setExam("");
      setExamDate("");
      setHours("");

      setSuccessMessage(
        "Study plan deleted."
      );
    } catch (error) {
      console.error(
        "Delete plan error:",
        error
      );

      alert(
        error.message ||
          "Could not delete plan."
      );
    } finally {
      setDeletingPlan(false);
    }
  };

  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (loadingPlan) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-white flex">
        <Sidebar />

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="text-5xl mb-4 animate-pulse">
              📅
            </div>

            <h2 className="text-xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
              Loading your planner...
            </h2>

            <p className="text-slate-400 mt-2">
              Checking your saved study plan.
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

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div>
                <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
                  Study planner
                </h1>

                <p className="text-slate-400 mt-2">
                  Plan your preparation your way.
                </p>
              </div>

              {planId && (
                <span className="w-fit text-xs px-3 py-2 rounded-full bg-emerald-950/40 border border-emerald-800 text-emerald-400">
                  ● Plan saved
                </span>
              )}
            </div>
          </div>

          {/* ==================================================
              SUCCESS MESSAGE
          ================================================== */}

          {successMessage && (
            <div className="mb-6 bg-emerald-950/40 border border-emerald-800 text-emerald-300 p-4 rounded-xl">
              {successMessage}
            </div>
          )}

          {/* ==================================================
              MODES
          ================================================== */}

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              How do you want to plan?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MODES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                  className={`text-left p-5 rounded-2xl border transition ${
                    mode === item.id
                      ? "border-indigo-600 bg-indigo-600/10"
                      : "border-slate-800 bg-[#151922] hover:border-slate-700"
                  }`}
                >
                  <div className="text-3xl mb-3">
                    {item.icon}
                  </div>

                  <h3 className="font-bold text-lg">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-400 mt-2">
                    {item.description}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* ==================================================
              STUDY INFORMATION
          ================================================== */}

          <section className="bg-[#151922] border border-slate-800 rounded-2xl p-6 md:p-8 mb-8">
            <h2 className="text-xl font-bold mb-6">
              Study information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

              {/* TODAY */}

              <div className="bg-[#0B0E14] border border-slate-800 p-4 rounded-xl">
                <p className="text-sm text-slate-400">
                  Today
                </p>

                <p className="font-semibold mt-1">
                  {todayString}
                </p>
              </div>

              {/* EXAM */}

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Target exam
                </label>

                <select
                  value={exam}
                  onChange={(e) =>
                    setExam(e.target.value)
                  }
                  className="w-full p-3 rounded-xl bg-[#0B0E14] border border-slate-800 focus:border-indigo-600 outline-none transition"
                >
                  <option value="">
                    Select exam
                  </option>

                  <option value="MHT-CET">
                    MHT-CET
                  </option>

                  <option value="JEE">
                    JEE
                  </option>

                  <option value="NEET">
                    NEET
                  </option>

                  <option value="CBSE Board">
                    CBSE Board
                  </option>

                  <option value="Maharashtra Board">
                    Maharashtra Board
                  </option>
                </select>
              </div>

              {/* EXAM DATE */}

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Exam date
                </label>

                <input
                  type="date"
                  min={todayISO}
                  value={examDate}
                  onChange={(e) =>
                    setExamDate(e.target.value)
                  }
                  className="w-full p-3 rounded-xl bg-[#0B0E14] border border-slate-800 focus:border-indigo-600 outline-none transition"
                />
              </div>

              {/* HOURS */}

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Study hours / day
                </label>

                <input
                  type="number"
                  min="1"
                  max="16"
                  step="0.5"
                  value={hours}
                  onChange={(e) =>
                    setHours(e.target.value)
                  }
                  placeholder="e.g. 5"
                  className="w-full p-3 rounded-xl bg-[#0B0E14] border border-slate-800 focus:border-indigo-600 outline-none transition"
                />
              </div>
            </div>

            {/* DAYS */}

            {daysRemaining !== null && (
              <div className="mt-5 bg-indigo-600/10 border border-indigo-600/30 p-4 rounded-xl">
                <p className="text-sm text-slate-400">
                  Preparation time
                </p>

                <p className="text-2xl font-bold text-indigo-400 mt-1">
                  {daysRemaining > 0
                    ? `${daysRemaining} days remaining`
                    : "Exam date has passed"}
                </p>
              </div>
            )}
          </section>

          {/* ==================================================
              SUBJECT STRENGTH
          ================================================== */}

          <section className="bg-[#151922] border border-slate-800 rounded-2xl p-6 md:p-8 mb-8">
            <h2 className="text-xl font-bold mb-2">
              Subject strength
            </h2>

            <p className="text-slate-400 text-sm mb-6">
              Tell AI how confident you are in each subject.
            </p>

            <div className="space-y-4">
              {subjects.map(
                (subject, index) => (
                  <div
                    key={subject.name}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0B0E14] border border-slate-800 p-4 rounded-xl"
                  >
                    <span className="font-semibold">
                      {subject.name}
                    </span>

                    <div className="flex gap-2">
                      {[
                        "Weak",
                        "Average",
                        "Strong",
                      ].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() =>
                            updateSubjectLevel(
                              index,
                              level
                            )
                          }
                          className={`px-4 py-2 rounded-lg text-sm transition ${
                            subject.level === level
                              ? "bg-indigo-600"
                              : "bg-slate-800 hover:bg-slate-700"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          {/* ==================================================
              CREATE BUTTON
          ================================================== */}

          <div className="flex flex-wrap gap-3 mb-8">
            <button
              type="button"
              onClick={createPlanner}
              disabled={
                loadingAI ||
                savingPlan ||
                deletingPlan
              }
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 px-8 py-3 rounded-xl font-semibold transition"
            >
              {loadingAI
                ? "AI is creating your plan..."
                : savingPlan
                ? "Saving plan..."
                : mode === "normal"
                ? "Create my planner"
                : mode === "ai"
                ? "Generate with AI"
                : "Generate AI + editable plan"}
            </button>

            {planId && (
              <button
                type="button"
                onClick={deletePlan}
                disabled={
                  deletingPlan ||
                  loadingAI ||
                  savingPlan
                }
                className="bg-rose-950/40 hover:bg-rose-950/60 border border-rose-800 text-rose-300 px-6 py-3 rounded-xl font-semibold transition"
              >
                {deletingPlan
                  ? "Deleting..."
                  : "Delete plan"}
              </button>
            )}
          </div>

          {/* ==================================================
              ERROR
          ================================================== */}

          {aiError && (
            <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-4 rounded-xl mb-8">
              <p className="font-semibold mb-1">
                Planner error
              </p>

              <p>{aiError}</p>
            </div>
          )}

          {/* ==================================================
              AI PLAN
          ================================================== */}

          {(mode === "ai" ||
            mode === "both") && (
            <section className="bg-[#151922] border border-slate-800 rounded-2xl p-6 md:p-8 mb-8">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
                    AI study plan
                  </h2>

                  <p className="text-slate-400 text-sm mt-1">
                    Personalized for your preparation
                  </p>
                </div>

                {loadingAI && (
                  <div className="text-indigo-400 animate-pulse">
                    Generating...
                  </div>
                )}
              </div>

              {aiPlan && (
                <div className="space-y-6">

                  {/* OVERVIEW */}

                  {aiPlan.overview && (
                    <div className="bg-[#0B0E14] border border-slate-800 rounded-xl p-5">
                      <h3 className="text-lg font-bold mb-2">
                        Strategy
                      </h3>

                      <p className="text-slate-300 leading-7">
                        {aiPlan.overview}
                      </p>
                    </div>
                  )}

                  {/* PROGRESS */}

                  <div className="bg-[#0B0E14] border border-slate-800 rounded-xl p-5">
                    <div className="flex justify-between mb-3">
                      <span className="font-semibold">
                        AI plan progress
                      </span>

                      <span className="text-indigo-400 font-bold">
                        {aiProgress}%
                      </span>
                    </div>

                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 transition-all duration-500"
                        style={{
                          width: `${aiProgress}%`,
                        }}
                      />
                    </div>

                    <p className="text-sm text-slate-400 mt-2">
                      {completedAITaskCount} of{" "}
                      {totalAITasks} tasks completed
                    </p>
                  </div>

                  {/* PHASES */}

                  {aiPlan.phases?.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold mb-4">
                        Preparation phases
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {aiPlan.phases.map(
                          (phase, index) => (
                            <div
                              key={index}
                              className="bg-[#0B0E14] border border-slate-800 p-5 rounded-xl"
                            >
                              <h4 className="font-bold text-lg">
                                {phase.name}
                              </h4>

                              <p className="text-sm text-slate-400 mt-1">
                                Day{" "}
                                {phase.start_day}{" "}
                                → Day{" "}
                                {phase.end_day}
                              </p>

                              <p className="text-slate-300 mt-3">
                                {phase.goal}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* DAILY PLAN */}

                  {aiPlan.daily_plan?.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold mb-4">
                        Daily plan
                      </h3>

                      <div className="space-y-4">
                        {aiPlan.daily_plan.map(
                          (day, dayIndex) => (
                            <div
                              key={
                                day.day ??
                                day.date ??
                                dayIndex
                              }
                              className="bg-[#0B0E14] border border-slate-800 rounded-xl p-5"
                            >
                              <div className="mb-4">
                                <h4 className="text-lg font-bold">
                                  Day {day.day}
                                </h4>

                                <p className="text-sm text-slate-400">
                                  {day.date}
                                </p>
                              </div>

                              <div className="space-y-3">
                                {day.tasks?.map(
                                  (
                                    task,
                                    taskIndex
                                  ) => {
                                    const completed =
                                      Boolean(
                                        task.completed
                                      );

                                    const taskKey =
                                      task.id ||
                                      `${day.day}-${taskIndex}`;

                                    return (
                                      <div
                                        key={taskKey}
                                        className={`flex items-start gap-4 p-4 rounded-xl transition ${
                                          completed
                                            ? "bg-emerald-950/30 border border-emerald-800"
                                            : "bg-[#151922] border border-slate-800"
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={
                                            completed
                                          }
                                          onChange={() =>
                                            toggleAITask(
                                              task.id
                                            )
                                          }
                                          disabled={
                                            !task.id
                                          }
                                          className="mt-1 w-5 h-5 cursor-pointer accent-indigo-600"
                                        />

                                        <div className="flex-1">
                                          <div className="flex flex-wrap justify-between gap-2">
                                            <h5
                                              className={`font-semibold ${
                                                completed
                                                  ? "line-through text-slate-500"
                                                  : ""
                                              }`}
                                            >
                                              {task.subject}{" "}
                                              —{" "}
                                              {task.topic}
                                            </h5>

                                            <span className="text-indigo-400 text-sm">
                                              {task.hours}h
                                            </span>
                                          </div>

                                          {task.activity && (
                                            <p className="text-sm text-slate-400 mt-1">
                                              {
                                                task.activity
                                              }
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* EMPTY AI STATE */}

              {!aiPlan &&
                !loadingAI &&
                !aiError && (
                  <div className="text-slate-500 text-center py-8">
                    Fill in your study information and generate your plan.
                  </div>
                )}
            </section>
          )}

          {/* ==================================================
              ADD TASK
          ================================================== */}

          {(mode === "normal" ||
            mode === "both") &&
            planCreated && (
              <section className="bg-[#151922] border border-slate-800 rounded-2xl p-6 md:p-8 mb-8">

                <h2 className="text-xl font-bold mb-6">
                  Add study task
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                  <input
                    type="text"
                    value={taskText}
                    onChange={(e) =>
                      setTaskText(e.target.value)
                    }
                    placeholder="Topic / task"
                    className="p-3 rounded-xl bg-[#0B0E14] border border-slate-800 focus:border-indigo-600 outline-none transition"
                  />

                  <select
                    value={taskSubject}
                    onChange={(e) =>
                      setTaskSubject(e.target.value)
                    }
                    className="p-3 rounded-xl bg-[#0B0E14] border border-slate-800 focus:border-indigo-600 outline-none transition"
                  >
                    {subjects.map((subject) => (
                      <option
                        key={subject.name}
                        value={subject.name}
                      >
                        {subject.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={taskDate}
                    min={todayISO}
                    onChange={(e) =>
                      setTaskDate(e.target.value)
                    }
                    className="p-3 rounded-xl bg-[#0B0E14] border border-slate-800 focus:border-indigo-600 outline-none transition"
                  />

                  <input
                    type="number"
                    min="0.5"
                    max="24"
                    step="0.5"
                    value={taskHours}
                    onChange={(e) =>
                      setTaskHours(e.target.value)
                    }
                    placeholder="Hours"
                    className="p-3 rounded-xl bg-[#0B0E14] border border-slate-800 focus:border-indigo-600 outline-none transition"
                  />
                </div>

                <button
                  type="button"
                  onClick={addTask}
                  disabled={addingTask}
                  className="mt-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-500 px-6 py-3 rounded-xl font-semibold transition"
                >
                  {addingTask
                    ? "Adding..."
                    : "Add task"}
                </button>
              </section>
            )}

          {/* ==================================================
              MANUAL PROGRESS
          ================================================== */}

          {planCreated &&
            tasks.length > 0 && (
              <section className="bg-[#151922] border border-slate-800 rounded-2xl p-6 mb-8">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-bold">
                    Planner progress
                  </h2>

                  <span className="text-indigo-400 font-bold">
                    {progress}%
                  </span>
                </div>

                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <p className="text-sm text-slate-400 mt-3">
                  {completedTasks} of{" "}
                  {tasks.length} tasks completed
                </p>
              </section>
            )}

          {/* ==================================================
              TASK LIST
          ================================================== */}

          {tasks.length > 0 && (
            <section className="bg-[#151922] border border-slate-800 rounded-2xl p-6 md:p-8 mb-8">

              <h2 className="text-xl font-bold mb-6">
                Your tasks
              </h2>

              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border ${
                      task.completed
                        ? "bg-emerald-950/30 border-emerald-800"
                        : "bg-[#0B0E14] border-slate-800"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() =>
                          toggleTask(task.id)
                        }
                        className="mt-1 w-5 h-5 cursor-pointer accent-indigo-600"
                      />

                      <div>
                        <h3
                          className={`font-semibold ${
                            task.completed
                              ? "line-through text-slate-500"
                              : ""
                          }`}
                        >
                          {task.text}
                        </h3>

                        <p className="text-sm text-slate-400 mt-1">
                          {task.subject} •{" "}
                          {task.date} •{" "}
                          {task.hours}h
                        </p>

                        {task.activity && (
                          <p className="text-xs text-slate-500 mt-1">
                            {task.activity}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          toggleTask(task.id)
                        }
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition"
                      >
                        {task.completed
                          ? "Undo"
                          : "Complete"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteTask(task.id)
                        }
                        className="px-4 py-2 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 hover:bg-rose-950/60 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ==================================================
              FINAL EMPTY STATE
          ================================================== */}

          {!planCreated &&
            !loadingAI && (
              <div className="text-center text-slate-500 py-10">
                <div className="text-5xl mb-4">
                  📚
                </div>

                <h3 className="text-xl font-semibold text-slate-300">
                  Your study journey starts here
                </h3>

                <p className="mt-2">
                  Select your exam, set your target date,
                  choose your study hours and create your plan.
                </p>
              </div>
            )}
        </div>
      </main>
    </div>
  );
}
