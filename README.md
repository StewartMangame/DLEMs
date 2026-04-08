# Smart Loan System (NestJS + React)

## Overview
This repository contains the full-stack Smart Loan Eligibility and Loan Monitoring System.
The frontend is a Next.js (React) application, and the backend is a NestJS project using PostgreSQL and Redis (via Bull for job queuing).

## Prerequisites
- Docker and Docker Compose
- Node.js (v20+ recommended)

## Quick Start (Dockerized)
The easiest way to run the entire stack (Frontend, Backend, PostgreSQL, Redis) is via Docker Compose.

```bash
docker-compose up --build
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## Application Architecture
- **Backend (NestJS)**: TypeORM (Postgres), JWT Authentication, Bull (Redis) for queues.
- **Frontend (Next.js)**: React 19 Frontend consuming the NestJS API.
- **Database (PostgreSQL)**: Stores user and financial/loan data.
- **Cache / Queue (Redis)**: Used for scheduling reminders 3 and 1 days before deduction dates.

## Module Descriptions
1. **Auth**: User registration, login, and JWT-based authentication.
2. **Profile**: Financial profile (net salary, employer, salary institution).
3. **Loan**: Loan recording and calculation.
4. **Institution**: Endpoints for Institutions (Bank, Microfinance) and Super Admin.
5. **Reminders**: Bull queues to trigger SMS/Email notifications.

## Local Development (Without Docker)

### Backend Setup
1. `cd backend`
2. `npm install`
3. Make sure Postgres and Redis are running locally. You can use docker for just the DB services: `docker-compose up postgres redis -d`
4. Update `.env` file in the backend to point to your local DB if needed.
5. Create `.env` file with `DATABASE_URL`, `JWT_SECRET`, `REDIS_HOST`, `REDIS_PORT`.
6. Run `npm run start:dev`.

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. Make sure `.env` file contains `NEXT_PUBLIC_API_URL=http://localhost:3001`
4. Run `npm run dev`.
