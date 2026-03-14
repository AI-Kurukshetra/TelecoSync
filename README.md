# TelecoSync

TelecoSync is a multi-tenant digital BSS/OSS platform for telecom operators and network infrastructure teams. It is built for carrier workflows across customer management, order-to-cash, billing, revenue assurance, inventory, provisioning, faults, analytics, integrations, and notifications.

## Product Scope

TelecoSync is positioned as a next-generation telecom operations platform for mid-to-large carriers.

Main functional areas:
- Digital BSS: customers, products, orders, billing, invoices, revenue
- Digital OSS: inventory, service provisioning, faults, performance, SLA
- Integration framework: API registry, connectors, webhooks, event log
- Control and governance: tenants, roles, users, audit, workflows
- Customer self-service: customer signup, dashboard, orders, billing, documents

## Tech Stack

- Next.js 14 App Router
- TypeScript
- Supabase Auth, Postgres, Storage, Realtime, Edge Functions
- Tailwind CSS
- TanStack Query
- React Hook Form
- Zod
- Recharts
- Turborepo + pnpm

## Monorepo Layout

```text
telecosync/
├── apps/web                 # Next.js web app
├── packages/database        # SQL migrations, RLS, SQL helpers, DB types
├── packages/shared          # Shared types and constants
├── packages/config          # Shared lint/typescript/tailwind config
├── supabase/functions       # Edge functions
├── scripts                  # Load test and profiling helpers
└── .github/workflows        # CI/CD
```

## Current Roles

- `admin`
  Can manage platform business workflows such as customers, products, orders, billing, invoices, and related admin capabilities.
- `inventory_manager`
  Focused on operational workflows such as inventory, products, orders, billing, and alerts.
- `customer`
  Restricted to customer-facing pages such as dashboard, orders, billing, documents, and alerts.

## Authentication Routes

- Operator sign in: `/login`
- Customer sign in: `/login/customer`
- Operator registration: `/register`
- Customer creation: `/register/customer`
- Forgot password: `/forgot-password`
- Reset password: `/reset-password`

## Requirements

Before running the app locally, you need:

- Node.js 20+
- pnpm 8+
- A Supabase project
- Supabase CLI for migrations and edge functions

Optional but supported:

- Resend for email notifications
- Twilio for SMS notifications
- Upstash Redis for cache and rate limiting
- Upstash QStash for integration retry delivery

## Environment Setup

The app reads runtime values from `apps/web/.env.local`.

1. Copy the template:

```bash
cp .env.example apps/web/.env.local
```

2. Fill in the required values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Optional values enable extended platform features:

- `SUPABASE_DOCUMENTS_BUCKET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- `FAULT_ONCALL_EMAIL`
- `FAULT_ONCALL_SMS`
- `QSTASH_URL`
- `QSTASH_TOKEN`
- `QSTASH_RETRY_DELAY_SECONDS`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `INTERNAL_API_SECRET`
- `REVENUE_LEAKAGE_ALERT_THRESHOLD_PCT`
- `VERCEL_ANALYTICS_P95_MS`
- `VERCEL_ANALYTICS_P95_ENDPOINT`
- `VERCEL_ANALYTICS_TOKEN`

## Install

From the repo root:

```bash
pnpm install
```

## Start the App

From the repo root:

```bash
pnpm web:dev
```

The app runs at:

```text
http://localhost:3000
```

Production-style commands:

```bash
pnpm web:build
pnpm web:start
```

## Supabase Setup

1. Authenticate the CLI:

```bash
pnpm dlx supabase login
```

2. Link the project:

```bash
pnpm dlx supabase link --project-ref YOUR_PROJECT_REF
```

3. Push database migrations:

```bash
pnpm dlx supabase db push
```

4. Deploy edge functions:

```bash
pnpm supabase:functions:deploy
```

Or run the DB push and function deploy together:

```bash
pnpm supabase:deploy
```

## Database Coverage

The repo includes migrations for:

- auth and user profiles
- tenants and RBAC roles
- customers and accounts
- products and promotions
- orders and work orders
- billing, payments, usage, and rating rules
- network inventory and service instances
- trouble tickets and alarms
- workflows and workflow instances
- SLA and SLA violations
- audit logs and audit trigger
- revenue assurance, reconciliation, settlement, reports
- integrations, webhooks, deliveries, connector executions, event log
- notifications, documents, contracts

## Edge Functions

Supabase Edge Functions included in this repo:

- `billing-processor`
- `notification-sender`
- `fault-detector`
- `workflow-engine`
- `revenue-assurance-processor`
- `integration-dispatcher`

## Development Commands

Repo-level:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm type-check
pnpm format
```

Web app only:

```bash
pnpm web:dev
pnpm web:build
pnpm web:start
```

Load and profiling helpers:

```bash
pnpm load:smoke
pnpm load:read
pnpm profile:web
```

## Notes on Data Sync

Accounts created through the app are written to Supabase-backed records.

- Operator registration creates tenant-scoped auth and profile records
- Customer registration creates `customers`, `accounts`, `auth.users`, and `user_profiles`
- Session and access control are resolved from Supabase Auth plus tenant role/profile data

If a user is created manually in Supabase Auth without matching app tables, the app will not behave correctly for that account.

## Access Model

- Route access is role-based
- Customer users do not get tenant-wide customer or inventory visibility
- Admin customer listing is filtered to registered customer accounts
- Customer-facing pages are scoped to the signed-in customer record

## CI/CD

GitHub Actions are included for:

- lint and type-check
- committed env-file blocking
- basic hardcoded-secret scanning
- production deployment flow for Supabase migrations, edge functions, and Vercel

## Deployment

Recommended deployment target:

- Web app: Vercel
- Database/Auth/Storage/Functions: Supabase

Typical production flow:

1. Configure Supabase project and secrets
2. Push migrations
3. Deploy edge functions
4. Add environment variables in Vercel
5. Deploy the Next.js app from `apps/web`

## Important Files

- [.env.example](/Users/apple/Workspace/TelecoSync/.env.example)
- [package.json](/Users/apple/Workspace/TelecoSync/package.json)
- [apps/web/package.json](/Users/apple/Workspace/TelecoSync/apps/web/package.json)
- [packages/database/migrations/001_init_auth.sql](/Users/apple/Workspace/TelecoSync/packages/database/migrations/001_init_auth.sql)
- [supabase/functions/integration-dispatcher/index.ts](/Users/apple/Workspace/TelecoSync/supabase/functions/integration-dispatcher/index.ts)

## Verification

Type-check the web app with:

```bash
pnpm --filter web type-check
```
