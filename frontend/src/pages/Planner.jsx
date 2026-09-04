import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import MathText from "../components/MathText";

const API_URL = "https://examace-ai-cp3e.onrender.com";

const MODES = [
  { id: "ai", icon: "🧠", title: "AI Planner", description: "Let AI create an optimized study plan for you." },
  { id: "normal", icon: "📅", title: "Normal Planner", description: "Create and manage your own study schedule." },
  { id: "both", icon: "⚡", title: "AI + Normal", description: "Let AI create it, then edit and manage everything." },
];

const DEFAULT_SUBJECTS = [
  { name: "Physics", level: "Average" },
  { name: "Chemistry", level: "Average" },
  { name: "Mathematics", level: "Average" },
];

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function attachSavedTaskIds(plan, savedTasks) {
  if (!plan?.daily_plan || !Array.isArray(savedTasks)) return plan;

  const unused = [...savedTasks];

  return {
    ...plan,
    daily_plan: plan.daily_plan.map((day) => ({
      ...day,
      tasks: Array.isArray(day.tasks)
        ? day.tasks.map((task) => {
            const index = unused.findIndex(
              (saved) =>
                String(saved.date || "") === String(day.date || "") &&
                String(saved.subject || "") === String(task.subject || "") &&
                String(saved.topic || "") === String(task.topic || "")
            );

            if (index === -1) return task;

            const saved = unused.splice(index, 1)[0];
            return {
              ...task,
              id: saved.id,
              completed: Boolean(saved.completed),
            };
          })
        : [],
    })),
  };
}

