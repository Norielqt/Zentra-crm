# Zentra CRM

A multi-tenant SaaS CRM system built with **Laravel 10** (API) + **React 18** (Vite frontend). Designed for small teams to manage their entire sales pipeline — from first contact to closed deal.

---

## Features

### Core CRM
- **Multi-tenant** — every company has fully isolated data via `company_id` scoping
- **Authentication** — Register (creates company + admin user) / Login with Laravel Sanctum token auth
- **Leads Pipeline** — Kanban drag-and-drop board with 5 stages: New Lead → Contacted → Qualified → Proposal → Closed
- **Lead → Client Conversion** — one-click promotion of a qualified lead to a full client record
- **Client Management** — full profile with linked notes, tasks, files, and activity history
- **Task Management** — create, assign to team members, filter by status (Todo / In Progress / Done)
- **Activity Log** — every create, update, convert, and system action is auto-logged with user + timestamp
- **File Uploads** — attach and download files scoped to leads or clients with authenticated download

### Automation Engine
- **Rule-based Automations** — configure trigger → action chains (e.g. "When a lead is created, create a follow-up task")
- **Supported Triggers** — `lead_created`, `lead_status_changed`, `client_created`, `task_overdue`
- **Supported Actions** — `create_task`, `log_note`, `update_lead_status`
- **Scheduled Jobs** — `ScanOverdueTasks` (07:00) and `ScanIdleLeads` (07:05) run daily via Laravel Scheduler
- **System Activity Logs** — automation-triggered actions are logged as system entries (no user attribution needed)

### AI Assistant (Dashboard)
- **Smart Recommendations** — rule-based engine analyses live CRM data and surfaces prioritised insights
- **9 Insight Types** — overdue tasks (urgent), tasks due today, proposal leads, new leads with no follow-up, stale leads (5+ days no activity), clients with no tasks, conversion rate warning/success, tasks completed this week, all-clear state
- **Colour-coded Cards** — urgent (red), warning (amber), action (purple), info (blue), success (green)
- **Refresh on Demand** — refresh button re-fetches insights without reloading the page

### Dashboard
- Stats overview (total leads, clients, tasks pending, tasks completed)
- Pipeline progress bars per stage with % share
- Recent activity feed
- AI Assistant panel (full-width, above pipeline)

### Design
- Production-quality UI with `#003148` brand colour system
- 70/30 split auth pages with hero image, floating animation, trust bar
- Stat cards with coloured top-border accents
- Kanban columns with stage-coloured top borders
- Segmented filter tabs, table avatar initials, activity timeline dots

---

## Project Structure
```
Zentra CRM/
├── backend/    ← Laravel 10 REST API
│   ├── app/Http/Controllers/
│   ├── app/Models/
│   ├── app/Services/        ← AutomationService, ActivityService
│   ├── app/Console/Commands/ ← ScanOverdueTasks, ScanIdleLeads
│   └── database/migrations/
└── frontend/   ← React 18 + Vite SPA
    └── src/
        ├── pages/           ← Dashboard, Leads, Clients, Tasks, Automations
        ├── components/      ← AppLayout, shared UI
        ├── api/             ← Axios instance with Bearer interceptor
        └── context/         ← AuthContext
```

---

## Quick Start

### Backend (Laravel)

**Requirements:** PHP 8.1+, Composer, MySQL

```bash
cd backend
cp .env.example .env
# Edit .env — set DB_DATABASE, DB_USERNAME, DB_PASSWORD
composer install
php artisan key:generate
php artisan migrate
php artisan serve              # http://localhost:8000
```

To run scheduled automations locally:
```bash
php artisan schedule:work
```

### Frontend (React)

```bash
cd frontend
npm install
npm run dev                    # http://localhost:5173
```

---

## Database Setup

Create a MySQL database named `zentra_crm`, then update `backend/.env`:

```env
DB_DATABASE=zentra_crm
DB_USERNAME=root
DB_PASSWORD=yourpassword
```

Run migrations:
```bash
cd backend && php artisan migrate
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register (creates company + admin user) |
| POST | `/api/login` | Login → returns Bearer token |
| POST | `/api/logout` | Logout |
| GET | `/api/me` | Current user + company |
| GET | `/api/users` | List users in the same company |
| GET | `/api/dashboard` | Stats overview |
| GET | `/api/insights` | AI Assistant insights |
| GET/POST | `/api/leads` | List / Create leads |
| GET/PUT/DELETE | `/api/leads/{id}` | Lead detail |
| POST | `/api/leads/{id}/convert` | Convert lead to client |
| GET/POST | `/api/clients` | List / Create clients |
| GET/PUT/DELETE | `/api/clients/{id}` | Client detail |
| GET/POST | `/api/tasks` | List / Create tasks |
| GET/PUT/DELETE | `/api/tasks/{id}` | Task detail |
| GET | `/api/activities` | Activity log |
| GET/POST | `/api/files` | File list / Upload |
| DELETE | `/api/files/{id}` | Delete file |
| GET | `/api/files/{id}/download` | Authenticated file download |
| GET/POST | `/api/automations` | List / Create automations |
| PUT/DELETE | `/api/automations/{id}` | Update / Delete automation |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Laravel 10, PHP 8.1+ |
| Auth | Laravel Sanctum (token-based) |
| Frontend | React 18, Vite |
| Routing | React Router v6 |
| HTTP | Axios (Bearer interceptor) |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Icons | Lucide React |
| Database | MySQL |
| Scheduler | Laravel Task Scheduling (Artisan commands) |
