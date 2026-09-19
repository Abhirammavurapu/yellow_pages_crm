# Yellow Pages CRM — Enterprise Calling & Business Listing Platform

A production-ready, centralized CRM platform designed for large-scale Yellow Pages business directories, multi-tier telecalling operations, lead allocation, calling history, and business enrollment.

---

## 🌟 Key Features

1. **All-India & State-Wise Geographical Hierarchy**
   - Cascading geographic filtering: `State -> District -> City -> Category -> Status -> Assigned Caller`.
   - Comprehensive pre-loaded Indian states, districts, and major business hubs.

2. **Atomic Concurrency & Lead Locking**
   - Prevents duplicate calling collisions: When Agent A opens a lead, atomic MongoDB `findOneAndUpdate` acquires a calling lock.
   - If Agent B attempts to access or call the lead simultaneously, the server rejects the request with HTTP `423 Locked` and displays: *"This lead is currently being handled by [Agent Name] until [Time]"*.
   - Automatic lock expiration and client heartbeat refresh.

3. **Immutable History & Employee Resignation / Workload Transfer**
   - **Current Responsibility vs. Historical Records**: When an employee resigns or their workload is transferred, active ownership shifts to the target employee.
   - All past call histories, recorded notes, and activity timeline events remain permanently stamped with the original agent snapshot.
   - Complete `TransferHistory` audit trail.

4. **High-Performance Bulk Excel/CSV Import**
   - Multi-step import wizard supporting `.xlsx`, `.xls`, and `.csv`.
   - Automatic column mapping detection.
   - Normalizes Indian phone numbers (`+91`, `91`, `0`, and raw 10 digits).
   - Multi-tier duplicate detection: identifies internal file duplicates and matches against existing MongoDB leads in bulk.
   - Chunked `bulkWrite` insertions for processing large datasets without memory leaks.
   - Downloadable CSV reports of skipped duplicates and invalid records.

5. **Role-Based Access Control (RBAC)**
   - **SUPER_ADMIN**: Full system control, employee deactivation/resignation, audit logs, Indian-wide analytics.
   - **ADMIN**: Team management, lead distribution, reporting.
   - **HR_ADMIN**: Employee profiles, onboarding, joining dates.
   - **TEAM_LEAD**: Team queue monitoring, team lead reassignments, call metrics.
   - **TELECALLER**: Calling workspace, call timers, quick disposition buttons, follow-up scheduler.
   - **BDE**: Field and business development, payment collection, verified business enrollments.

6. **Payment Collection & Business Directory Listings**
   - Record membership fees and plans (`Silver`, `Gold`, `Platinum`, `Diamond`).
   - Automatically convert payment-ready leads into live Yellow Pages Directory listings with views and inquiries tracking.

---

## 🏗️ Architecture & Tech Stack

```
yellow-pages-crm/
├── backend/
│   ├── src/
│   │   ├── config/             # DB connection, constants, location dataset
│   │   ├── controllers/        # Express route controllers
│   │   ├── middleware/         # JWT auth, RBAC authorization, error handler
│   │   ├── models/             # Mongoose schemas (Employee, Team, Lead, CallHistory, FollowUp, etc.)
│   │   ├── routes/             # RESTful API routers
│   │   ├── services/           # LockService, DuplicateService, TransferService, ActivityService
│   │   ├── utils/              # Phone normalizer, structured logger, API responses
│   │   ├── seed/               # Database seed script
│   │   └── server.js           # Server bootstrap
│   ├── tests/                  # Node.js automated test runner
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI widgets, Modals, Badges, Tables
│   │   ├── context/            # AuthContext
│   │   ├── layouts/            # DashboardLayout, Sidebar, Navbar
│   │   ├── pages/              # Dashboard, Leads, Calling Session, Follow-ups, Import, Employees, etc.
│   │   ├── services/           # Axios API client
│   │   ├── App.jsx             # React router with RBAC guards
│   │   └── main.jsx
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── README.md
├── .env.example
└── .gitignore
```

