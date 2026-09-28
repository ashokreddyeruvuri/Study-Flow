// ============================================================
// Deskwork — Student Productivity Dashboard
// Vanilla JS. Data persists in localStorage — no backend.
// ============================================================

const STORAGE_KEY = "deskwork.v1";

/** @typedef {{ id:string, name:string, priority:'High'|'Medium'|'Low', completed:boolean, createdAt:number }} Task */
/** @typedef {{ id:string, name:string, target:number, progress:number }} Goal */

const DEFAULT_STATE = {
  tasks: [],
  goals: [],
  theme: "light",
  streak: { count: 0, lastDate: null }, // lastDate = 'YYYY-MM-DD' of last day a task was completed
  completionLog: {}, // 'YYYY-MM-DD' -> number of tasks completed that day
};

let state = loadState();
let activeFilter = "all";
let searchTerm = "";

// ---------------- Persistence ----------------

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(DEFAULT_STATE), ...parsed };
  } catch (err) {
    console.error("Could not read saved data, starting fresh.", err);
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Could not save data.", err);
  }
}

// ---------------- Utilities ----------------

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function dayLabel(date) {
  return date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2);
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------------- DOM refs ----------------

const els = {
  todayDate: document.getElementById("today-date"),
  greeting: document.getElementById("greeting"),
  streakCount: document.getElementById("streak-count"),

  statTotal: document.getElementById("stat-total"),
  statCompleted: document.getElementById("stat-completed"),
  statPending: document.getElementById("stat-pending"),
  statPercent: document.getElementById("stat-percent"),

  taskForm: document.getElementById("task-form"),
  taskInput: document.getElementById("task-input"),
  taskPriority: document.getElementById("task-priority"),
  taskSearch: document.getElementById("task-search"),
  taskList: document.getElementById("task-list"),
  taskEmpty: document.getElementById("task-empty"),
  filterBtns: document.querySelectorAll(".filter-btn"),
  taskItemTemplate: document.getElementById("task-item-template"),

  goalForm: document.getElementById("goal-form"),
  goalInput: document.getElementById("goal-input"),
  goalTarget: document.getElementById("goal-target"),
  goalList: document.getElementById("goal-list"),
  goalEmpty: document.getElementById("goal-empty"),
  goalItemTemplate: document.getElementById("goal-item-template"),

  weekChart: document.getElementById("week-chart"),

  themeToggle: document.getElementById("theme-toggle"),
  themeLabel: document.querySelector(".theme-toggle-label"),

  sideLinks: document.querySelectorAll(".side-link"),
};

// ---------------- Rendering: header ----------------

function renderHeader() {
  const now = new Date();
  els.todayDate.textContent = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const hour = now.getHours();
  const timeGreeting =
    hour < 12 ? "Good morning." : hour < 17 ? "Good afternoon." : "Good evening.";
  els.greeting.textContent = timeGreeting;

  els.streakCount.textContent = state.streak.count;
}

// ---------------- Rendering: stats ----------------

function renderStats() {
  const total = state.tasks.length;
  const completed = state.tasks.filter((t) => t.completed).length;
  const pending = total - completed;

  els.statTotal.textContent = total;
  els.statCompleted.textContent = completed;
  els.statPending.textContent = pending;

  // Weekly completion %: completions logged in the last 7 days vs
  // tasks created in the last 7 days (falls back to overall rate).
  const weekDates = lastNDays(7);
  const weekCompletions = weekDates.reduce(
    (sum, d) => sum + (state.completionLog[d] || 0),
    0
  );
  const weekCreated = state.tasks.filter((t) => {
    const created = todayKey(new Date(t.createdAt));
    return weekDates.includes(created);
  }).length;
  const denominator = Math.max(weekCreated, weekCompletions, 1);
  const percent = weekCreated === 0 && weekCompletions === 0
    ? 0
    : Math.round((weekCompletions / denominator) * 100);
  els.statPercent.textContent = `${percent}%`;
}

function lastNDays(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(todayKey(d));
  }
  return out;
}

// ---------------- Rendering: week chart ----------------

function renderWeekChart() {
  const days = lastNDays(7);
  const counts = days.map((key) => state.completionLog[key] || 0);
  const max = Math.max(...counts, 3); // keep bars readable when counts are small

  els.weekChart.innerHTML = "";
  days.forEach((key, i) => {
    const date = new Date(key + "T00:00:00");
    const col = document.createElement("div");
    col.className = "week-bar-col";
    if (key === todayKey()) col.classList.add("is-today");

    const bar = document.createElement("div");
    bar.className = "week-bar";
    const heightPct = Math.max((counts[i] / max) * 100, counts[i] > 0 ? 8 : 3);
    bar.style.height = `${heightPct}%`;
    bar.title = `${counts[i]} completed`;

    const label = document.createElement("span");
    label.className = "week-bar-label";
    label.textContent = dayLabel(date);

    col.append(bar, label);
    els.weekChart.appendChild(col);
  });
}

// ---------------- Tasks ----------------

function getFilteredTasks() {
  return state.tasks
    .filter((t) => {
      if (activeFilter === "active") return !t.completed;
      if (activeFilter === "completed") return t.completed;
      return true;
    })
    .filter((t) => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.createdAt - a.createdAt);
}

