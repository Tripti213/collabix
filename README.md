# Collabix — MERN Project Management Tool

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
# Server runs on http://localhost:5001
```

### 2. Frontend

```bash
cd client
npm install
npm start
# App runs on http://localhost:3000
```