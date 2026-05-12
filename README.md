# Provider Reviews Mini-Service (SyncRa)

## Overview

Next.js App Router app for a small **provider reviews** experience: patients can submit and read reviews for a provider. This repository is being built in phases; later work will add DynamoDB, API routes, and the full reviews UI.

## Tech stack

- Next.js (App Router), **TypeScript strict**, React
- Tailwind CSS
- Zod (for validation in later phases)
- AWS DynamoDB via DocumentClient (later phases; not wired in this phase)

## Local setup

1. Install dependencies: `npm install`
2. Run the dev server: `npm run dev`
3. Open [http://localhost:3000](http://localhost:3000)

Other scripts: `npm run build`, `npm run start`, `npm run lint`, `npm run typecheck`.

## Local Docker

Build the production image:

```bash
docker build -t provider-reviews-mini-service .
```

Run the production Next.js server:

```bash
docker run --rm -p 3000:3000 \
  -e AWS_REGION=us-east-1 \
  -e TABLE_NAME=provider-reviews \
  provider-reviews-mini-service
```

Open [http://localhost:3000](http://localhost:3000). The container expects AWS
credentials to be provided by the runtime environment when it needs to access
DynamoDB.

## Environment variables

Copy `.env.example` to `.env.local` and fill in values when you connect AWS (later phases).

| Variable     | Description                          |
|-------------|--------------------------------------|
| `AWS_REGION`| AWS region for DynamoDB              |
| `TABLE_NAME`| Single-table DynamoDB table name     |

## Deployment

Not documented yet. Plan: build with `npm run build`, run with `npm run start`, and configure `AWS_REGION` and `TABLE_NAME` in the hosting environment with an IAM role that allows DynamoDB access required by the app (details in a later phase).

## Improvements with more time

- Full reviews list and create flow with `{ data, error }` API envelope
- Single-table DynamoDB design with Query-by-`pk` only (no Scan)
- Tests and CI, observability, and stricter production hardening

## Hours spent

_(Fill in after you finish the take-home.)_
