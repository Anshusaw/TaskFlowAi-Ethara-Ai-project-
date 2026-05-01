# TaskFlowAi-Ethara-Ai-project-
Full-stack project management app with JWT auth, role-based access control (Admin/Member), task assignment &amp; tracking, and 4 AI features (task decomposer, priority suggester, standup generator, risk analyzer) powered by Groq LLaMA 3.3 70B. Built with React 19, Node.js, MySQL.

<div align="center">

<img src="https://img.shields.io/badge/TaskFlow-AI-7c6df0?style=for-the-badge&logoColor=white" height="45"/>

### Full-Stack Project & Task Management — with Built-in AI Superpowers

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://mysql.com)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-F55036?style=flat-square)](https://groq.com)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens)](https://jwt.io)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

<br/>

**TaskFlow AI** is a full-stack team productivity platform where admins manage projects and teams, members track their tasks, and everyone gets AI-powered assistance — from breaking down goals into tasks, to generating daily standups automatically.

[🚀 Quick Start](#-quick-start) · [🤖 AI Features](#-ai-features) · [📡 API Docs](#-api-reference) · [🔐 Demo Login](#-demo-accounts)

</div>

---

## 📸 What's Inside

| Page | What it does |
|------|-------------|
| **Dashboard** | KPI cards (projects, tasks, overdue), task distribution chart, recent activity feed — all role-scoped |
| **Projects** | Create & manage projects with team members, deadlines, and live task progress |
| **Project Detail** | All tasks for a project, member list, inline AI tools |
| **Tasks** | Personal task view with status/priority filters |
| **AI Assistant** | 4 AI tools — decompose goals, suggest priorities, write standups, analyze risks |
| **Users** | Admin-only team directory |

---

## 🔐 Demo Accounts

> Database **auto-seeds on first startup** — no SQL import needed. Just run and log in.

| Role | Email | Password | What you can do |
|------|-------|----------|----------------|
| **Admin** | `admin@taskflow.com` | `Password@123` | Everything — all projects, all tasks, manage team |
| **Member** | `priya@taskflow.com` | `Password@123` | Own projects + assigned tasks only |
| **Member** | `rahul@taskflow.com` | `Password@123` | Own projects + assigned tasks only |
| **Member** | `sneha@taskflow.com` | `Password@123` | Own projects + assigned tasks only |
| **4 more members** | `arjun / kavya / dev / tanya @taskflow.com` | `Password@123` | Member access |

Seeded with **6 real projects**, **8 team members**, and **70+ tasks** across all status stages.

---

## ✨ Features

### 🔑 Authentication
- JWT-based login & registration (7-day token expiry)
- Passwords hashed with **bcrypt at salt rounds 12**
- Duplicate email check returns `409 Conflict`
- Random avatar color assigned on signup from a curated palette
- Token verified on every protected request via `auth` middleware

### 👥 Role-Based Access Control
Two roles, enforced at **both API middleware and SQL query level** — not just the frontend:

- **Admin** — full system access: create/delete projects, manage all tasks, view all users
- **Member** — scoped access: only sees projects they own or are invited to, only their assigned/created tasks

```
Admin  → sees everything
Member → sees only what belongs to them
Unauthorized → 403 Forbidden at the route level, before any DB call
```

### 📁 Project & Team Management
- Create projects with name, description, deadline, and initial members in one request
- Add/remove members post-creation via dedicated endpoints
- Project cards show **live stats** (total tasks, completed, team size) via SQL aggregation
- Project statuses: `active` / `completed` / `on_hold`

### ✅ Task Management
- Full CRUD with title, description, project, assignee, due date
- **5 status stages:** `todo` → `in_progress` → `review` → `done` → `blocked`
- **4 priority levels:** `low` / `medium` / `high` / `critical`
- `PATCH /tasks/:id/status` — lightweight endpoint for quick status updates without a full PUT
- `ai_suggested_priority` stored as a **separate DB field** alongside human-set priority for comparison
- Filter tasks by `project_id`, `assigned_to`, `status` via query params
- Threaded **comments** per task with user attribution and timestamps

### 📊 Dashboard
- **Role-scoped KPIs** — admins see system-wide numbers; members see only their own data
- Task distribution **bar chart** (Recharts) with color-coded status breakdown
- **Overdue detection** via `WHERE due_date < CURDATE() AND status != 'done'` computed at query time
- Recent activity feed — last 5 updated tasks with assignee and project context

---

## 🤖 AI Features

All 4 AI features use **Groq's LLaMA 3.3 70B Versatile** with JSON output mode — structured, parseable responses every single time. No markdown, no hallucinated formats.

<details>
<summary><strong>🧩 Task Decomposer</strong> — Break a project goal into actionable tasks</summary>

**`POST /api/ai/decompose`**

Input a high-level goal, get back 3–6 specific tasks with priorities and time estimates ready to import into the project.

```json
// Request
{ "goal": "Build user authentication system", "project_name": "E-Commerce Revamp" }

// Response
{
  "tasks": [
    { "title": "Design JWT auth flow", "description": "...", "priority": "high", "estimated_days": 2 },
    { "title": "Implement password hashing", "description": "...", "priority": "critical", "estimated_days": 1 },
    { "title": "Build login & register endpoints", "description": "...", "priority": "high", "estimated_days": 2 }
  ]
}
```
</details>

<details>
<summary><strong>🎯 Priority Suggester</strong> — AI-recommended priority based on context & deadline proximity</summary>

**`POST /api/ai/suggest-priority`**

Automatically calculates `days_until_due` before the API call — the model receives concrete numbers, not raw dates, improving accuracy.

```json
// Request
{ "title": "Fix checkout payment bug", "description": "Users can't complete purchases", "due_date": "2026-05-10" }

// Response
{ "priority": "critical", "reason": "Revenue-blocking bug with deadline in 3 days" }
```
</details>

<details>
<summary><strong>📢 Standup Generator</strong> — Auto-write your daily standup in seconds</summary>

**`POST /api/ai/standup`**

Fetches the last 20 tasks from the DB with status/priority/assignee data, generates a standup in ≤150 words. Paste directly into Slack.

```json
// Request
{ "project_id": 1 }

// Response
{
  "standup": "Done: Homepage redesign, Algolia search integration.\nIn Progress: Cart checkout (Rahul, 3 days left), Razorpay integration (Priya).\nBlockers: Variant management blocked on API spec. Core Web Vitals still at LCP 3.1s — needs CDN config."
}
```
</details>

<details>
<summary><strong>⚠️ Risk Analyzer</strong> — Spot project health issues before they escalate</summary>

**`POST /api/ai/analyze-risks`**

Pulls all tasks with an `is_overdue` flag computed in SQL (`CASE WHEN due_date < CURDATE() AND status != 'done'`), returns a structured risk report.

```json
// Request
{ "project_id": 4 }

// Response
{
  "risk_level": "high",
  "risks": [
    "3 critical tasks overdue with no assignee",
    "Deadline in 9 days with only 40% completion",
    "Single developer on the Kubernetes migration"
  ],
  "recommendations": [
    "Reassign overdue tasks immediately",
    "Schedule emergency stakeholder sync",
    "Bring in a second DevOps engineer"
  ]
}
```
</details>

---

## 🛠 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React, Vite, React Router, TanStack Query, Recharts, Axios, Lucide React, React Hot Toast | React 19 / Vite 8 |
| **Backend** | Node.js, Express, MySQL2 (connection pool) | Express 5 |
| **Auth** | JSON Web Tokens, bcryptjs (rounds: 12) | JWT 9 |
| **AI** | Groq SDK → LLaMA 3.3 70B Versatile (JSON mode) | groq-sdk 1.1 |
| **Security** | Helmet, CORS whitelist, express-validator | Helmet 8 |
| **Dev** | Nodemon, ESLint, Vite HMR | — |

---

## 🗄 Database Schema

```sql
users           (id, name, email, password, role ENUM('admin','member'), avatar_color, created_at)
projects        (id, name, description, owner_id → users, status, deadline, created_at)
project_members (project_id → projects, user_id → users)   ← composite PK
tasks           (id, title, description, project_id, assigned_to, created_by,
                 status, priority, due_date, ai_suggested_priority, created_at, updated_at)
comments        (id, task_id → tasks, user_id → users, content, created_at)
```

**Design decisions worth noting:**
- `ai_suggested_priority` lives in its own column — track AI recommendations vs. human decisions independently
- `INSERT IGNORE` on `project_members` — idempotent membership, zero duplicate-entry errors
- `ON DELETE CASCADE` on tasks and comments — referential integrity maintained automatically
- MySQL connection pool `limit: 10`, `waitForConnections: true` — concurrent requests handled cleanly

---

## 📡 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | — | Register → returns JWT |
| `POST` | `/api/auth/login` | — | Login → returns JWT + user |
| `GET` | `/api/auth/me` | ✅ | Get current user from token |

### Projects
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/api/projects` | Any | List (scoped by role) |
| `POST` | `/api/projects` | Admin | Create with members |
| `GET` | `/api/projects/:id` | Any | Detail + members |
| `PUT` | `/api/projects/:id` | Admin | Update |
| `DELETE` | `/api/projects/:id` | Admin | Delete |
| `POST` | `/api/projects/:id/members` | Admin | Add member |
| `DELETE` | `/api/projects/:id/members/:uid` | Admin | Remove member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | Filter by `?project_id= &assigned_to= &status=` |
| `POST` | `/api/tasks` | Create task |
| `PUT` | `/api/tasks/:id` | Full update |
| `PATCH` | `/api/tasks/:id/status` | Quick status-only update |
| `DELETE` | `/api/tasks/:id` | Delete |
| `GET` | `/api/tasks/:id/comments` | Get comments |
| `POST` | `/api/tasks/:id/comments` | Add comment |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/decompose` | Goal → task list |
| `POST` | `/api/ai/suggest-priority` | Task details → priority + reason |
| `POST` | `/api/ai/standup` | Project ID → standup text |
| `POST` | `/api/ai/analyze-risks` | Project ID → risk report |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users` | All users (for dropdowns) |
| `GET` | `/api/users/stats/dashboard` | KPI stats (role-scoped) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- Free [Groq API key](https://console.groq.com) — takes 30 seconds, no credit card

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/taskflow-ai.git
cd taskflow-ai

cd backend   && npm install
cd ../frontend && npm install
```

### 2. Create the Database

```sql
-- In MySQL shell or Workbench
CREATE DATABASE task_manager;
USE task_manager;
-- Then paste and run the schema from the collapsible below
```

<details>
<summary>📄 Full CREATE TABLE schema (5 tables)</summary>

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'member') DEFAULT 'member',
  avatar_color VARCHAR(20) DEFAULT '#6366f1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  owner_id INT,
  status ENUM('active', 'completed', 'on_hold') DEFAULT 'active',
  deadline DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE project_members (
  project_id INT,
  user_id INT,
  PRIMARY KEY (project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  project_id INT,
  assigned_to INT,
  created_by INT,
  status ENUM('todo', 'in_progress', 'review', 'done', 'blocked') DEFAULT 'todo',
  priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  due_date DATE,
  ai_suggested_priority ENUM('low', 'medium', 'high', 'critical'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT,
  user_id INT,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```
</details>

### 3. Configure Environment

Create `backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=task_manager
JWT_SECRET=your_64_char_random_string_here
JWT_EXPIRES_IN=7d
GROQ_API_KEY=gsk_your_groq_key_here
CLIENT_URL=http://localhost:5173
```

### 4. Run Both Servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev
# 🚀 Server running on port 5000
# 🌱 Seeding database with demo data...
# ✅ All seed data inserted successfully!

# Terminal 2 — Frontend
cd frontend && npm run dev
# ➜ Local: http://localhost:5173
```

Open `http://localhost:5173` → log in with any account from the table above → everything is ready.

---

## 🗂 Project Structure

```
taskflow-ai/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js           # MySQL pool (limit: 10, waitForConnections: true)
│   │   │   └── seeder.js       # Idempotent auto-seeder — runs on startup, skips if seeded
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT verification → attaches req.user
│   │   │   └── role.js         # requireAdmin + requireProjectAccess
│   │   ├── routes/
│   │   │   ├── auth.js         # Register, Login, /me
│   │   │   ├── projects.js     # CRUD + team management
│   │   │   ├── tasks.js        # CRUD + PATCH status + comments
│   │   │   ├── users.js        # User list + dashboard stats
│   │   │   └── ai.js           # 4 Groq/LLaMA endpoints
│   │   └── server.js           # Helmet, CORS, routes, error handler
│   └── .env
│
└── frontend/
    └── src/
        ├── api/axios.js            # Axios instance + auth interceptor
        ├── context/AuthContext.jsx # Global auth state (user, token, isAdmin)
        ├── components/Layout.jsx   # Sidebar nav shell
        └── pages/
            ├── Dashboard.jsx       # KPI cards + Recharts + activity feed
            ├── Projects.jsx        # Project list + create modal
            ├── ProjectDetail.jsx   # Tasks + members + AI tools
            ├── Tasks.jsx           # My tasks with filters
            ├── AIAssistant.jsx     # AI feature hub
            ├── Users.jsx           # Admin directory
            ├── Login.jsx
            └── Register.jsx
```

---

## 🔒 Security

- **Helmet** — 11 HTTP security headers set on every response (XSS, clickjacking, MIME sniffing, etc.)
- **CORS whitelist** — only `CLIENT_URL` and `localhost:5173` accepted
- **bcrypt salt rounds = 12** — production-grade, not the default 10
- **SQL-level data scoping** — members cannot retrieve other users' data via direct API calls; the WHERE clause excludes unauthorized rows at the database layer, not just the frontend
- **Correct HTTP status codes** — `400` bad input · `401` unauthenticated · `403` wrong role · `404` not found · `409` conflict
- **Global error handler** — unhandled errors return clean JSON, never stack traces

---

## 📄 License

[MIT](LICENSE) — free to use, fork, and build on.

---

<div align="center">

Made with **Node.js · React · MySQL · Groq AI**

⭐ **Star this repo** if it helped you or saved you time

</div>
