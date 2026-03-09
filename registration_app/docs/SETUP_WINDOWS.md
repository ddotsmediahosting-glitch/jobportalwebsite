# Setup Guide – Windows 11 (PowerShell)

## Prerequisites

- Windows 11 with **winget** (comes with App Installer from the Microsoft Store)
- A PowerShell terminal (Windows Terminal recommended)
- Internet access

---

## 1. Clone / Download the project

If you received this as a ZIP, extract it anywhere.
If you are cloning:

```powershell
git clone <your-repo-url> registration_app
cd registration_app
```

---

## 2. Run the installer

Open **PowerShell** (not ISE) in the `registration_app` folder.

```powershell
# Allow local scripts to run (one-time, per machine)
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force

# Run the installer
.\scripts\install.ps1
```

The script will:
- Verify / install **Node.js LTS** via winget
- Verify / install **Git** via winget
- Install **ESLint** and **Prettier** VS Code extensions
- Run `npm install` for both `backend/` and `frontend/`

---

## 3. Start the backend

Open a **new PowerShell terminal** and run:

```powershell
.\scripts\start-backend.ps1
```

Expected output:

```
Backend running at http://localhost:4000
```

Leave this terminal open.

---

## 4. Start the frontend

Open **another new PowerShell terminal** and run:

```powershell
.\scripts\start-frontend.ps1
```

Expected output:

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

Open your browser at **http://localhost:5173**

---

## 5. Test with curl (PowerShell)

### Health check

```powershell
curl.exe http://localhost:4000/health
```

Expected: `{"status":"ok"}`

---

### Register a new user

```powershell
curl.exe -X POST http://localhost:4000/api/register `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Jane Doe\",\"phone\":\"+1 555-000-1234\",\"email\":\"jane@example.com\",\"password\":\"secret99\"}'
```

Expected:

```json
{"message":"Registration successful.","userId":1}
```

---

### Attempt duplicate registration (should fail)

```powershell
curl.exe -X POST http://localhost:4000/api/register `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Jane Doe\",\"phone\":\"+1 555-000-1234\",\"email\":\"jane@example.com\",\"password\":\"secret99\"}'
```

Expected:

```json
{"errors":["An account with this email already exists."]}
```

---

### List all registered users

```powershell
curl.exe http://localhost:4000/api/users
```

Expected: JSON array of users (no passwords).

---

## 6. Project structure

```
registration_app/
  backend/
    src/
      db.js               SQLite setup + table creation
      server.js           Express entry point (port 4000)
      routes/users.js     POST /api/register, GET /api/users
      middleware/
        validate.js       Server-side input validation
    .env                  PORT, DB_PATH, BCRYPT_ROUNDS
    package.json
  frontend/
    src/
      components/
        RegisterForm.jsx  Form with client validation
        UserList.jsx      Table of registered users
      App.jsx             Tab navigation shell
      main.jsx            React root
    index.html
    vite.config.js        Proxy /api -> http://localhost:4000
    package.json
  scripts/
    install.ps1           One-shot installer
    start-backend.ps1     Starts Express
    start-frontend.ps1    Starts Vite dev server
  docs/
    SETUP_WINDOWS.md      This file
```

---

## 7. Stopping the servers

Press **Ctrl+C** in each terminal.

---

## 8. Database location

The SQLite database is created automatically at:

```
backend/data/registrations.db
```

To reset it, delete that file and restart the backend.
