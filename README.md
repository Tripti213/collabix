# ProjectFlow — MERN Project Management Tool

A full-stack collaborative project management tool (Trello/Asana-like) built with the MERN stack.

## Tech Stack

- **MongoDB** — Database
- **Express.js** — REST API
- **React.js** — Frontend SPA
- **Node.js** — Runtime
- **Socket.io** — Real-time WebSocket updates
- **JWT** — Authentication
- **react-beautiful-dnd** — Drag-and-drop board

---

## Features

### Auth System
- Register / Login with JWT tokens
- Protected routes, persistent sessions

### Projects
- Create projects with name, description, color
- Invite members by name/email search
- Owner/member/viewer roles

### Kanban Board (Drag & Drop)
- 4 default columns: To Do, In Progress, In Review, Done
- Drag tasks between columns
- Real-time updates via WebSockets

### Tasks
- Create tasks with title, description, priority, due date, labels, cover color
- Assign multiple members
- Checklist with progress bar
- Mark overdue tasks

### Comments
- Comment on any task
- Edit/delete your own comments
- Real-time updates

### Notifications
- Task assignment notifications
- Comment notifications
- Project invite notifications
- Real-time toast alerts
- Mark as read / mark all read

---

## Setup & Run

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Backend

```bash
cd server
cp .env.example .env
# Edit .env and set MONGO_URI, JWT_SECRET
npm install
npm start
# Server runs on http://localhost:5000
```

### 2. Frontend

```bash
cd client
npm install
npm start
# App runs on http://localhost:3000
```

### Environment Variables

**server/.env**
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/projectflow
JWT_SECRET=your_super_secret_key
CLIENT_URL=http://localhost:3000
```

**client/.env** (optional)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

---

## Project Structure

```
projectflow/
├── server/
│   ├── config/db.js           # MongoDB connection
│   ├── middleware/auth.js      # JWT middleware
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   ├── Comment.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   ├── comments.js
│   │   ├── notifications.js
│   │   └── users.js
│   └── index.js               # Express + Socket.io entry
│
└── client/
    └── src/
        ├── context/
        │   ├── AuthContext.js
        │   └── NotificationContext.js
        ├── pages/
        │   ├── LoginPage.js
        │   ├── RegisterPage.js
        │   ├── DashboardPage.js
        │   └── ProjectPage.js
        ├── components/
        │   ├── shared/        # Layout, Navbar, Toast
        │   ├── project/       # ProjectCard, CreateProjectModal, etc.
        │   └── task/          # TaskCard, TaskModal, CommentSection, etc.
        ├── utils/
        │   ├── api.js         # Axios instance
        │   └── socket.js      # Socket.io client
        └── index.css          # Full design system
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |
| GET | /api/projects | User's projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Project detail |
| PUT | /api/projects/:id | Update project |
| POST | /api/projects/:id/members | Add member |
| DELETE | /api/projects/:id/members/:uid | Remove member |
| GET | /api/tasks/project/:id | Project tasks |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| PUT | /api/tasks/:id/move | Move task (DnD) |
| DELETE | /api/tasks/:id | Delete task |
| GET | /api/comments/task/:id | Task comments |
| POST | /api/comments | Add comment |
| PUT | /api/comments/:id | Edit comment |
| DELETE | /api/comments/:id | Delete comment |
| GET | /api/notifications | User notifications |
| PUT | /api/notifications/:id/read | Mark read |
| PUT | /api/notifications/mark-all-read | Mark all read |
| GET | /api/users/search?q= | Search users |

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| authenticate | Client→Server | Link userId to socket |
| join_project | Client→Server | Join project room |
| task:created | Server→Client | New task in project |
| task:updated | Server→Client | Task edited |
| task:moved | Server→Client | Task dragged |
| task:deleted | Server→Client | Task removed |
| project:updated | Server→Client | Project changed |
| comment:added | Server→Client | New comment |
| comment:updated | Server→Client | Comment edited |
| comment:deleted | Server→Client | Comment removed |
| notification:new | Server→Client | Toast notification |
