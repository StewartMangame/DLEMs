# Smart Loan Eligibility and Repayment Tracking System

## Overview

This repository contains the full-stack DLEM prototype for borrowers in Malawi.
It helps users create a financial profile, compare loan eligibility across
banks, microfinance institutions, and SACCOs, record existing loans, and track
repayment progress.

## Stack

- Frontend: Next.js and React
- Backend: NestJS, TypeORM, JWT authentication, scheduled reminder checks
- Database: SQLite through TypeORM (`backend/loan_db.sqlite`)

The current prototype does not connect to live bank systems, CRB systems,
PostgreSQL, or Redis. Lending rules are maintained internally.

## Main Modules

1. Auth: customer registration, login, logout, and JWT cookies.
2. Profile: borrower financial profile with income, employment category,
   dependants, salary institution, and current monthly deductions.
3. Institutions: seeded Malawian lenders and internal eligibility criteria.
4. Eligibility: rule-based comparison and ranked top-five recommendations.
5. Loans: manual loan recording, monthly payment calculation, repayment
   schedule, remaining balance, and repayment progress.
6. Reminders: scheduled reminder records that are processed daily.
7. Admin panel: institution/content/admin management for maintaining internal
   data.

## Required Environment

Create or update `backend/.env` with:

```env
JWT_SECRET=change_this_customer_secret
ADMIN_JWT_SECRET=change_this_admin_secret
ADMIN_SEED_EMAIL=superadmin@dlem.mw
ADMIN_SEED_PASSWORD=ChangeThisAdminPassword123!
SQLITE_DB_PATH=loan_db.sqlite
TYPEORM_SYNC=true
PORT=3001
```

Do not use the sample secrets for production or public demos.

Create or update `frontend/.env` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Local Development

Install dependencies from the repository root:

```bash
npm install
```

Run both apps:

```bash
npm run dev:backend
npm run dev:frontend
```

Default URLs:

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api

## Docker

The Docker Compose setup runs only the frontend and backend because this
prototype uses SQLite inside the backend container.

```bash
docker-compose up --build
```

## Verification

Useful checks:

```bash
npm run build --workspace=backend
npm run lint --workspace=backend
npm run lint --workspace=frontend
npm test --workspace=backend -- --runInBand
```
