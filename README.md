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

```text
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
│   │   ├── layouts/             # DashboardLayout, Sidebar, Navbar
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