# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack task management application with Kanban boards, real-time updates, JWT auth, and file uploads. **Currently in scaffold phase** — Angular frontend is bootstrapped, backend has only `package.json` (no source files yet).

## Architecture

- **Frontend:** Angular 20 (standalone components, signals, lazy-loaded routes, `@angular/build` builder)
- **Backend:** Node.js + Express 5 + TypeScript + Socket.io under `backend/src/`
- **Database:** PostgreSQL 15 (via Docker), schema initialized via `backend/src/db/init.sql`
- **Cache/Sessions:** Redis (via Docker)
- **Frontend ↔ Backend:** REST API at `http://localhost:3000/api/*`, WebSocket via Socket.io

## Frontend Structure

```
frontend/src/app/
  core/
    models/          # user, board, column, task TypeScript interfaces
    services/        # auth, board, task, column, user HTTP services
    interceptors/    # auth.interceptor (attaches Bearer token)
    guards/          # authGuard, guestGuard
  layout/
    auth-layout/     # Two-pane layout for login/register
    main-layout/     # Sidebar + header shell for authenticated pages
  shared/
    components/
      header/        # Top bar with user greeting
      sidebar/       # Dark nav sidebar with brand, links, user footer
  features/
    auth/login/      # Login form (reactive forms, signal-based state)
    auth/register/   # Registration form
    dashboard/       # Stats cards + recent boards grid
    boards/
      board-list/    # Boards grid with create-board modal
      board-detail/  # Kanban board view
        components/
          kanban-column/  # Column with drag-and-drop drop zone
          task-card/      # Compact task card with priority/assignee
          task-modal/     # Full task detail + comments + inline editing
```

## Backend Structure

```
backend/src/
  db/
    pool.ts      # pg Pool with query helper
    init.sql     # Full schema: users, boards, board_members, columns, tasks, comments, activity_logs, refresh_tokens
  middleware/
    auth.ts      # JWT Bearer authenticate() + requireRole()
    error.ts     # Global error handler + 404 handler
  routes/
    auth.ts      # register, login, refresh, logout, /me
    boards.ts    # CRUD + /members + /activity
    tasks.ts     # CRUD + comments
    columns.ts   # CRUD
    users.ts     # list, profile update, password change
  socket/
    index.ts     # Socket.io: join:board, task:created/updated/deleted/moved
  types/
    index.ts     # Shared TypeScript interfaces + AuthRequest
  index.ts       # Express app + HTTP server entry point
```

## Development Commands

### Frontend (`frontend/`)
```bash
npm start          # Dev server at localhost:4200
npm run build      # Production build
npm run watch      # Build in watch mode
npm test           # Run unit tests (Karma/Jasmine in Chrome)
ng test --include="**/some.spec.ts"   # Run a single test file
```

### Backend (`backend/`)
```bash
npm run dev        # Dev server (to be configured with nodemon/ts-node)
```

### Full Stack (Docker)
```bash
docker compose up          # Start postgres + redis + backend
docker compose up -d       # Detached mode
docker compose down        # Stop all services
```
PostgreSQL is exposed on `localhost:5432`, Redis on `localhost:6379`, backend on `localhost:3000`.

## Key Configuration

**Backend environment** (set in `docker-compose.yml`, needs `.env` for local dev without Docker):
- `DB_HOST/PORT/USER/PASSWORD/NAME`: taskuser / taskpass123 / taskmanager
- `JWT_SECRET` / `JWT_REFRESH_SECRET`: change from placeholder before any real use
- `CLIENT_URL`: `http://localhost:4200` (used for CORS)
- `JWT_EXPIRES_IN`: 15m, `JWT_REFRESH_EXPIRES_IN`: 7d

**Frontend TypeScript:** strict mode enabled (`tsconfig.json`), Angular strict templates + strict DI.

## Notes

- All Angular components are standalone (no NgModules). Import `FormsModule` alongside `ReactiveFormsModule` in any component that uses `[(ngModel)]`.
- Angular signals (`signal()`, `computed()`) are used for all local state instead of `BehaviorSubject`.
- The `authInterceptor` reads `accessToken` from `localStorage` and attaches it to every request.
- Backend JWT `expiresIn` must be cast as `jwt.SignOptions` due to strict typing in `@types/jsonwebtoken`.
- Angular project prefix is `app`; production bundle budget: initial 500 kB warning / 1 MB error.
