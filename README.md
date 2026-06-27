# HackForge — AI-Enabled Hackathon Management Platform

A full-stack, AI-powered hackathon management platform built with the MERN stack. HackForge automates the entire event lifecycle — from intelligent participant registration to real-time bias detection and automated result publishing.

---

## Feature

**Intelligent Registration**
- OTP email verification via Nodemailer before account creation
- Real-time duplicate detection using Levenshtein distance scoring
- Automated skill extraction and experience classification
- University validation against a curated institution list
- Fraud/duplicate participant flagging with AI confidence scores

**Smart Reviewer Assignment**
- Multi-objective optimization matching reviewer expertise to project domains
- TF-IDF cosine similarity for expertise matching
- Workload balancing across reviewers
- Conflict-of-interest detection

**Real-Time Bias Detection**
- Z-score statistical outlier detection per reviewer
- Technology stack bias monitoring
- Demographic scoring pattern analysis
- Unresolved bias alert dashboard with admin resolution workflow

**AI-Powered Evaluation**
- Configurable multi-criteria scoring rubric per hackathon
- Per-criteria weighted scoring with automatic total calculation
- AI feedback generation via Google Gemini (with deterministic fallback)
- Results normalization and ranking

**Participant Experience**
- Self-service team creation and join-by-invite-code
- Project submission with GitHub + demo URL
- Real-time general chat (Socket.IO)
- Announcement feed (pinned, role-targeted)
- Evaluation appeal system with admin review
- Star-rating feedback portal with anonymous option

**Organizer Dashboard**
- Live system activity feed via WebSocket
- Real-time stat cards — registrations, projects, evaluations, active bias alerts
- Registration log with AI processing metadata
- Participant management — role change, suspend/activate
- Full project submission viewer with disqualify capability
- Result publishing with public participant result reveal

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6, Recharts, Socket.IO Client |
| Backend | Node.js, Express, Socket.IO |
| Database | MongoDB + Mongoose |
| Auth | JWT (7-day), bcryptjs, token blacklist |
| AI/ML | Google Gemini API (`@google/generative-ai`) |
| Email | Nodemailer (SMTP) |
| Security | Helmet, express-rate-limit, express-mongo-sanitize, XSS-clean |
| Docker | Docker + Docker Compose v3.8 |

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- MongoDB 6+ (local) or a MongoDB Atlas connection string
- npm

### 1. Clone and install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

```bash
cp .env.example backend/.env
```

Edit `backend/.env` — at minimum set `MONGO_URI` and `JWT_SECRET`. For OTP emails, configure SMTP credentials.

### 3. Seed the database with demo data

```bash
cd backend && npm run seed
```

### 4. Start development servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm run dev
```

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin / Organizer | admin@hackforge.dev | Admin@123 |
| Admin | rahul@hackforge.dev | Admin@123 |
| Reviewer | arjun.reviewer@hackgpt.dev | Review@123 |
| Reviewer | emily.reviewer@hackgpt.dev | Review@123 |
| Participant | aarav@student.iitd.ac.in | Part@123 |
| Participant | zara@bits.ac.in | Part@123 |

> **Login portals are separate:**
> - Participant
> - Reviewer
> - Organizer
> - Admin

---

## Docker Deployment

### Build and run all services

```bash
docker compose up --build -d
```

This starts:
- `hackforge-mongo` — MongoDB 7
- `hackforge-backend` — Node.js API on port 5000
- `hackforge-seed` — One-shot seed (runs once, then exits)
- `hackforge-frontend` — Static React build on port 3000

### Seed the database (Docker)

The `seed` service runs automatically on first `docker compose up`. To re-seed:

```bash
docker compose run --rm seed
```

### Stop all services

```bash
docker compose down
```

### Save Docker image to zip

```bash
docker save hackforge-backend hackforge-frontend | gzip > hackforge-images.tar.gz
```

---

## Project Structure

```
hackforge/
├── backend/
│   ├── src/
│   │   ├── app.js                 — Express entry point
│   │   ├── controllers/           — Route handlers
│   │   ├── middleware/            — Auth, rate-limit, error handlers
│   │   ├── models/                — Mongoose schemas
│   │   ├── routes/                — Express routers
│   │   ├── services/              — AI, email, university validation
│   │   └── seed/seed.js           — Demo data seed script
│   ├── Dockerfile
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/             — Organizer dashboard pages
│   │   │   ├── reviewer/          — Reviewer evaluation pages
│   │   │   └── participant/       — Participant portal pages
│   │   ├── components/            — Sidebar, Toast
│   │   ├── context/               — AuthContext
│   │   ├── utils/                 — formatters, toast
│   │   └── api.js                 — Axios-like fetch wrapper
│   ├── Dockerfile
│   └── vite.config.js
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Security

- Admin and participant login endpoints are completely separate (`/api/auth/admin/login` vs `/api/auth/login`)
- Admin login rejects non-admin accounts; participant login rejects admin accounts
- All protected routes require a valid JWT (`Authorization: Bearer <token>`)
- Reviewer access to projects is restricted to assigned projects only (`assertAssignment` middleware)
- Participant access to projects is restricted to their own team's project only (`assertTeamAccess`)
- Route-level `requireRole('admin')` guards all sensitive organizer endpoints
- Tokens are blacklisted on logout (in-memory set)
- Account lockout after 5 failed login attempts (30-minute lockout)
- Helmet, mongo-sanitize, xss-clean, and rate-limiting on all API routes

---

## AI Features

| Feature | Implementation |
|---|---|
| Duplicate detection | Levenshtein distance on name + Jaro-Winkler on email |
| Skill extraction | Keyword matching against curated tech taxonomy |
| Experience classification | Rule-based on extracted skill depth + self-reported level |
| Reviewer assignment | TF-IDF cosine similarity + workload scoring + conflict detection |
| Bias detection | Z-score per reviewer vs. group mean, tech-stack and demographic pattern analysis |
| AI feedback generation | Google Gemini `gemini-1.5-flash` with structured prompt, deterministic fallback |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `PORT` | No | Backend port (default: 5000) |
| `NODE_ENV` | No | `development` or `production` |
| `SMTP_HOST` | For OTP | SMTP server host |
| `SMTP_PORT` | For OTP | SMTP server port |
| `SMTP_USER` | For OTP | SMTP username / email |
| `SMTP_PASS` | For OTP | SMTP password / app password |
| `SMTP_FROM` | For OTP | Sender display name + email |
| `GEMINI_API_KEY` | For AI | Google Gemini API key |
| `CLIENT_ORIGIN` | No | Frontend URL for CORS (default: `http://localhost:3000`) |
