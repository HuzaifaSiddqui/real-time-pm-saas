# FlowBoard — Real-Time Project Management SaaS Platform

A modern, full-stack, portfolio-grade project management platform inspired by tools like Linear, ClickUp, and Asana. Designed for engineering teams, product managers, and remote organizations to plan, collaborate, track, and execute initiatives seamlessly in real-time.

---

## 🚀 Key Features

- **Real-Time Collaboration**: Socket.IO bi-directional communication for instant task status changes, live discussions, presence indicators, and typing indicators.
- **Kanban Board**: Drag-and-drop workflow columns (`Backlog`, `To Do`, `In Progress`, `In Review`, `Blocked`, `Done`) with live synchronization across all connected clients.
- **Role-Based Access Control (RBAC)**: Backend-enforced permissions for `Owner`, `Admin`, `Project Manager`, `Member`, and `Viewer`.
- **Agile Sprint Planning**: Sprint lifecycles, sprint progress, and task velocity tracking.
- **Project Roadmaps & Timeline**: Interactive visualization of milestones, progress bars, and target deadlines.
- **Team Workload & Capacity**: Real-time allocation of estimated effort across team members.
- **Time Tracking**: Live start/stop timer for tasks with persistence and manual time log entries.
- **Notification Center**: Real-time notifications for task assignments, mentions, and project updates.
- **Interactive Analytics**: Visual charts powered by Recharts (task completion trends, priority distribution, and status breakdowns).
- **Dark & Light Mode**: Seamless theme switching with Tailwind CSS variables and persistent state.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS & Shadcn UI design system
- **Routing**: React Router v6
- **Server State**: TanStack Query (React Query)
- **Global State**: Zustand with LocalStorage persistence
- **Real-Time**: Socket.IO Client
- **Charts**: Recharts
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js & Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **WebSockets**: Socket.IO with JWT handshake authentication
- **Authentication**: JWT with refresh tokens & bcrypt password hashing
- **Security**: Helmet, CORS, and Express Rate Limiting
- **Validation**: Zod schema validation

---

## ⚡ Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) running locally on port 27017

### 2. Clone and Setup

```bash
git clone https://github.com/HuzaifaSiddqui/real-time-pm-saas.git
cd real-time-pm-saas
```

### 3. Backend Setup

```bash
cd backend
npm install
npm run seed     # Populates demo workspace, projects, sprints, tasks, and users
npm run dev      # Runs server on http://localhost:5001
```

### 4. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev      # Runs Vite dev server on http://localhost:3000
```

Visit **`http://localhost:3000`** in your browser.

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Workspace Owner** | `owner@demo.com` | `Demo1234!` |
| **Admin** | `admin@demo.com` | `Demo1234!` |
| **Project Manager** | `pm@demo.com` | `Demo1234!` |
| **Developer** | `dev@demo.com` | `Demo1234!` |
| **Viewer** | `viewer@demo.com` | `Demo1234!` |

*(One-click demo login buttons are also available directly on the login page).*

---

## 📁 Project Structure

```
real-time-pm-saas/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB & environment config
│   │   ├── middleware/      # JWT auth, RBAC, error handlers
│   │   ├── models/          # Mongoose data schemas (User, Workspace, Task, Sprint, etc.)
│   │   ├── routes/          # Express REST API routes
│   │   ├── seed/            # Comprehensive sample dataset
│   │   └── index.ts         # Server entrypoint & Socket.IO server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # UI primitives, layout, dialogs, task cards
│   │   ├── lib/             # Axios API client, Socket.IO client, utils
│   │   ├── pages/           # Overview, Kanban, Sprints, Roadmap, Analytics, Team, Settings
│   │   ├── stores/          # Zustand auth, workspace, and theme stores
│   │   ├── App.tsx          # Application routes & QueryClient provider
│   │   └── main.tsx
│   └── package.json
└── README.md
```

---

## 📄 License

This project is licensed under the MIT License.