function renderTasks() {
  const tasks = getFilteredTasks();
  els.taskList.innerHTML = "";
  els.taskEmpty.hidden = tasks.length !== 0;

  tasks.forEach((task) => {
    const node = els.taskItemTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.id = task.id;
    if (task.completed) node.classList.add("is-completed");

    node.querySelector(".task-name").textContent = task.name;

    const priorityEl = node.querySelector(".task-priority");
    priorityEl.textContent = task.priority;
    priorityEl.dataset.level = task.priority;

    node.querySelector(".task-check").addEventListener("click", () => toggleTask(task.id));
    node.querySelector(".task-delete").addEventListener("click", () => deleteTask(task.id));

    els.taskList.appendChild(node);
  });
}

function addTask(name, priority) {
  const trimmed = name.trim();
  if (!trimmed) return;

  state.tasks.push({
    id: uid(),
    name: trimmed,
    priority,
    completed: false,
    createdAt: Date.now(),
  });

  saveState();
  renderAll();
}

function toggleTask(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;

  task.completed = !task.completed;

  const key = todayKey();
  if (task.completed) {
    state.completionLog[key] = (state.completionLog[key] || 0) + 1;
    registerStreak(key);
  } else {
    state.completionLog[key] = Math.max((state.completionLog[key] || 1) - 1, 0);
  }

  saveState();
  renderAll();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter((t) => t.id !== id);
  saveState();
  renderAll();
}

// ---------------- Streak ----------------

function registerStreak(completionDateKey) {
  const { lastDate, count } = state.streak;

  if (lastDate === completionDateKey) return; // already counted today

  if (lastDate) {
    const yesterday = todayKey(new Date(Date.now() - 86400000));
    if (lastDate === yesterday) {
      state.streak.count = count + 1;
    } else {
      state.streak.count = 1; // streak broken — restart
    }
  } else {
    state.streak.count = 1;
  }

  state.streak.lastDate = completionDateKey;
}

// ---------------- Goals ----------------

function renderGoals() {
  els.goalList.innerHTML = "";
  els.goalEmpty.hidden = state.goals.length !== 0;

  state.goals.forEach((goal) => {
    const node = els.goalItemTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.id = goal.id;

    const pct = Math.min(100, Math.round((goal.progress / goal.target) * 100));
    const isComplete = goal.progress >= goal.target;
    if (isComplete) node.classList.add("is-complete");

    node.querySelector(".goal-name").textContent = goal.name;
    node.querySelector(".goal-progress-fill").style.width = `${pct}%`;
    node.querySelector(".goal-count").textContent = `${goal.progress} / ${goal.target}${
      isComplete ? " — done" : ""
    }`;

    node.querySelector(".goal-delete").addEventListener("click", () => deleteGoal(goal.id));
    node.querySelector(".goal-step-plus").addEventListener("click", () => stepGoal(goal.id, 1));
    node.querySelector(".goal-step-minus").addEventListener("click", () => stepGoal(goal.id, -1));

    els.goalList.appendChild(node);
  });
}

function addGoal(name, target) {
  const trimmed = name.trim();
  const targetNum = Math.max(1, parseInt(target, 10) || 1);
  if (!trimmed) return;

  state.goals.push({ id: uid(), name: trimmed, target: targetNum, progress: 0 });
  saveState();
  renderGoals();
}

function stepGoal(id, delta) {
  const goal = state.goals.find((g) => g.id === id);
  if (!goal) return;
  goal.progress = Math.max(0, Math.min(goal.target, goal.progress + delta));
  saveState();
  renderGoals();
}

function deleteGoal(id) {
  state.goals = state.goals.filter((g) => g.id !== id);
  saveState();
  renderGoals();
}

// ---------------- Theme ----------------

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  els.themeToggle.setAttribute("aria-pressed", theme === "dark");
  els.themeLabel.textContent = theme === "dark" ? "Lamp on" : "Lamp off";
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  applyTheme(state.theme);
  saveState();
}

// ---------------- Section nav (sidebar) ----------------

function goToSection(name) {
  els.sideLinks.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.section === name));

  if (name === "overview") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const target = document.getElementById(name);
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------------- Wire up events ----------------

els.taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addTask(els.taskInput.value, els.taskPriority.value);
  els.taskInput.value = "";
  els.taskInput.focus();
});

els.taskSearch.addEventListener("input", (e) => {
  searchTerm = e.target.value;
  renderTasks();
});

els.filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    activeFilter = btn.dataset.filter;
    els.filterBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
    renderTasks();
  });
});

els.goalForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addGoal(els.goalInput.value, els.goalTarget.value);
  els.goalInput.value = "";
  els.goalTarget.value = "10";
  els.goalInput.focus();
});

els.themeToggle.addEventListener("click", toggleTheme);

els.sideLinks.forEach((btn) => {
  btn.addEventListener("click", () => goToSection(btn.dataset.section));
});

// ---------------- Init ----------------

function renderAll() {
  renderHeader();
  renderStats();
  renderWeekChart();
  renderTasks();
  renderGoals();
}

function seedIfEmpty() {
  // Give a first-time visitor a non-empty dashboard to understand the app.
  if (state.tasks.length > 0 || state.goals.length > 0) return;

  state.tasks.push(
    { id: uid(), name: "Review DBMS lecture notes", priority: "Medium", completed: false, createdAt: Date.now() - 3000 },
    { id: uid(), name: "Solve 3 array problems", priority: "High", completed: false, createdAt: Date.now() - 2000 },
    { id: uid(), name: "Submit lab report", priority: "Low", completed: true, createdAt: Date.now() - 1000 }
  );
  state.goals.push(
    { id: uid(), name: "Solve 50 coding problems", target: 50, progress: 12 },
    { id: uid(), name: "Finish JavaScript course", target: 20, progress: 20 }
  );
  saveState();
}

seedIfEmpty();
applyTheme(state.theme);
renderAll();