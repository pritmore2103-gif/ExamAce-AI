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
