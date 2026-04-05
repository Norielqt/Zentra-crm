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

### Role-Based Permissions
- **Admin** — full access to all records, team management, and settings
- **Member** — scoped to only leads and tasks assigned to them
- Role enforced server-side on every controller action

### Deal Value & Revenue Forecast
- Attach a monetary deal value to any lead
- Dashboard pipeline shows revenue per stage and total pipeline value
- Forecast card projects estimated monthly close revenue from open deals

### Onboarding Checklist
- First-login "Getting Started" panel shown on the dashboard until all steps are complete
- 3-step guide: Add a lead → Create a task → Set up an automation
- Per-user dismissal stored in `localStorage` — each account tracks its own progress
- Progress bar and per-step action buttons navigate directly to the relevant page

### Dark Mode
- Full dark/light theme toggle in the sidebar footer (Sun/Moon icon)
- Theme persists to `localStorage` and respects `prefers-color-scheme` on first visit
- All components — sidebar, cards, modals, badges, checklist, search — adapt automatically

### Global Search (Ctrl/Cmd + K)
- Keyboard shortcut opens a full-screen search modal from anywhere in the app
- Searches across Leads, Clients, and Tasks simultaneously in real time (250 ms debounce)
- Results grouped by entity type; clicking a result navigates directly to that record
- Also accessible via the "Search…" button in the sidebar

### CSV Export
- **Export Leads** — downloads a CSV of all leads with ID, Name, Email, Phone, Source, Status, Deal Value, Assigned To, Created date
- **Export Clients** — downloads a CSV of all clients with ID, Name, Email, Phone, Notes, Created date
- One-click "Export CSV" button on both the Leads and Clients pages

### Dashboard
- Stats overview (total leads, clients, tasks pending, tasks completed)
- Pipeline progress bars per stage with % share and revenue per stage
- Total pipeline value summary
- Recent activity feed
- AI Assistant panel with colour-coded insight cards

### Design
- Production-quality UI with `#003148` brand colour system
- Light mode: white/surface card-based layout
- Dark mode: deep navy `#0F1923` base with `#4DB8E8` accent
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
        ├── pages/           ← Dashboard, Leads, Clients, Tasks, Automations, Team
        ├── components/      ← AppLayout, GlobalSearch, shared UI
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
| GET | `/api/onboarding` | Onboarding checklist status |
| GET | `/api/search?q=` | Global search across leads, clients, tasks |
| GET/POST | `/api/leads` | List / Create leads |
| GET/PUT/DELETE | `/api/leads/{id}` | Lead detail |
| GET | `/api/leads/export` | Export leads as CSV |
| POST | `/api/leads/{id}/convert` | Convert lead to client |
| GET/POST | `/api/clients` | List / Create clients |
| GET/PUT/DELETE | `/api/clients/{id}` | Client detail |
| GET | `/api/clients/export` | Export clients as CSV |
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