export default function Planner() {
  const todayISO = new Date().toISOString().split("T")[0];
  const todayString = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const [mode, setMode] = useState("both");
  const [exam, setExam] = useState("");
  const [examDate, setExamDate] = useState("");
  const [hours, setHours] = useState("");
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);

  const [aiPlan, setAiPlan] = useState(null);
  const [planId, setPlanId] = useState(null);
  const [planCreated, setPlanCreated] = useState(false);
  const [tasks, setTasks] = useState([]);

  const [loadingPlan, setLoadingPlan] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [taskText, setTaskText] = useState("");
  const [taskSubject, setTaskSubject] = useState("Physics");
  const [taskDate, setTaskDate] = useState("");
  const [taskHours, setTaskHours] = useState("");

  const daysRemaining = useMemo(() => {
    if (!examDate) return null;
    const examDay = new Date(`${examDate}T00:00:00`);
    const currentDay = new Date(`${todayISO}T00:00:00`);
    return Math.ceil((examDay - currentDay) / 86400000);
  }, [examDate, todayISO]);

  const loadSavedPlan = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoadingPlan(false);
      return;
    }

    try {
      setLoadingPlan(true);
      const response = await fetch(`${API_URL}/my-plan`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Could not load your saved study plan.");

      const data = await response.json();

      if (!data.plan) {
        setAiPlan(null);
        setTasks([]);
        setPlanId(null);
        setPlanCreated(false);
        return;
      }

      const savedTasks = Array.isArray(data.tasks) ? data.tasks : [];
      const restoredPlan = attachSavedTaskIds(data.plan, savedTasks);

      setPlanId(data.plan_id || null);
      setExam(data.exam || "");
      setExamDate(data.exam_date || "");
      setHours(data.hours_per_day != null ? String(data.hours_per_day) : "");
      setMode(data.mode || "both");
      setAiPlan(restoredPlan);
      setTasks(savedTasks.map((task) => ({
        id: task.id,
        text: task.topic || "",
        subject: task.subject || "",
        date: task.date || "",
        hours: Number(task.hours || 0),
        activity: task.activity || "",
        completed: Boolean(task.completed),
        aiGenerated: true,
      })));
      setPlanCreated(true);
    } catch (err) {
      console.error("Load planner error:", err);
      setError(err.message || "Could not load your study plan.");
    } finally {
      setLoadingPlan(false);
    }
  };

  useEffect(() => {
    loadSavedPlan();
  }, []);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  const validate = () => {
    if (!exam || !examDate || !hours) {
      setError("Please fill exam, exam date and daily study hours.");
      return false;
    }
    if (daysRemaining === null || daysRemaining <= 0) {
      setError("Please select a future exam date.");
      return false;
    }
    const value = Number(hours);
    if (!Number.isFinite(value) || value <= 0 || value > 16) {
      setError("Study hours must be between 0.5 and 16 per day.");
      return false;
    }
    return true;
  };

  const updateSubjectLevel = (index, level) => {
    setSubjects((prev) => prev.map((item, i) => i === index ? { ...item, level } : item));
  };

  const saveAIPlan = async (plan) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Please login first.");

    setSavingPlan(true);

    try {
      const saveResponse = await fetch(`${API_URL}/save-plan`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ plan_data: plan }),
      });

      if (!saveResponse.ok) {
        const text = await saveResponse.text();
        throw new Error(`Failed to save study plan: ${text}`);
      }

      const saved = await saveResponse.json();
      setPlanId(saved.plan_id || null);

      // The original backend stores the plan JSON but does not automatically
      // create StudyTask rows. Create those rows here so every AI task gets a
      // persistent ID and can be checked off after reload.
      const createdTasks = [];

      for (const day of plan.daily_plan || []) {
        for (const task of day.tasks || []) {
          const taskResponse = await fetch(`${API_URL}/study-task`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
              day: Number(day.day || 0),
              date: day.date || "",
              subject: task.subject || "",
              topic: task.topic || "",
              activity: task.activity || "",
              hours: Number(task.hours || 0),
            }),
          });

          if (!taskResponse.ok) {
            const text = await taskResponse.text();
            throw new Error(`Plan saved, but a task could not be saved: ${text}`);
          }

          const taskData = await taskResponse.json();
          if (taskData.task) createdTasks.push(taskData.task);
          else if (taskData.task_id) createdTasks.push({ ...task, id: taskData.task_id, day: day.day, date: day.date });
        }
      }

      const planWithIds = attachSavedTaskIds(plan, createdTasks);
      setAiPlan(planWithIds);
      setTasks(createdTasks.map((task) => ({
        id: task.id,
        text: task.topic || "",
        subject: task.subject || "",
        date: task.date || "",
        hours: Number(task.hours || 0),
        activity: task.activity || "",
        completed: Boolean(task.completed),
        aiGenerated: true,
      })));

      setSuccess("Study plan saved successfully!");
    } finally {
      setSavingPlan(false);
    }
  };

  const generateAIPlan = async () => {
    if (!validate()) return;

    try {
      setLoadingAI(true);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/generate-plan`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          exam,
          today: todayISO,
          exam_date: examDate,
          days_remaining: daysRemaining,
          hours_per_day: Number(hours),
          subjects,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        let detail = text;
        try {
          detail = JSON.parse(text).detail || text;
        } catch {}
        throw new Error(detail || "Failed to generate study plan.");
      }

      const data = await response.json();
      const parsed = typeof data.content === "string" ? JSON.parse(data.content) : data.content;

      if (!parsed || typeof parsed !== "object") {
        throw new Error("AI returned an invalid study plan.");
      }

      if (!Array.isArray(parsed.daily_plan)) parsed.daily_plan = [];

      setAiPlan(parsed);
      setPlanCreated(true);
      await saveAIPlan(parsed);
    } catch (err) {
      console.error("AI Planner Error:", err);
      setError(err.message || "Failed to generate study plan.");
    } finally {
      setLoadingAI(false);
    }
  };

  const createPlanner = async () => {
    if (!validate()) return;
    setPlanCreated(true);

    if (mode === "normal") {
      setError("");
      setSuccess("Your planner is ready. Add your study tasks below.");
      return;
    }

    await generateAIPlan();
  };

  const toggleTask = async (id) => {
    if (!id) return;
    try {
      const response = await fetch(`${API_URL}/study-task/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error("Could not update task.");
      const data = await response.json();
      const completed = Boolean(data.completed);

      setTasks((prev) => prev.map((task) => task.id === id ? { ...task, completed } : task));
      setAiPlan((prev) => prev ? {
        ...prev,
        daily_plan: (prev.daily_plan || []).map((day) => ({
          ...day,
          tasks: (day.tasks || []).map((task) => task.id === id ? { ...task, completed } : task),
        })),
      } : prev);
    } catch (err) {
      setError(err.message || "Could not update task.");
    }
  };

  const deleteTask = async (id) => {
    if (!id || !window.confirm("Delete this study task?")) return;

    try {
      const response = await fetch(`${API_URL}/study-task/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error("Could not delete task.");

      setTasks((prev) => prev.filter((task) => task.id !== id));
      setAiPlan((prev) => prev ? {
        ...prev,
        daily_plan: (prev.daily_plan || []).map((day) => ({
          ...day,
          tasks: (day.tasks || []).filter((task) => task.id !== id),
        })),
      } : prev);
      setSuccess("Task deleted.");
    } catch (err) {
      setError(err.message || "Could not delete task.");
    }
  };

  const addTask = async () => {
    if (!taskText.trim() || !taskDate || !taskHours) {
      setError("Please fill task, date and hours.");
      return;
    }

    const numericHours = Number(taskHours);
    if (!Number.isFinite(numericHours) || numericHours <= 0 || numericHours > 24) {
      setError("Task hours must be between 0.5 and 24.");
      return;
    }

    try {
      setAddingTask(true);
      setError("");

      const response = await fetch(`${API_URL}/study-task`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          day: daysRemaining ? Math.max(1, 1 + Math.round((new Date(`${taskDate}T00:00:00`) - new Date(`${todayISO}T00:00:00`)) / 86400000)) : 1,
          date: taskDate,
          subject: taskSubject,
          topic: taskText.trim(),
          activity: "Manual study task",
          hours: numericHours,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Could not add task.");
      }

      const data = await response.json();
      const saved = data.task || {
        id: data.task_id,
        topic: taskText.trim(),
        subject: taskSubject,
        date: taskDate,
        hours: numericHours,
        activity: "Manual study task",
        completed: false,
      };

      setTasks((prev) => [...prev, {
        id: saved.id,
        text: saved.topic || "",
        subject: saved.subject || "",
        date: saved.date || "",
        hours: Number(saved.hours || 0),
        activity: saved.activity || "",
        completed: Boolean(saved.completed),
        aiGenerated: false,
      }]);

      setTaskText("");
      setTaskDate("");
      setTaskHours("");
      setSuccess("Task added successfully!");
    } catch (err) {
      setError(err.message || "Could not add task.");
    } finally {
      setAddingTask(false);
    }
  };

  const deletePlan = async () => {
    if (!window.confirm("Delete your entire study plan? This cannot be undone.")) return;

    try {
      setDeletingPlan(true);
      const response = await fetch(`${API_URL}/my-plan`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error("Could not delete planner.");

      setAiPlan(null);
      setTasks([]);
      setPlanId(null);
      setPlanCreated(false);
      setExam("");
      setExamDate("");
      setHours("");
      setSuccess("Study plan deleted.");
    } catch (err) {
      setError(err.message || "Could not delete planner.");
    } finally {
      setDeletingPlan(false);
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (loadingPlan) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-white flex">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4 animate-pulse">📅</div>
            <h2 className="text-xl font-bold">Loading your planner...</h2>
            <p className="text-slate-400 mt-2">Checking your saved study plan.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col md:flex-row">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>Study planner</h1>
              <p className="text-slate-400 mt-2">Plan your preparation your way.</p>
            </div>
            {planId && <span className="w-fit text-xs px-3 py-2 rounded-full bg-emerald-950/40 border border-emerald-800 text-emerald-400">● Plan saved</span>}
          </div>

          {success && <div className="mb-6 bg-emerald-950/40 border border-emerald-800 text-emerald-300 p-4 rounded-xl">{success}</div>}
          {error && <div className="mb-6 bg-rose-950/40 border border-rose-800 text-rose-300 p-4 rounded-xl"><b>Planner error:</b> {error}</div>}

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">How do you want to plan?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MODES.map((item) => (
                <button key={item.id} type="button" onClick={() => setMode(item.id)} className={`text-left p-5 rounded-2xl border transition ${mode === item.id ? "border-indigo-600 bg-indigo-600/10" : "border-slate-800 bg-[#151922] hover:border-slate-700"}`}>
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-sm text-slate-400 mt-2">{item.description}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-[#151922] border border-slate-800 rounded-2xl p-6 md:p-8 mb-8">
            <h2 className="text-xl font-bold mb-6">Study information</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="bg-[#0B0E14] border border-slate-800 p-4 rounded-xl">
                <p className="text-sm text-slate-400">Today</p>
                <p className="font-semibold mt-1">{todayString}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Target exam</label>
                <select value={exam} onChange={(e) => setExam(e.target.value)} className="w-full p-3 rounded-xl bg-[#0B0E14] border border-slate-800 outline-none">
                  <option value="">Select exam</option>
                  <option>MHT-CET</option><option>JEE</option><option>NEET</option><option>CBSE Board</option><option>Maharashtra Board</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Exam date</label>
                <input type="date" min={todayISO} value={examDate} onChange={(e) => setExamDate(e.target.value)} className="w-full p-3 rounded-xl bg-[#0B0E14] border border-slate-800 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Study hours / day</label>
                <input type="number" min="0.5" max="16" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="e.g. 5" className="w-full p-3 rounded-xl bg-[#0B0E14] border border-slate-800 outline-none" />
              </div>
            </div>
            {daysRemaining !== null && <div className="mt-5 bg-indigo-600/10 border border-indigo-600/30 p-4 rounded-xl"><p className="text-sm text-slate-400">Preparation time</p><p className="text-2xl font-bold text-indigo-400 mt-1">{daysRemaining > 0 ? `${daysRemaining} days remaining` : "Exam date has passed"}</p></div>}
          </section>

          <section className="bg-[#151922] border border-slate-800 rounded-2xl p-6 md:p-8 mb-8">
            <h2 className="text-xl font-bold mb-2">Subject strength</h2>
            <p className="text-slate-400 text-sm mb-6">Tell AI how confident you are in each subject.</p>
            <div className="space-y-4">
              {subjects.map((subject, index) => (
                <div key={subject.name} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0B0E14] border border-slate-800 p-4 rounded-xl">
                  <span className="font-semibold">{subject.name}</span>
                  <div className="flex gap-2">{["Weak", "Average", "Strong"].map((level) => <button key={level} type="button" onClick={() => updateSubjectLevel(index, level)} className={`px-4 py-2 rounded-lg text-sm ${subject.level === level ? "bg-indigo-600" : "bg-slate-800 hover:bg-slate-700"}`}>{level}</button>)}</div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap gap-3 mb-8">
            <button type="button" onClick={createPlanner} disabled={loadingAI || savingPlan || deletingPlan} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 px-8 py-3 rounded-xl font-semibold">
              {loadingAI ? "AI is creating your plan..." : savingPlan ? "Saving plan..." : mode === "normal" ? "Create my planner" : mode === "ai" ? "Generate with AI" : "Generate AI + editable plan"}
            </button>
            {planId && <button type="button" onClick={deletePlan} disabled={deletingPlan || loadingAI || savingPlan} className="bg-rose-950/40 border border-rose-800 text-rose-300 px-6 py-3 rounded-xl font-semibold">{deletingPlan ? "Deleting..." : "Delete plan"}</button>}
          </div>

          {(mode === "ai" || mode === "both") && (
            <section className="bg-[#151922] border border-slate-800 rounded-2xl p-6 md:p-8 mb-8">
              <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>AI study plan</h2>
              <p className="text-slate-400 text-sm mb-6">Personalized for your preparation</p>

              {aiPlan ? (
                <div className="space-y-6">
                  {aiPlan.overview && <div className="bg-[#0B0E14] border border-slate-800 rounded-xl p-5"><h3 className="text-lg font-bold mb-2">Strategy</h3><MathText text={aiPlan.overview} /></div>}

                  {totalTasks > 0 && <div className="bg-[#0B0E14] border border-slate-800 rounded-xl p-5"><div className="flex justify-between mb-3"><span className="font-semibold">Plan progress</span><span className="text-indigo-400 font-bold">{progress}%</span></div><div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} /></div><p className="text-sm text-slate-400 mt-2">{completedTasks} of {totalTasks} tasks completed</p></div>}

                  {Array.isArray(aiPlan.phases) && aiPlan.phases.length > 0 && <div><h3 className="text-xl font-bold mb-4">Preparation phases</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{aiPlan.phases.map((phase, index) => <div key={index} className="bg-[#0B0E14] border border-slate-800 p-5 rounded-xl"><h4 className="font-bold text-lg"><MathText text={phase.name} /></h4><p className="text-sm text-slate-400 mt-1">Day {phase.start_day} → Day {phase.end_day}</p><div className="text-slate-300 mt-3"><MathText text={phase.goal} /></div></div>)}</div></div>}

                  {Array.isArray(aiPlan.daily_plan) && aiPlan.daily_plan.length > 0 && <div><h3 className="text-xl font-bold mb-4">Daily plan</h3><div className="space-y-4">{aiPlan.daily_plan.map((day, dayIndex) => <div key={day.day ?? day.date ?? dayIndex} className="bg-[#0B0E14] border border-slate-800 rounded-xl p-5"><div className="mb-4"><h4 className="text-lg font-bold">Day {day.day}</h4><p className="text-sm text-slate-400">{day.date}</p></div><div className="space-y-3">{(day.tasks || []).map((task, taskIndex) => { const taskKey = task.id || `${day.day}-${taskIndex}`; const completed = Boolean(task.completed); return <div key={taskKey} className={`flex items-start gap-4 p-4 rounded-xl ${completed ? "bg-emerald-950/30 border border-emerald-800" : "bg-[#151922] border border-slate-800"}`}><input type="checkbox" checked={completed} onChange={() => toggleTask(task.id)} disabled={!task.id} className="mt-1 w-5 h-5 cursor-pointer accent-indigo-600" /><div className="flex-1"><div className="flex flex-wrap justify-between gap-2"><div className={`font-semibold ${completed ? "line-through text-slate-500" : ""}`}><MathText text={`${task.subject || ""} — ${task.topic || ""}`} /></div><span className="text-indigo-400 text-sm">{task.hours}h</span></div>{task.activity && <div className="text-sm text-slate-400 mt-1"><MathText text={task.activity} /></div>}</div></div>; })}</div></div>)}</div></div>}
                </div>
              ) : <div className="text-slate-500 text-center py-8">Fill in your study information and generate your plan.</div>}
            </section>
          )}

          {(mode === "normal" || mode === "both") && planCreated && (
            <section className="bg-[#151922] border border-slate-800 rounded-2xl p-6 md:p-8 mb-8">
              <h2 className="text-xl font-bold mb-6">Add study task</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input value={taskText} onChange={(e) => setTaskText(e.target.value)} placeholder="Topic / task" className="p-3 rounded-xl bg-[#0B0E14] border border-slate-800 outline-none" />
                <select value={taskSubject} onChange={(e) => setTaskSubject(e.target.value)} className="p-3 rounded-xl bg-[#0B0E14] border border-slate-800 outline-none">{subjects.map((subject) => <option key={subject.name}>{subject.name}</option>)}</select>
                <input type="date" value={taskDate} min={todayISO} onChange={(e) => setTaskDate(e.target.value)} className="p-3 rounded-xl bg-[#0B0E14] border border-slate-800 outline-none" />
                <input type="number" min="0.5" max="24" step="0.5" value={taskHours} onChange={(e) => setTaskHours(e.target.value)} placeholder="Hours" className="p-3 rounded-xl bg-[#0B0E14] border border-slate-800 outline-none" />
              </div>
              <button type="button" onClick={addTask} disabled={addingTask} className="mt-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 px-6 py-3 rounded-xl font-semibold">{addingTask ? "Adding..." : "Add task"}</button>
            </section>
          )}

          {tasks.length > 0 && (
            <section className="bg-[#151922] border border-slate-800 rounded-2xl p-6 md:p-8 mb-8">
              <div className="flex justify-between items-center mb-3"><h2 className="text-xl font-bold">Your tasks</h2><span className="text-indigo-400 font-bold">{progress}%</span></div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-6"><div className="h-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} /></div>
              <div className="space-y-3">
                {tasks.map((task) => <div key={task.id} className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border ${task.completed ? "bg-emerald-950/30 border-emerald-800" : "bg-[#0B0E14] border-slate-800"}`}><div className="flex items-start gap-3"><input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} className="mt-1 w-5 h-5 cursor-pointer accent-indigo-600" /><div><div className={`font-semibold ${task.completed ? "line-through text-slate-500" : ""}`}><MathText text={task.text} /></div><p className="text-sm text-slate-400 mt-1">{task.subject} • {task.date} • {task.hours}h</p>{task.activity && <p className="text-xs text-slate-500 mt-1">{task.activity}</p>}</div></div><div className="flex gap-2"><button type="button" onClick={() => toggleTask(task.id)} className="px-4 py-2 rounded-lg bg-indigo-600">{task.completed ? "Undo" : "Complete"}</button><button type="button" onClick={() => deleteTask(task.id)} className="px-4 py-2 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300">Delete</button></div></div>)}
              </div>
            </section>
          )}

          {!planCreated && <div className="text-center text-slate-500 py-10"><div className="text-5xl mb-4">📚</div><h3 className="text-xl font-semibold text-slate-300">Your study journey starts here</h3><p className="mt-2">Select your exam, set your target date, choose your study hours and create your plan.</p></div>}
        </div>
      </main>
    </div>
  );
}
