# 🏫 Montessori Nexus (Ceiba Roots)

> **All-in-One Multi-Tenant Operating System & Digital Management Platform for Montessori Learning Communities.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-5.2-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.9-2D3748.svg)](https://www.prisma.io/)
[![BullMQ](https://img.shields.io/badge/BullMQ-6.1-red.svg)](https://docs.bullmq.io/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed.svg)](https://www.docker.com/)

---

## 📖 Overview

**Montessori Nexus** is an enterprise-grade, multi-tenant school operating system designed specifically for the unique educational, administrative, and developmental workflows of Montessori environments (*Nido, Comunidad Infantil, Casa de Niños, Taller I & II*).

The platform seamlessly unites public-facing school websites, visual drag-and-drop landing builders, digital admissions and KYC pipelines, curriculum progress tracking, tutor portals, billing & finance management, and background worker queues in a scalable architecture.

---

## ✨ Core Features & Modules

### 🌐 1. Multi-Tenant School Web Builder & Portal
- **Dynamic Domain & Subdomain Routing**: Multi-tenant resolution by host domain, school slug, or central platform mode.
- **Visual Site Builder**: In-browser page customizer with customizable hero layouts, gallery sections, teacher rosters, program descriptions, and contact widgets.
- **Web Traffic Analytics**: Native integration with Umami analytics for privacy-friendly telemetry and visitor stats.
- **Multilingual Support (i18n)**: Multi-language switching support powered by `i18next`.

### 📝 2. Admissions & Smart Application Pipeline
- **Customizable Form Builder**: Drag-and-drop dynamic form editor with field validations, multi-step sections, and conditional logic.
- **Applicant & Waitlist Management**: Stage-based applicant tracking system (ATS) with tokenized family admission links.
- **Automated Dossier Generation**: Dynamic PDF generation for application records, enrollment agreements, and parental consent forms.

### 🔍 3. Identity Verification (KYC) & Document Processing
- **Automated CURP Validation & Scraping**: Multi-mode Mexican CURP verification via official endpoints, NoCaptchaAI CAPTCHA solving, and headless Playwright / Hyperbrowser fallback.
- **OCR & Document Scanner**: Built-in computer vision and OCR engine for identity documents, passports, and utility bills.
- **Barcode & QR Scanner**: Real-time barcode reading via MediaPipe and ZXing.

### 🌿 4. Montessori Pedagogy & Classroom Management
- **Montessori Learning Environments**: Tailored for *Nido*, *Comunidad Infantil*, *Casa de Niños*, and *Taller I & II*.
- **Curriculum & Presentation Tracking**: Track Montessori curriculum areas (Practical Life, Sensorial, Language, Mathematics, Cultural Subjects).
- **Observation Journals**: Real-time daily guides' observations, milestones, and student development tracking.
- **Assessment Scales**: Configurable developmental evaluation rubrics.

### 👨‍👩‍👧 5. Student & Family (Tutor) Portal
- **Student Profile & Health Records**: Comprehensive medical history, dietary restrictions, and allergy alerts.
- **Attendance Tracking**: Fast daily check-in/check-out logs with automated monthly reports.
- **Tutor Portal**: Dedicated parent interface for viewing student milestones, financial statements, newsletters, and announcements.

### 💳 6. Financial Management & Billing
- **Tuition & Fee Schedules**: Recurring tuition, enrollment fees, sibling discounts, and payment terms.
- **Payment Reconciliation**: Record transactions, generate receipts, and track outstanding balances.
- **Modular SaaS Pricing Engine**: Tier-based pricing calculation for school environments and feature add-ons.

### ⚡ 7. Asynchronous Task Processing & Queues
- **BullMQ + Redis Job Queues**: High-performance background queues for heavy workloads (transactional email dispatching, OCR processing, and headless web scraping).
- **Bull Board Dashboard**: Real-time monitoring UI for queued, active, completed, and failed jobs.

### 🛡️ 8. SuperAdmin Command Center
- **Multi-School Management**: Global school creation, suspension, and license provisioning.
- **Infrastructure Health Checks**: Real-time monitoring of database, Redis, S3 storage, and worker processes.
- **Central Billing & Subscriptions**: Platform-wide usage tracking and subscription management.

---

## 🛠️ Architecture & Tech Stack

```mermaid
graph TD
    Client[React 18 SPA + Vite + Tailwind] -->|REST / API| Server[Express.js Backend]
    Server -->|ORM| Prisma[Prisma ORM]
    Prisma -->|Storage| DB[(PostgreSQL / SQLite)]
    Server -->|Enqueue Jobs| Redis[(Redis Server)]
    Worker[BullMQ Background Worker] -->|Consume Jobs| Redis
    Worker -->|OCR / Headless| Scraper[Playwright / Hyperbrowser]
    Worker -->|SMTP| Mail[Nodemailer Email Service]
    Server -->|File Assets| Storage[Local Disk / AWS S3]
```

### Frontend
- **Framework**: React 18 with TypeScript and Vite
- **UI Components**: Tailwind CSS, Radix UI primitives, shadcn/ui, Framer Motion
- **State & Data Fetching**: TanStack Query v5, Context API
- **Forms & Validation**: React Hook Form, Zod
- **Maps & Charts**: Leaflet, React Simple Maps, Recharts

### Backend & Core Services
- **Server**: Express.js 5 on Node.js (ES Modules)
- **Database & ORM**: Prisma ORM with PostgreSQL (`@prisma/adapter-pg`) and SQLite (`better-sqlite3`, `libsql`)
- **Queueing Engine**: BullMQ with Redis & Bull Board (`/admin/queues`)
- **Document & Media Processing**: PDF-Lib, Sharp, MediaPipe Vision, ZXing, PicoJS
- **Scraping & Automation**: Playwright (with Xvfb virtual display in Docker), Hyperbrowser SDK
- **Storage**: Multi-engine (Local filesystem & AWS S3)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or later
- **Package Manager**: `pnpm` (recommended) or `npm`
- **Database**: PostgreSQL database or local SQLite
- **Redis**: Redis 7+ instance (for queue management)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rrortega/montessorinexus.git
   cd montessorinexus
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   # Update your .env file with your database and service credentials
   ```

4. **Initialize the Database:**
   ```bash
   pnpm prisma:generate
   npx prisma db push
   ```

---

## 💻 Development Commands

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts Vite frontend development server (defaults to port `5173`) |
| `pnpm server` | Runs Express backend with auto-reload (`node --watch server/index.js`) |
| `pnpm worker` | Starts BullMQ background worker (`node server/worker.js`) |
| `pnpm site` | Concurrently runs both Express server and Vite frontend |
| `pnpm build` | Compiles production frontend bundle to `dist/` |
| `pnpm start` | Builds frontend and starts production Express web server |
| `pnpm test` | Runs test suite using Vitest |
| `pnpm test:watch` | Runs Vitest in interactive watch mode |
| `pnpm lint` | Runs ESLint across the codebase |
| `pnpm prisma:generate` | Generates Prisma Client types |

---

## ⚙️ Environment Configuration

Key environment variables in `.env`:

```ini
# Application & Port
PORT=3001
NODE_ENV=development

# Database Connection (PostgreSQL or SQLite)
DATABASE_URL="postgres://user:password@localhost:5432/montessorinexus?sslmode=disable"

# Queue & Background Processing (BullMQ + Redis)
USE_EMAIL_QUEUE=true
REDIS_URL="redis://127.0.0.1:6379"
WORKER_CONCURRENCY=5

# Container Service Role (options: all | web | worker)
SERVICE_ROLE=all

# Optional KYC & Captcha Services
NOCAPTCHA_API_KEY=your_nocaptcha_key
HYPERBROWSER_API_KEY=your_hyperbrowser_key

# Storage (Optional S3 Configuration)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=

# Public / Frontend Configurations (Vite)
VITE_CONTACT_PHONE="+52 998 350 2849"
VITE_CONTACT_EMAIL="admin@ceibamontessori.com"
VITE_SCHOOL_ADDRESS="Cancun, Quintana Roo, Mexico"
VITE_UMAMI_HOST="https://analytics.yourdomain.com"
VITE_UMAMI_SITE_ID="your-umami-site-id"
```

---

## 🐳 Docker Deployment

The project includes a production-ready multi-stage [Dockerfile](file:///Users/mayo11/Develop/montessorinexus/Dockerfile) and [docker-compose.yml](file:///Users/mayo11/Develop/montessorinexus/docker-compose.yml).

### Quick Start with Docker Compose

```bash
# Start Web Server, Worker, and Redis in background
pnpm docker:up

# View container logs
docker compose logs -f

# Stop containers
pnpm docker:down
```

### Microservice Roles (`SERVICE_ROLE`)

The container entrypoint supports flexible scaling architectures:
- **`SERVICE_ROLE=all`** *(Default)*: Runs both Express API web server and BullMQ background workers with Xvfb in a single container.
- **`SERVICE_ROLE=web`**: Runs only the HTTP Express server and static asset delivery.
- **`SERVICE_ROLE=worker`**: Runs only the BullMQ background workers with headless browser support.

---

## 📂 Project Structure

```text
montessorinexus/
├── server/                   # Express backend & background worker
│   ├── index.js              # Express API endpoints & middleware
│   ├── worker.js             # BullMQ background job processor
│   ├── curp-scraper.js       # CURP verification & scraping engine
│   ├── document-ocr-service.js # Document OCR & image analysis
│   ├── email-service.js      # Nodemailer transactional email delivery
│   ├── email-queue.js        # BullMQ email queue producer
│   └── storage-service.js    # Multi-engine (Local / S3) file management
├── src/                      # React frontend application
│   ├── components/           # UI components, widgets, and dialogs
│   ├── context/              # Auth, Settings, and ConfirmDialog providers
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities, formatters, and API helpers
│   ├── locales/              # i18n translation dictionaries
│   └── pages/                # Application routes
│       ├── admin/            # School management & SuperAdmin portals
│       └── public/           # Admissions portal, landing page, forms
├── prisma/                   # Prisma database schemas & migrations
├── public/                   # Static assets, gallery, and document storage
├── Dockerfile                # Multi-stage production container
└── docker-compose.yml        # Multi-container orchestration (App + Redis)
```

---

## 🔒 Security & Best Practices

- **Role-Based Access Control (RBAC)**: Distinct permissions for SuperAdmins, School Directors, Guides (Teachers), and Parents/Tutors.
- **Ephemeral & Tokenized Access**: Secure tokenized URLs for public admission forms without requiring initial credentials.
- **Sanitized Uploads & Storage**: Mime-type verification and localized/S3 sandboxed file storage.

---

## 📄 License

Private & Proprietary. All rights reserved by **Montessori Nexus** / **Ceiba Roots**.