### Technology Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Recharts, React Router v6, Axios
- **Backend**: Node.js, Express.js, Mongoose, JWT, bcryptjs, Multer, XLSX, Helmet, Morgan, Express Rate Limit
- **Database**: MongoDB (Local or MongoDB Atlas)

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** `>= 18.0.0`
- **MongoDB** running locally on port 27017 or a MongoDB Atlas URI

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```
Edit `.env` if using a custom MongoDB connection or port.

#### Seed Initial Database
Populates Super Admin, Admins, Team Leads, Telecallers, Teams, Sample Leads, Calls, and Follow-ups:
```bash
npm run seed
```

**Default Demo Credentials:**
- **Super Admin**: `admin@example.com` / `ChangeMe123!`
- **Admin**: `admin.rajesh@example.com` / `AdminPass123!`
- **HR Admin**: `hr.sunita@example.com` / `HrPass123!`
- **Team Lead**: `tl.priya@example.com` / `LeaderPass123!`
- **Telecaller**: `caller.anita@example.com` / `AgentPass123!`
- **BDE**: `bde.suresh@example.com` / `AgentPass123!`

> ⚠️ *Important: Change all demo passwords upon production deployment.*

#### Run Automated Tests
```bash
npm test
```

#### Start Backend Server
```bash
npm start
# or for hot reloading:
npm run dev
```
Backend API will listen on `http://localhost:5000`.

---

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Frontend development server will launch at `http://localhost:3000`.

To build for production:
```bash
npm run build
```

---

## 📡 REST API Overview

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile |
| `GET` | `/api/leads` | Scoped by Role | Paginated leads with multi-level filtering |
| `POST` | `/api/leads` | Authenticated | Create lead with duplicate phone detection |
| `POST` | `/api/leads/:id/lock` | Authenticated | Atomic concurrency lock for calling session |
| `POST` | `/api/leads/:id/unlock` | Authenticated | Release calling lock |
| `POST` | `/api/leads/bulk-assign` | Admin / TL | Bulk assign selected leads |
| `POST` | `/api/calls/lead/:id` | Authenticated | Record call duration, status & schedule follow-up |
| `GET` | `/api/followups` | Scoped by Role | Today, Overdue, and Upcoming follow-ups |
| `POST` | `/api/import/preview` | Admin | Upload & preview spreadsheet |
| `POST` | `/api/import/validate` | Admin | Duplicate detection & validation dry-run |
| `POST` | `/api/import/execute` | Admin | Batch insert leads with duplicate exclusion |
| `POST` | `/api/transfers/execute` | Super Admin | Transfer employee workload & preserve history |
| `GET` | `/api/dashboard/summary` | Authenticated | Role-scoped KPI metrics |
| `GET` | `/api/dashboard/charts` | Authenticated | Geographic & pipeline charts |
| `GET` | `/api/locations/states` | Public | Indian state & city hierarchy |

---

## 🔒 Security & Concurrency Rules

1. **Rule 1**: Only authorized users (`SUPER_ADMIN`, `ADMIN`, `TEAM_LEAD`) can assign or reassign leads.
2. **Rule 2**: Only `SUPER_ADMIN` can permanently deactivate or mark an employee as resigned.
3. **Rule 3**: Historical activities and calls are strictly immutable.
4. **Rule 4**: Reassigning a lead never alters historical caller snapshots.
5. **Rule 5**: A lead cannot be actively worked by two employees simultaneously.
6. **Rule 6**: Expired locks automatically release and become available.
7. **Rule 7**: Indian phone numbers are normalized (`+91`, `91`, leading `0`) to enforce duplicate detection.

---

### Quick 1-Command Docker Deployment (Full Stack)
Run the entire production stack (MongoDB 7, Express Backend, and Nginx SPA Frontend) with Docker Compose:
```bash
docker compose up --build -d
```
* **Frontend**: `http://localhost:3000`
* **Backend API**: `http://localhost:5000`
* **MongoDB**: `localhost:27017`

### Frontend (Vercel / Netlify / Cloudflare Pages)
1. Set `VITE_API_URL` environment variable to your deployed backend API URL (e.g. `https://api.yourcrm.com/api`).
2. Build command: `npm run build`
3. Publish directory: `dist`

### Backend (Render / Railway / AWS ECS / DigitalOcean)
1. Set environment variables:
   - `PORT=5000`
   - `MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/yellow_pages_crm?retryWrites=true&w=majority`
   - `JWT_SECRET=<strong_random_secret>`
   - `ADMIN_REGISTRATION_KEY=ADMIN2024`
   - `FRONTEND_URL=https://yourcrm.com`
2. Start command: `npm start`

---

## 🧪 Automated Testing

Run the full end-to-end and unit test suite (11/11 passing):
```bash
cd backend
npm test
```
* Tests covered: Health check, RBAC login, Concurrency locks, Hierarchy locations, Public user signup, Admin passkey registration, Lead queue auto-assignment, Duplicate phone prevention, Indian phone normalizer, and Resilient workload transfers.

