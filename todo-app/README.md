# TodoApp — Node.js + React

A full-stack task manager with user authentication, CRUD operations, priority levels, due dates, and progress tracking.

## Tech Stack

| Layer    | Tech                                    |
|----------|-----------------------------------------|
| Backend  | Node.js, Express, better-sqlite3, JWT   |
| Frontend | React 18, Vite, Tailwind CSS, Axios     |

## Features

- 🔐 Register & login with JWT authentication
- ✅ Create, edit, delete, and complete tasks
- 🏷️ Priority levels (High / Medium / Low)
- 📅 Due dates with overdue indicators
- 📊 Progress bar and task stats
- 🔍 Filter by status (All / Active / Completed) and priority

## Project Structure

```
todo-app/
├── backend/
│   ├── src/
│   │   ├── server.js          # Express app entry point
│   │   ├── db.js              # SQLite database setup
│   │   ├── middleware/auth.js  # JWT middleware
│   │   └── routes/
│   │       ├── auth.js        # Register / login
│   │       └── tasks.js       # CRUD tasks
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── context/AuthContext.jsx
    │   ├── lib/api.js
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   └── TasksPage.jsx
    │   └── components/
    │       ├── TaskForm.jsx
    │       ├── TaskItem.jsx
    │       └── StatsBar.jsx
    └── package.json
```

## Getting Started

### 1. Install backend dependencies

```bash
cd todo-app/backend
npm install
```

### 2. Start the backend server

```bash
npm run dev
# Runs on http://localhost:5000
```

### 3. Install frontend dependencies (new terminal)

```bash
cd todo-app/frontend
npm install
```

### 4. Start the frontend dev server

```bash
npm run dev
# Runs on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Desktop App (Windows .exe Installer)

The app can also be packaged as a standalone Windows desktop application using Electron.

### Prerequisites — Enable Developer Mode (required once)

`electron-builder` needs to create symbolic links during the build. Enable **Developer Mode** in Windows:

> **Settings → System → For developers → Developer Mode → ON**

Or alternatively, run the build from an **Administrator** terminal.

### Build the installer

```bash
cd todo-app/desktop
npm install

# Option A: PowerShell (recommended)
.\build-win.ps1

# Option B: Command line
npm run build:win
```

The installer will be created at:
```
todo-app/desktop/dist/TodoApp Setup 1.0.0.exe
```

### What the desktop app does
- Bundles the Express backend + React frontend into a single `.exe`
- Starts the backend automatically on port **5199** when the app launches
- Stores the SQLite database in `%APPDATA%\todoapp-desktop\data\todos.db`
- No Node.js or browser required on the target machine

## API Endpoints

| Method | Endpoint              | Auth | Description              |
|--------|-----------------------|------|--------------------------|
| POST   | /api/auth/register    | ❌    | Register new user        |
| POST   | /api/auth/login       | ❌    | Login                    |
| GET    | /api/tasks            | ✅    | List tasks (with filters)|
| POST   | /api/tasks            | ✅    | Create task              |
| PATCH  | /api/tasks/:id        | ✅    | Update task              |
| DELETE | /api/tasks/:id        | ✅    | Delete task              |
| GET    | /api/tasks/stats      | ✅    | Get task stats           |
