<div align="center">

# 🚀 TaskFlow AI
### *Intelligent Project & Task Management Platform*

[![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql)](https://mysql.com)
[![Groq AI](https://img.shields.io/badge/Groq-LLaMA%203.3%2070B-F55036?style=for-the-badge)](https://groq.com)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![JWT](https://img.shields.io/badge/Auth-JWT%20%2B%20bcrypt-000000?style=for-the-badge&logo=jsonwebtokens)](https://jwt.io)

> A full-stack project management platform with role-based access control and **4 AI-powered features** — task decomposition, smart priority suggestions, automated standup generation, and real-time risk analysis — all powered by Groq's LLaMA 3.3 70B model.

</div>

---

## 📋 Table of Contents

- [Live Demo Credentials](#-live-demo-credentials)
- [Tech Stack](#-tech-stack)
- [Key Features](#-key-features)
- [AI Features (Deep Dive)](#-ai-features-deep-dive)
- [Architecture & Database Design](#-architecture--database-design)
- [REST API Reference](#-rest-api-reference)
- [Role-Based Access Control](#-role-based-access-control)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)

---

## 🔐 Live Demo Credentials

The database **auto-seeds on first startup** — no manual SQL import needed. Use these accounts instantly:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | `admin@taskflow.com` | `Password@123` | Full system access — all projects, all users, all tasks |
| **Member** | `priya@taskflow.com` | `Password@123` | Own projects & assigned tasks only |
| **Member** | `rahul@taskflow.com` | `Password@123` | Own projects & assigned tasks only |
| **Member** | `sneha@taskflow.com` | `Password@123` | Own projects & assigned tasks only |
| *(+4 more members)* | `arjun/kavya/dev/tanya @taskflow.com` | `Password@123` | Member access |

> **Seeded with realistic data:** 6 projects, 8 team members, 70+ tasks across 5 status stages, with AI-suggested priorities already populated.

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js + Express 5** | `^5.2.1` | REST API server with async error handling |
| **MySQL 2** | `^3.22.3` | Relational database with connection pooling (limit: 10) |
| **JWT** | `^9.0.3` | Stateless authentication with 7-day token expiry |
| **bcryptjs** | `^3.0.3` | Password hashing with salt rounds = 12 |
| **Groq SDK** | `^1.1.2` | LLaMA 3.3 70B AI inference (ultra-fast, free tier) |
| **Helmet** | `^8.1.0` | HTTP security headers (XSS, CSRF, clickjacking protection) |
| **express-validator** | `^7.3.2` | Request body validation & sanitization |
| **nodemon** | `^3.1.14` | Dev server with hot-reload |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React 19** | `^19.2.5` | UI with concurrent features |
| **Vite 8** | `^8.0.10` | Lightning-fast dev server & build tool |
| **React Router v7** | `^7.14.2` | Client-side routing with protected routes |
| **TanStack Query v5** | `^5.100.6` | Server state management, caching & sync |
| **Recharts** | `^3.8.1` | Dashboard bar charts & data visualization |
| **Axios** | `^1.15.2` | HTTP client with centralized interceptors |
| **Lucide React** | `^1.14.0` | Icon system |
| **React Hot Toast** | `^2.6.0` | Toast notifications |

---

## ✨ Key Features

### 🔑 Authentication & Security
- **JWT-based auth** — tokens signed with HS256, expire in 7 days, stored client-side
- **bcrypt password hashing** — salt rounds of 12 (industry standard for security vs. performance)
- **Helmet middleware** — sets 11 security-related HTTP headers on every response
- **CORS whitelisting** — only allows requests from configured `CLIENT_URL`
- **Protected routes** — React-level guard via `ProtectedRoute` component + server-side JWT verification on every request
- **Role enforcement** — admin-only routes return `403 Forbidden` to non-admin users at middleware level

### 👥 User & Team Management
- User registration with duplicate email check and random avatar color assignment from a curated palette
- Role assignment at signup (`admin` or `member`) with server-side enforcement
- Full user directory available for task assignment dropdowns
- Admin-only `/users` page to view all team members and their roles

### 📁 Project Management
- **Admin** can create, update, and delete projects with name, description, deadline, and initial team members
- **Members** see only projects they own or are invited to — enforced at SQL query level (not just frontend)
- Project cards display live stats: total tasks, completed tasks, team member count
- Add/remove team members from projects post-creation
- Project status tracking: `active` / `completed` / `on_hold`
- Deadline tracking with date display

### ✅ Task Management
- Full CRUD on tasks with title, description, project assignment, assignee, status, priority, and due date
- **5 task statuses:** `todo` → `in_progress` → `review` → `done` (+ `blocked`)
- **4 priority levels:** `low` / `medium` / `high` / `critical`
- `PATCH /tasks/:id/status` — lightweight endpoint for drag-and-drop style quick status updates without full PUT
- **AI-suggested priority** stored as a separate field (`ai_suggested_priority`) alongside human-set priority for comparison
- Filter tasks by `project_id`, `assigned_to`, or `status` via query params
- Task comments system — threaded comments with user attribution and timestamps

### 📊 Dashboard
- **Role-aware stats:** admins see system-wide numbers; members see only their own data
- Task distribution bar chart (Recharts) with color-coded status breakdown
- KPI cards: Projects count, Total Tasks, In Progress, Overdue alerts
- Recent activity feed — last 5 updated tasks with assignee and project context
- Overdue detection via SQL `CURDATE()` comparison at query time

---

## 🤖 AI Features (Deep Dive)

All AI features use **Groq's LLaMA 3.3 70B Versatile** model with structured JSON output mode for reliable parsing. Zero hallucination risk on structured responses — the model is prompted to return only valid JSON with no markdown or explanation.

### 1. 🧩 Task Decomposer
**Endpoint:** `POST /api/ai/decompose`

Takes a high-level project goal and breaks it into 3–6 specific, actionable tasks.

```json
// Request
{ "goal": "Build user authentication system", "project_name": "E-Commerce Revamp" }

// Response
{
  "tasks": [
    { "title": "Design JWT auth flow", "description": "...", "priority": "high", "estimated_days": 2 },
    { "title": "Implement bcrypt password hashing", "description": "...", "priority": "critical", "estimated_days": 1 }
  ]
}
```
> **Use case:** PM enters a sprint goal → AI generates a structured task list that can be imported directly into the project.

---

### 2. 🎯 Priority Suggester
**Endpoint:** `POST /api/ai/suggest-priority`

Analyzes task title, description, and deadline proximity to suggest an appropriate priority level with a concise reason.

```json
// Request
{ "title": "Fix checkout payment bug", "description": "Users can't complete purchases", "due_date": "2026-05-10" }

// Response
{ "priority": "critical", "reason": "Revenue-blocking bug with deadline in 3 days" }
```
> **Implementation detail:** Automatically calculates `days_until_due` from the due date before sending to AI — the model receives concrete numbers, not raw dates, improving accuracy.

---

### 3. 📢 Standup Generator
**Endpoint:** `POST /api/ai/standup`

Fetches the last 20 tasks for a project from the database, formats them with status/priority/assignee data, and generates a concise daily standup in 150 words or less.

```json
// Request
{ "project_id": 1 }

// Response
{
  "standup": "**Done:** Homepage hero redesign, Algolia search integration.\n**In Progress:** Cart checkout flow (Rahul, 3 days left), Razorpay integration (Priya).\n**Blockers:** Variant management blocked on API spec from backend team. Core Web Vitals still at LCP 3.1s — needs CDN config."
}
```
> **Use case:** Auto-generate the daily standup message to paste into Slack — saves 5 minutes every morning.

---

### 4. ⚠️ Risk Analyzer
**Endpoint:** `POST /api/ai/analyze-risks`

Pulls all tasks for a project including an `is_overdue` flag computed in SQL (`CASE WHEN due_date < CURDATE() AND status != 'done' THEN 1 ELSE 0 END`), then returns a structured risk assessment.

```json
// Request
{ "project_id": 4 }

// Response
{
  "risk_level": "high",
  "risks": [
    "3 critical tasks are overdue with no assignee",
    "DevOps migration deadline is 9 days away with 40% completion",
    "Single point of failure — only 1 developer on Kubernetes migration"
  ],
  "recommendations": [
    "Reassign overdue tasks immediately",
    "Schedule emergency sync with stakeholders about timeline",
    "Bring in a second DevOps engineer for the migration"
  ]
}
```

---

## 🗄 Architecture & Database Design

### Database Schema

```sql
-- Users: role-based with avatar theming
users (id, name, email, password, role ENUM('admin','member'), avatar_color, created_at)

-- Projects: owned by a user, status-tracked
projects (id, name, description, owner_id → users, status ENUM('active','completed','on_hold'), deadline, created_at)

-- Many-to-many: project team membership
project_members (project_id → projects, user_id → users)  -- composite PK, INSERT IGNORE prevents duplicates

-- Tasks: fully relational with AI field
tasks (id, title, description, project_id → projects, assigned_to → users,
       created_by → users, status ENUM('todo','in_progress','review','done','blocked'),
       priority ENUM('low','medium','high','critical'), due_date,
       ai_suggested_priority, created_at, updated_at)

-- Comments: threaded on tasks
comments (id, task_id → tasks, user_id → users, content, created_at)
```

### Key Design Decisions
- **`ai_suggested_priority` column** stored separately from `priority` — lets you compare what humans set vs. what AI recommended, great for analytics
- **`INSERT IGNORE` on project_members** — idempotent membership, no duplicate member errors
- **Connection pooling** — MySQL pool with `connectionLimit: 10` and `waitForConnections: true` for production-ready concurrency
- **Auto-seeder** — `seeder.js` runs on every server startup but checks if `admin@taskflow.com` exists first — completely idempotent, safe to run forever

### API Architecture

```
Express App
├── Helmet (security headers)
├── CORS (whitelisted origins)
├── express.json() (body parsing)
│
├── /api/auth     → Registration, Login, /me (JWT-protected)
├── /api/projects → CRUD + member management (admin-gated creates/deletes)
├── /api/tasks    → CRUD + status patch + comments
├── /api/users    → User list + dashboard stats
├── /api/ai       → 4 AI endpoints (all JWT-protected)
└── /api/health   → Health check
```

---

## 📡 REST API Reference

### Auth Routes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | ❌ | Register new user, returns JWT |
| `POST` | `/api/auth/login` | ❌ | Login, returns JWT + user object |
| `GET` | `/api/auth/me` | ✅ | Get current user from token |

### Project Routes
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/projects` | ✅ | Any | List projects (scoped by role) |
| `POST` | `/api/projects` | ✅ | Admin | Create project + add members |
| `GET` | `/api/projects/:id` | ✅ | Any | Project detail + members list |
| `PUT` | `/api/projects/:id` | ✅ | Admin | Update project |
| `DELETE` | `/api/projects/:id` | ✅ | Admin | Delete project |
| `POST` | `/api/projects/:id/members` | ✅ | Admin | Add team member |
| `DELETE` | `/api/projects/:id/members/:userId` | ✅ | Admin | Remove team member |

### Task Routes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/tasks?project_id=&assigned_to=&status=` | ✅ | Filtered task list |
| `POST` | `/api/tasks` | ✅ | Create task (supports `ai_suggested_priority`) |
| `PUT` | `/api/tasks/:id` | ✅ | Full task update |
| `PATCH` | `/api/tasks/:id/status` | ✅ | Quick status-only update |
| `DELETE` | `/api/tasks/:id` | ✅ | Delete task |
| `GET` | `/api/tasks/:id/comments` | ✅ | Get task comments |
| `POST` | `/api/tasks/:id/comments` | ✅ | Add comment |

### AI Routes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/ai/decompose` | ✅ | Break goal into tasks |
| `POST` | `/api/ai/suggest-priority` | ✅ | Get AI priority for a task |
| `POST` | `/api/ai/standup` | ✅ | Generate daily standup |
| `POST` | `/api/ai/analyze-risks` | ✅ | Project risk analysis |

### User Routes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/users` | ✅ | All users (for assignment dropdowns) |
| `GET` | `/api/users/stats/dashboard` | ✅ | Dashboard KPIs (role-scoped) |

---

## 🔒 Role-Based Access Control

Two middleware functions enforce RBAC at the route level:

```javascript
// Blocks non-admins from admin-only routes
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

// Verifies user is a member of the project (or admin)
const requireProjectAccess = async (req, res, next) => {
  const [rows] = await pool.query(
    `SELECT pm.* FROM project_members pm WHERE pm.project_id = ? AND pm.user_id = ?
     UNION
     SELECT p.id, p.owner_id, p.owner_id FROM projects p WHERE p.id = ? AND p.owner_id = ?`,
    [projectId, req.user.id, projectId, req.user.id]
  );
  if (!rows.length && req.user.role !== 'admin') return res.status(403).json({ error: 'No access to this project' });
  next();
};
```

| Action | Admin | Member (Project) | Member (Non-Project) |
|--------|-------|-----------------|---------------------|
| View all projects | ✅ | ❌ (own only) | ❌ |
| Create/delete projects | ✅ | ❌ | ❌ |
| Manage team members | ✅ | ❌ | ❌ |
| View all tasks | ✅ | ❌ (assigned/created) | ❌ |
| Create tasks | ✅ | ✅ | ❌ |
| Update task status | ✅ | ✅ | ❌ |
| Access /users page | ✅ | ❌ (redirected) | ❌ |
| AI features | ✅ | ✅ | ❌ |

---

## 🗂 Project Structure

```
taskflow-ai/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js           # MySQL connection pool
│   │   │   └── seeder.js       # Auto-seeder (idempotent, runs on startup)
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT verification middleware
│   │   │   └── role.js         # requireAdmin + requireProjectAccess
│   │   ├── routes/
│   │   │   ├── auth.js         # Register, Login, /me
│   │   │   ├── projects.js     # Project CRUD + member management
│   │   │   ├── tasks.js        # Task CRUD + comments
│   │   │   ├── users.js        # User list + dashboard stats
│   │   │   └── ai.js           # 4 AI endpoints (Groq/LLaMA)
│   │   └── server.js           # Express app entry point
│   ├── .env                    # Environment config
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js        # Axios instance with auth interceptors
│   │   ├── components/
│   │   │   └── Layout.jsx      # Sidebar navigation + layout shell
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Global auth state (user, token, isAdmin)
│   │   ├── pages/
│   │   │   ├── Login.jsx       # Login form
│   │   │   ├── Register.jsx    # Registration form
│   │   │   ├── Dashboard.jsx   # KPIs + task chart + recent activity
│   │   │   ├── Projects.jsx    # Project list + create modal
│   │   │   ├── ProjectDetail.jsx # Single project + tasks + AI tools
│   │   │   ├── Tasks.jsx       # My tasks view with filters
│   │   │   ├── Users.jsx       # Admin user directory
│   │   │   └── AIAssistant.jsx # AI feature hub
│   │   ├── App.jsx             # Placeholder (routing in main.jsx)
│   │   └── main.jsx            # Router + ProtectedRoute + AuthProvider
│   └── package.json
│
└── seed.sql                    # Optional: manual SQL seed (auto-seeder preferred)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- A [Groq API key](https://console.groq.com) (free, no credit card)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/taskflow-ai.git
cd taskflow-ai

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Create the Database

```sql
-- In MySQL shell or Workbench
CREATE DATABASE task_manager;
USE task_manager;

-- Run the schema (create tables first)
-- Tables: users, projects, project_members, tasks, comments
```

<details>
<summary><strong>📄 Click to expand full CREATE TABLE schema</strong></summary>

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

```bash
# backend/.env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=task_manager
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
GROQ_API_KEY=your_groq_api_key_here
CLIENT_URL=http://localhost:5173
```

### 4. Start the Servers

```bash
# Terminal 1 — Backend (auto-seeds database on first run)
cd backend && npm run dev
# → Server running on port 5000
# → 🌱 Seeding database with demo data...
# → ✅ All seed data inserted successfully!

# Terminal 2 — Frontend
cd frontend && npm run dev
# → Local: http://localhost:5173
```

### 5. Login & Explore

Open `http://localhost:5173` and use the credentials from the [demo accounts table](#-live-demo-credentials) above.

**Suggested exploration path:**
1. Login as **Admin** → View full dashboard with all 70+ tasks
2. Navigate to **Projects** → Open "E-Commerce Revamp"
3. Try **AI Assistant** → Decompose a new project goal into tasks
4. Logout → Login as **Member (priya@taskflow.com)** → Notice data is scoped to assigned tasks only
5. Try accessing `/users` as a member → Redirected (RBAC in action)

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | ✅ | Backend server port (default: 5000) |
| `DB_HOST` | ✅ | MySQL host |
| `DB_USER` | ✅ | MySQL user |
| `DB_PASSWORD` | ✅ | MySQL password |
| `DB_NAME` | ✅ | Database name (create manually) |
| `JWT_SECRET` | ✅ | Secret for signing JWT tokens (use 64+ char random string) |
| `JWT_EXPIRES_IN` | ✅ | Token expiry (e.g., `7d`, `24h`) |
| `GROQ_API_KEY` | ✅ | API key from [console.groq.com](https://console.groq.com) (free) |
| `CLIENT_URL` | ✅ | Frontend URL for CORS whitelist |

---

<div align="center">

Built with ❤️ using **Node.js · React · MySQL · Groq AI**

*Every feature production-tested. Every route secured. Every AI response structured.*

</div>