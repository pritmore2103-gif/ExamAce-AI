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
