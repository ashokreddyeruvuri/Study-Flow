# Student Productivity Dashboard (Deskwork)

A responsive, interactive frontend web application that helps students organize daily tasks, set long-term goals, and monitor their productivity. It is built with plain **HTML, CSS, and JavaScript**, with no frameworks, no backend, and no database. All data is stored in the browser using **LocalStorage**.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Technologies Used](#technologies-used)
4. [Project Structure](#project-structure)
5. [How to Run](#how-to-run)
6. [How It Works](#how-it-works)
   - [HTML (structure)](#html-structure)
   - [CSS (design and layout)](#css-design-and-layout)
   - [JavaScript (logic)](#javascript-logic)
7. [Data Model (LocalStorage)](#data-model-localstorage)
8. [Key Logic Explained](#key-logic-explained)
9. [Responsive Design](#responsive-design)
10. [Frontend Concepts Demonstrated](#frontend-concepts-demonstrated)
11. [Customization](#customization)
12. [Known Limitations](#known-limitations)
13. [Future Enhancements](#future-enhancements)

---

## Overview

Students juggle many activities at once: studying programming languages, practicing coding problems, preparing for exams, finishing assignments, and learning new skills. Tracking these by hand makes it hard to see what is done and what still needs attention.

This dashboard puts everything in one place. Students can add tasks with priorities, search and filter them, track weekly completion, maintain a study streak, and break big objectives into measurable goals.

---

## Features

| Feature | Description |
|---|---|
| **Dashboard stats** | Shows total tasks, completed tasks, pending tasks, and this week's completion percentage. Updates instantly. |
| **Study streak** | Counts consecutive days on which at least one task was completed. |
| **Task management** | Add tasks with a priority (High, Medium, Low), mark them complete, and delete them. Completed tasks are struck through and visually distinct. |
| **Search** | Type in the search box to find tasks by name as you type. |
| **Filtering** | Switch between **All**, **Active**, and **Completed** tasks. Search and filter work together. |
| **Weekly progress chart** | A 7-day bar chart of tasks completed per day, with today highlighted. |
| **Goal management** | Create goals with a numeric target (for example "Solve 50 coding problems"), then nudge progress up or down with `+` and `-`. |
| **Dark / light mode** | A toggle in the sidebar switches themes, and the choice is remembered. |
| **Data persistence** | Tasks, goals, streak, history, and theme survive page refreshes via LocalStorage. |
| **Responsive layout** | Works on desktops, laptops, tablets, and phones. |
| **Sample data** | On the very first visit, a few example tasks and goals are added so the dashboard isn't empty. Delete them freely. |

---

## Technologies Used

- **HTML5**: semantic page structure, forms, and `<template>` elements
- **CSS3**: custom properties (variables), Flexbox, Grid, media queries, transitions
- **JavaScript (ES6+)**: DOM manipulation, event listeners, arrays, objects, and LocalStorage
- **Google Fonts**: [Fraunces](https://fonts.google.com/specimen/Fraunces) (headings and numbers) and [Inter](https://fonts.google.com/specimen/Inter) (interface text)

No build tools or dependencies are required.

---

## Project Structure

```
student-productivity-dashboard/
├── index.html    # Page structure and templates
├── style.css     # Visual design, layout, themes, responsiveness
├── script.js     # All application logic and LocalStorage handling
└── README.md     # Project documentation (this file)
```

---

## How to Run

1. Download or copy `index.html`, `style.css`, and `script.js` into the **same folder**.
2. Double-click `index.html` to open it in any modern browser (Chrome, Edge, Firefox, Safari).
3. That's it. There is nothing to install.

> **Note:** The Google Fonts need an internet connection. Without one, the app still works and falls back to Georgia and system fonts.

Optionally, serve it locally with VS Code's **Live Server** extension or with Python:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

---

## How It Works

### HTML (structure)

`index.html` defines the skeleton of the page:

| Element | Purpose |
|---|---|
| `div.app` | Root container. A two-column CSS grid: sidebar and main area. |
| `aside.sidebar` | Holds the brand name, the navigation buttons (Overview, Tasks, Goals), and the theme toggle. |
| `main.main` | Contains all dashboard content. |
| `header.topbar` | Shows today's date, a time-based greeting, and the streak badge. |
| `section.stats-row` | Four stat cards (total, completed, pending, weekly completion %). |
| `section#tasks` | The task form, search box, filter buttons, and task list. |
| `section.panel--progress` | The container for the weekly bar chart. |
| `section#goals` | The goal form and goal list. |
| `<template>` tags | Reusable blueprints for one task row and one goal row. They are not displayed directly. JavaScript clones them for each item. |

Elements that JavaScript needs to update have an `id` (for example `stat-total`, `task-list`, `week-chart`). Buttons that carry information use `data-*` attributes (`data-filter="active"`, `data-section="goals"`).

### CSS (design and layout)

`style.css` is organised from top to bottom as:

1. **Design tokens**: CSS variables for colours, fonts, radii, and shadows, defined in `:root`.
2. **Dark theme**: `html[data-theme="dark"]` redefines the same variables, so switching themes only changes one attribute on `<html>`.
3. **Layout**: CSS Grid for the app shell (sidebar and main), the stats row, and the two-column content area.
4. **Components**: stat cards, panels, forms, buttons, filter pills, task rows, priority badges, chart bars, goal progress bars.
5. **Responsive rules**: media queries at 980px, 760px, and 480px.
6. **Accessibility**: visible `:focus-visible` outlines and a `prefers-reduced-motion` rule that disables animation for users who request it.

### JavaScript (logic)

`script.js` is divided into clearly labelled sections:

| Section | What it does |
|---|---|
| **Persistence** | `loadState()` reads from LocalStorage (with error handling), `saveState()` writes back. |
| **Utilities** | `uid()` generates task/goal IDs, `todayKey()` produces `YYYY-MM-DD` date strings, `lastNDays()` builds the 7-day window. |
| **DOM refs** | The `els` object caches every element the script needs, so lookups happen once. |
| **Rendering** | `renderHeader()`, `renderStats()`, `renderWeekChart()`, `renderTasks()`, `renderGoals()` rebuild the relevant part of the page from the current state. |
| **Tasks** | `addTask()`, `toggleTask()`, `deleteTask()`, and `getFilteredTasks()` (applies filter and search, newest first). |
| **Streak** | `registerStreak()` updates the streak count when a task is completed. |
| **Goals** | `addGoal()`, `stepGoal()`, `deleteGoal()`. |
| **Theme** | `applyTheme()` and `toggleTheme()`. |
| **Navigation** | `goToSection()` smooth-scrolls to a section and highlights the sidebar link. |
| **Init** | `seedIfEmpty()`, then `applyTheme()` and `renderAll()` on page load. |

The app follows a simple pattern: **change state, save it, re-render**. Every user action updates the `state` object, calls `saveState()`, then re-renders so the page always matches the data.

---

## Data Model (LocalStorage)

Everything is stored under a single key, `deskwork.v1`, as a JSON object:

```json
{
  "tasks": [
    {
      "id": "k3j2h1g0lx9a",
      "name": "Solve 3 array problems",
      "priority": "High",
      "completed": false,
      "createdAt": 1767225600000
    }
  ],
  "goals": [
    {
      "id": "p9o8i7u6m2b1",
      "name": "Solve 50 coding problems",
      "target": 50,
      "progress": 12
    }
  ],
  "theme": "light",
  "streak": { "count": 3, "lastDate": "2026-09-28" },
  "completionLog": { "2026-09-27": 2, "2026-09-28": 1 }
}
```

- `tasks`: every task, with its priority and completion state.
- `goals`: each goal's target and current progress.
- `theme`: `"light"` or `"dark"`.
- `streak`: current streak length and the last date a task was completed.
- `completionLog`: number of tasks completed per day. This feeds the weekly chart and completion percentage, and it is kept separately from the tasks so history remains even after tasks are deleted.

To reset the app, open the browser DevTools console and run `localStorage.removeItem("deskwork.v1")`, then refresh.

---

## Key Logic Explained

### Adding a task
1. The form's `submit` event fires (a click on **Add task** or pressing Enter).
2. `addTask()` trims the text, creates a task object with a unique ID and timestamp, and pushes it into `state.tasks`.
3. The state is saved and the page is re-rendered.

### Completing a task
1. Clicking the checkbox calls `toggleTask(id)`.
2. The task's `completed` flag flips.
3. If it became completed, today's count in `completionLog` goes up by one and `registerStreak()` runs. If it was un-completed, today's count goes down by one.

### Study streak
`registerStreak()` compares the last completion date with today:
- Already counted today: nothing changes.
- Last completion was **yesterday**: streak increases by 1.
- Any other gap: streak resets to 1.
- No previous completion: streak starts at 1.

### Weekly completion percentage
Over the last 7 days, the app divides the **tasks completed** by the larger of **tasks created** and **tasks completed** (never less than 1). It shows 0% when nothing was created or completed in that window.

### Search and filter
`getFilteredTasks()` first applies the status filter (all, active, or completed), then keeps only tasks whose name contains the search text (case-insensitive), then sorts them newest first. If the result is empty, an empty-state message is shown.

### Weekly chart
`renderWeekChart()` reads the last 7 days from `completionLog`, scales each bar relative to the largest value (with a minimum scale of 3 so small counts look sensible), and highlights today's bar.

### Goals
A goal's bar width is `progress / target`, capped at 100%. When progress reaches the target, the bar changes colour and the label shows "done".

---

## Responsive Design

| Screen width | Behaviour |
|---|---|
| **Above 980px** | Sidebar on the left, four stat cards in a row, tasks and side column side by side. |
| **760px to 980px** | Content stacks into a single column, and stat cards form a 2x2 grid. |
| **Below 760px** | The sidebar becomes a top bar with horizontal navigation, and padding is reduced. |
| **Below 480px** | Forms stack vertically and buttons stretch to full width. |

---

## Frontend Concepts Demonstrated

- HTML page structure, semantic elements, forms, and input types
- The `<template>` element for reusable markup
- CSS variables, Flexbox, Grid, and media queries
- Theming with a single `data-theme` attribute
- Transitions, hover effects, and focus styles
- JavaScript variables, functions, arrays, and objects
- Event listeners and event handling
- DOM manipulation and dynamic content generation
- Conditional logic and array methods (`filter`, `find`, `reduce`, `sort`, `forEach`)
- LocalStorage with JSON serialisation and error handling
- Date handling for streaks and weekly statistics
- Accessibility basics (ARIA labels, focus visibility, reduced motion)

---

## Customization

- **Change colours or fonts**: edit the variables at the top of `style.css`.
- **Change the app name**: update the `<title>`, the `.brand-name` text in `index.html`, and optionally the `STORAGE_KEY` in `script.js` (this starts with fresh data).
- **Add a priority level**: add an `<option>` in the priority `<select>` in `index.html`, then add a matching `.task-priority[data-level="..."]` style in `style.css`.
- **Remove the sample data**: delete the `seedIfEmpty()` call near the bottom of `script.js`.
- **Change the chart window**: change the `7` passed to `lastNDays()` in `script.js` (the chart CSS is designed for 7 bars).

---

## Known Limitations

- Data lives only in one browser on one device. Clearing browser data erases it.
- Dates use UTC (`toISOString()`), so around midnight in some time zones a "day" may roll over a few hours early or late.
- There is no user login, syncing, or editing of existing tasks (you can delete and re-add).

---

## Future Enhancements

- User authentication and personal accounts
- Cloud storage with a **Django** backend and **MySQL** database
- Editing tasks, due dates, and reminders
- Calendar integration and notifications
- Study-time tracking (a built-in timer)
- Advanced productivity analytics and monthly reports
- Personalized recommendations based on completion patterns

---

## License

This project is free to use for learning and personal projects.