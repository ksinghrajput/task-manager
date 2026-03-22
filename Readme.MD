# Task Manager — Full Stack Project

A real-time project management platform built with Angular 17, Node.js, PostgreSQL and Redis.
Inspired by tools like Jira and Linear — built to demonstrate full-stack engineering depth.

> **Live Demo:** [https://hellokishan.in](https://hellokishan.in) &nbsp;|&nbsp; **API:** [https://api.hellokishan.in](https://api.hellokishan.in)

---

## Features

- **Kanban boards** — drag and drop tasks across columns (Angular CDK)
- **Real-time updates** — move a task, all teammates see it instantly (Socket.io WebSockets)
- **JWT authentication** — secure login, register, refresh token rotation
- **Role-based access** — Admin, Member, and Viewer roles with protected routes
- **File attachments** — upload files to tasks via AWS S3 presigned URLs
- **Email notifications** — task assigned and due date reminders via Bull queue + Nodemailer
- **Activity log** — full history of every action on a task
- **Full-text search** — search tasks across boards via PostgreSQL
- **Redis caching** — board data cached for fast loads
- **Fully responsive** — works on mobile, tablet, and desktop

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Angular 17 (Standalone) | UI framework |
| NgRx | State management |
| RxJS | Reactive data streams |
| Angular CDK | Drag and drop |
| Angular Material | UI components |
| Socket.io Client | Real-time WebSocket connection |
| TypeScript | Type safety |
| SCSS | Styling |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| Socket.io | WebSocket server for real-time events |
| PostgreSQL | Primary relational database |
| Redis | Caching + Bull job queues |
| Bull | Background job processing |
| Nodemailer | Email notifications |
| JWT | Authentication tokens |
| Bcrypt | Password hashing |
| AWS S3 | File attachment storage |

### DevOps
| Technology | Purpose |
|---|---|
| Docker + Docker Compose | Local development environment |
| GitHub Actions | CI/CD pipeline |
| AWS EC2 | Backend hosting |
| AWS RDS | Managed PostgreSQL |
| AWS S3 + CloudFront | Frontend hosting + CDN |

---

## Project Structure

```
task-manager/
├── frontend/                   # Angular 17 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/           # Guards, interceptors, services
│   │   │   ├── features/
│   │   │   │   ├── auth/       # Login, register
│   │   │   │   ├── boards/     # Board list, board detail
│   │   │   │   ├── tasks/      # Task detail, task form
│   │   │   │   └── dashboard/  # Overview dashboard
│   │   │   ├── shared/         # Reusable components, pipes
│   │   │   └── store/          # NgRx store — auth, boards, tasks
│   │   ├── environments/
│   │   └── assets/
│   ├── angular.json
│   └── package.json
│
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── controllers/        # Route handlers
│   │   ├── middleware/         # Auth, error handling, rate limiting
│   │   ├── routes/             # API route definitions
│   │   ├── services/           # Business logic
│   │   ├── db/
│   │   │   ├── init.sql        # Database schema
│   │   │   └── pool.ts         # PostgreSQL connection pool
│   │   ├── queues/             # Bull job queues
│   │   ├── sockets/            # Socket.io event handlers
│   │   └── index.ts            # Server entry point
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml          # PostgreSQL + Redis + Backend
└── README.md
```

---

## Getting Started

### Prerequisites

Make sure you have these installed:

- [Node.js 20+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Angular CLI](https://angular.io/cli) — `npm install -g @angular/cli`

### 1. Clone the repository

```bash
git clone https://github.com/ksinghrajput/task-manager.git
cd task-manager
```

### 2. Start the backend services (PostgreSQL + Redis + API)

```bash
docker-compose up
```

This starts:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- Node.js API on `localhost:3000`

Database tables are created automatically from `backend/src/db/init.sql`.

### 3. Start the Angular frontend

```bash
cd frontend
npm install
ng serve
```

Open [http://localhost:4200](http://localhost:4200)

### 4. Environment variables

Create `backend/.env` for local development outside Docker:

```env
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=taskuser
DB_PASSWORD=taskpass123
DB_NAME=taskmanager

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AWS S3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your_bucket_name

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:4200
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Invalidate refresh token |

### Boards
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/boards` | Get all boards for user |
| POST | `/api/boards` | Create new board |
| GET | `/api/boards/:id` | Get board with tasks |
| PUT | `/api/boards/:id` | Update board |
| DELETE | `/api/boards/:id` | Delete board |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks?boardId=:id` | Get tasks for a board |
| POST | `/api/tasks` | Create new task |
| GET | `/api/tasks/:id` | Get task detail |
| PUT | `/api/tasks/:id` | Update task |
| PATCH | `/api/tasks/:id/status` | Move task (kanban) |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/:id/attachments` | Upload file to task |

### WebSocket Events
| Event | Direction | Description |
|---|---|---|
| `task:moved` | Server → Client | Task status changed |
| `task:assigned` | Server → Client | Task assigned to user |
| `task:created` | Server → Client | New task added to board |
| `task:deleted` | Server → Client | Task removed from board |
| `board:join` | Client → Server | Subscribe to board updates |
| `board:leave` | Client → Server | Unsubscribe from board |

---

## Database Schema

```
users          boards         tasks
──────         ──────         ──────
id (PK)        id (PK)        id (PK)
name           name           title
email          description    description
password       owner_id (FK)  status
role           created_at     priority
created_at                    board_id (FK)
                              assignee_id (FK)
                              due_date
                              created_at
```

---

## Screenshots

> Coming soon — add screenshots of your running app here before sharing with recruiters

---

## Deployment

### Frontend — AWS S3 + CloudFront

```bash
cd frontend
ng build --configuration production
aws s3 sync dist/task-manager s3://your-bucket-name --delete
```

### Backend — AWS EC2

```bash
ssh ec2-user@your-ec2-ip
git pull origin main
cd backend && npm install
pm2 restart task-manager-api
```

### CI/CD — GitHub Actions

Push to `main` branch automatically:
1. Runs tests
2. Builds Angular app
3. Deploys frontend to S3
4. SSHs into EC2 and restarts backend

See `.github/workflows/deploy.yml` for the full pipeline.

---

## Author

**Kishan Singh**
Senior Full Stack Engineer — Angular · React · Node.js

- LinkedIn: [linkedin.com/in/kishan-singh-rajput](https://linkedin.com/in/kishan-singh-rajput)
- GitHub: [github.com/ksinghrajput](https://github.com/ksinghrajput)
- Email: kishansingh26195@gmail.com

---

## License

MIT License — feel free to use this project as a reference or starting point.