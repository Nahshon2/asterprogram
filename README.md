# Doctor Identity Generator

A production-ready SaaS platform for generating **identity-preserved, professionally branded doctor visuals** for hospitals and clinics.

## Overview

This platform converts doctor information into premium, standardized doctor profile images and branded medical assets using:
- Manual doctor data entry
- Uploaded doctor photos
- Scraped doctor profile URLs

**Key Feature:** The system is an identity-preserving transformation engine — the same real doctor face is preserved across all generated templates.

---

## Architecture

```
/
├── frontend/          # Next.js 14 + Tailwind CSS + App Router
├── backend/           # Node.js + Express + Prisma
│   ├── src/
│   │   ├── routes/    # Auth, Doctors, Templates, Generations, Admin, Upload, Scraper
│   │   ├── services/  # AI Pipeline, Identity Service, Template Renderer, Scraper
│   │   └── lib/       # Prisma, Storage (S3), Logger
│   └── prisma/        # Database schema + seed data
├── docker-compose.yml # Full production stack
└── docker-compose.dev.yml # Dev infrastructure only
```

---

## Quick Start

### 1. Start infrastructure (Docker)

```bash
docker-compose -f docker-compose.dev.yml up -d
```

This starts PostgreSQL, Redis, and MinIO (S3-compatible storage).

### 2. Configure environment

```bash
cp .env.example backend/.env
cp .env.example frontend/.env.local
```

Edit `.env` files with your credentials. For local dev, defaults work with Docker.

### 3. Set up database

```bash
cd backend
npm install
npx prisma db push
npx ts-node prisma/seed.ts
```

### 4. Start backend

```bash
cd backend
npm run dev
# Runs on http://localhost:4000
```

### 5. Start frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

---

## Demo Credentials

| Role       | Email                     | Password     |
|------------|---------------------------|--------------|
| Admin      | admin@docidentity.com     | Admin@123!   |
| Demo User  | demo@hospital.com         | Demo@123!    |

---

## Features

### User Features
- **Login / Register** with JWT authentication
- **Dashboard** with stats and quick actions
- **Add Doctors** via 3 methods:
  - Manual form (name, specialization, bio, hospital, contact)
  - Photo upload (drag-and-drop, up to 10 photos)
  - URL scraping (hospital sites, LinkedIn, directories)
- **Identity Profile** — face features locked from primary image
- **Template Browser** — 5 professionally designed templates
- **Generate Visuals** — multi-step wizard with identity preview
- **Download Outputs** — PNG, JPG, PDF at 300 DPI
- **Generation History** — track all outputs with status polling

### Admin Features
- **Admin Dashboard** — platform-wide stats
- **User Management** — enable/disable, role assignment
- **Hospital Themes** — custom brand colors per hospital
- **System Settings** — rate limits, AI provider, feature flags

---

## Templates

| Template | Layout | Size | Formats |
|----------|--------|------|---------|
| Professional Profile Card | PROFILE_CARD | 800×600 | PNG, JPG |
| Hospital Website Banner | BANNER | 1400×500 | PNG, JPG |
| Medical Brochure Panel | BROCHURE | 595×842 (A4) | PNG, PDF |
| Presentation Slide | PRESENTATION_SLIDE | 1920×1080 | PNG |
| Social Media Post | SOCIAL_MEDIA | 1080×1080 | JPG, PNG |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Storage | AWS S3 / MinIO (S3-compatible) |
| Image Processing | Sharp |
| Web Scraping | Cheerio + fetch |
| Identity Analysis | Sharp (color/brightness analysis) |
| Queue | Bull + Redis |
| Auth | JWT + bcrypt |

---

## AI Pipeline

```
Input (form/upload/URL)
       ↓
Data Extraction & Scraping
       ↓
Identity Profile Lock (face region, color analysis, skin tone)
       ↓
Template Configuration Merge
       ↓
SVG Text Layer Rendering
       ↓
Composite Image Generation (Sharp)
       ↓
Multi-format Export (PNG/JPG/PDF)
       ↓
S3 Upload + CDN URL
```

> For production identity preservation with face detection, integrate:
> - **AWS Rekognition** (face detection + landmarks)
> - **Google Vision API** (face detection)
> - **face-api.js** (client-side face analysis)
> - **Replicate API** with IP-Adapter for identity-preserving image generation

---

## Environment Variables

See `.env.example` for the full list.

Key variables:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — JWT signing secret
- `AWS_*` — S3 storage credentials
- `REPLICATE_API_TOKEN` — For AI-powered generation (optional)
- `REDIS_URL` — For job queues
