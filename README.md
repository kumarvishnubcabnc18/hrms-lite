# HRMS Lite — Human Resource Management System

A full-stack, production-ready Human Resource Management System with employee management and daily attendance tracking.

---

## 📸 Features

- **Dashboard** — Live stats, 7-day attendance trend chart, department breakdown, today's attendance summary
- **Employee Management** — Add, view, search/filter, and delete employees with full validation
- **Attendance Tracking** — Mark/update attendance per employee per day (Present / Absent / Half Day / Remote)
- **Employee Detail Drawer** — Per-employee attendance history with monthly filter and attendance rate
- **Filter Attendance** — By date, month, employee, or status
- **Present Days Counter** — Total present + remote days shown per employee
- **Toast Notifications** — Success / error / info feedback on every action
- **Loading / Empty / Error States** — Throughout all data-fetching areas

---

## 🛠 Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18, CSS Variables, Fetch API |
| Backend    | Node.js, Express 4                |
| Database   | SQLite (via `better-sqlite3`)     |
| Validation | `express-validator`               |
| Security   | `helmet`, `cors`                  |
| Logging    | `morgan`                          |
| Deploy FE  | Vercel / Netlify                  |
| Deploy BE  | Render (with persistent disk)     |
| Fonts      | Outfit + JetBrains Mono (Google)  |

---

## 📁 Project Structure

```
hrms-lite/
├── backend/
│   ├── src/
│   │   ├── server.js          # Express entry point
│   │   ├── db.js              # SQLite init & schema
│   │   └── routes/
│   │       ├── employees.js   # CRUD + attendance per employee
│   │       ├── attendance.js  # Mark/filter/update attendance
│   │       └── dashboard.js   # Aggregated dashboard stats
│   ├── data/                  # SQLite DB lives here (gitignored)
│   ├── render.yaml            # Render deployment config
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.js             # Root component + routing
    │   ├── index.js           # React entry
    │   ├── styles/
    │   │   └── globals.css    # Full design system
    │   ├── components/
    │   │   ├── ui.jsx         # Reusable: Avatar, Badge, Button, Modal, Toast…
    │   │   ├── Sidebar.jsx
    │   │   ├── AddEmployeeModal.jsx
    │   │   ├── MarkAttendanceModal.jsx
    │   │   └── EmployeeDetailDrawer.jsx
    │   ├── pages/
    │   │   ├── DashboardPage.jsx
    │   │   ├── EmployeesPage.jsx
    │   │   └── AttendancePage.jsx
    │   ├── hooks/
    │   │   └── index.js       # useAsync, useFetch, useToast, useFormErrors
    │   └── utils/
    │       └── api.js         # Centralized API client
    ├── vercel.json
    ├── .env.example
    └── package.json
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js ≥ 18
- npm ≥ 8

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/hrms-lite.git
cd hrms-lite
```

### 2. Start the Backend

```bash
cd backend
cp .env.example .env        # copy environment variables
npm install
npm start
# → API running on http://localhost:5000
```

Verify: `curl http://localhost:5000/api/health`

### 3. Start the Frontend

In a new terminal:

```bash
cd frontend
cp .env.example .env        # leave REACT_APP_API_URL blank for local dev
npm install
npm start
# → App running on http://localhost:3000
```

The frontend's `proxy` config in `package.json` forwards `/api` requests to `localhost:5000` automatically.

---

## 🌐 REST API Reference

### Employees

| Method | Endpoint                       | Description                        |
|--------|--------------------------------|------------------------------------|
| GET    | `/api/employees`               | List all employees (search/filter) |
| GET    | `/api/employees/:id`           | Get employee by ID                 |
| POST   | `/api/employees`               | Create new employee                |
| DELETE | `/api/employees/:id`           | Delete employee (cascades attendance) |
| GET    | `/api/employees/:id/attendance`| Get attendance for one employee    |

**POST /api/employees body:**
```json
{
  "id": "EMP001",
  "name": "Jane Doe",
  "email": "jane@company.com",
  "department": "Engineering"
}
```

### Attendance

| Method | Endpoint                   | Description                        |
|--------|----------------------------|------------------------------------|
| GET    | `/api/attendance`          | List records (date/emp/status/month filter) |
| POST   | `/api/attendance`          | Mark or update attendance (upsert) |
| PUT    | `/api/attendance/:id`      | Update attendance status           |
| DELETE | `/api/attendance/:id`      | Delete attendance record           |
| GET    | `/api/attendance/summary`  | Today's attendance summary         |

**POST /api/attendance body:**
```json
{
  "employee_id": "EMP001",
  "date": "2025-03-06",
  "status": "Present"
}
```
Valid statuses: `Present`, `Absent`, `Half Day`, `Remote`

### Dashboard

| Method | Endpoint         | Description                 |
|--------|------------------|-----------------------------|
| GET    | `/api/dashboard` | Full dashboard stats bundle |

---

## ☁️ Deployment

### Backend — Render.com

1. Push `backend/` to GitHub
2. Create a **Web Service** on [Render](https://render.com)
3. Set environment variables:
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://your-app.vercel.app`
4. Add a **Persistent Disk** mounted at `/opt/render/project/src/data` (1 GB free tier)
5. Build: `npm install` | Start: `npm start`

> **Why persistent disk?** SQLite files must survive deploys. Without it, data resets on every deploy.

### Frontend — Vercel

1. Push `frontend/` to GitHub
2. Import on [Vercel](https://vercel.com)
3. Add environment variable:
   - `REACT_APP_API_URL=https://your-backend.onrender.com/api`
4. Deploy — Vercel auto-detects Create React App

### Frontend — Netlify (alternative)

1. Build command: `npm run build`
2. Publish directory: `build`
3. Add redirect: `/* → /index.html (200)` in `_redirects`
4. Set `REACT_APP_API_URL` env variable

---

## ✅ Validation Rules

**Employee:**
- `id`: required, 2-20 uppercase alphanumeric/`_`/`-`, unique
- `name`: required, 2-100 characters
- `email`: required, valid email format, unique
- `department`: required

**Attendance:**
- `employee_id`: required, must exist in DB
- `date`: required, valid ISO date (YYYY-MM-DD)
- `status`: required, one of `Present | Absent | Half Day | Remote`

---

## 🔴 Error Handling

All API errors return structured JSON:

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "Must be a valid email address" }
  ]
}
```

HTTP status codes used: `200 201 400 404 409 500`

---

## ⚠️ Assumptions & Limitations

1. **Single admin user** — No authentication. Anyone with the URL has full access.
2. **SQLite** — Excellent for this scale; easily swapped for PostgreSQL for high concurrency.
3. **No file uploads** — Employee photos not supported.
4. **Timezones** — Dates stored/displayed as ISO strings; no timezone normalization.
5. **Render free tier** — Backend may spin down after 15 min of inactivity (cold start ~30s).
6. **No pagination** — Employee list rendered fully client-side; suitable for up to ~500 employees.

---

## 🎁 Bonus Features Implemented

- ✅ Filter attendance records by date, month, employee, and status
- ✅ Display total present + remote days per employee (in table + detail drawer)
- ✅ Dashboard summary with live counts, department chart, 7-day trend, activity feed

---

## 📄 License

MIT
