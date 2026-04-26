# Modular Admin Dashboard Starter

> Next.js 16 · shadcn/ui · Tailwind CSS v4 · Prisma · PostgreSQL · Auth · TypeScript

A production-ready, **fully modular** admin dashboard starter built for service businesses, internal operations, and customer-facing SaaS workflows. It starts as a clean dashboard shell, then scales into CRM, quotation, invoicing, portal, recurring billing, and messaging flows without coupling the shell to one business domain.

---

## Design Philosophy

This starter is built around one principle: **plug-and-play domain modules**.

```
Core Shell (always present)
  └── Dashboard layout, auth, navigation, theme, RBAC

Domain Modules (optional)
  ├── Clients & Team
  ├── Services & Service Types
  ├── Quotations
  ├── Projects
  ├── Invoices, Payments, Expenses
  ├── Customer Portal
  ├── Communications / WhatsApp
  └── Reports & Settings
```

Each module has three possible states:

| State      | What it means                                             |
| ---------- | --------------------------------------------------------- |
| `enabled`  | Route, nav item, and feature code are all active          |
| `disabled` | Code exists, but hidden from navigation (feature-flagged) |
| `removed`  | Permanently deleted from the codebase                     |

Use `scripts/cleanup.js` to transition modules between states.

---

## Tech Stack

| Layer           | Technology                           |
| --------------- | ------------------------------------ |
| Framework       | Next.js 16 (App Router)              |
| Language        | TypeScript 5.7 (strict)              |
| Styling         | Tailwind CSS v4                      |
| UI Components   | shadcn/ui (Radix primitives)         |
| Database        | PostgreSQL via Supabase              |
| ORM             | Prisma                               |
| Auth            | Auth (orgs, billing, RBAC)          |
| Data Fetching   | TanStack React Query v5              |
| Tables          | TanStack Table                       |
| Forms           | TanStack Form + Zod                  |
| State           | Zustand (UI state), nuqs (URL state) |
| Charts          | Recharts                             |
| Error Tracking  | Sentry (optional)                    |
| Package Manager | Bun (preferred)                      |

---

## Features (Core)

- 🧱 **Dashboard shell** — sidebar, header, page container, command bar, theme switcher
- 🔐 **Auth & multi-tenant** — Auth sign-in/up, workspace switcher, team management, billing
- 🎨 **Multi-theme system** — 10 themes, easy to add custom themes
- 🔒 **RBAC navigation** — client-side filtering by org / permission / role / plan / feature
- ℹ️ **Infobar component** — contextual help panel on any page
- 🛠️ **Builder CLI** — `scripts/cleanup.js` for enabling/disabling/removing modules

## Features (Agency / SaaS Modules)

- 🧾 **CRM + sales flow** — clients, quotations, projects, invoices, payments, expenses
- 📦 **Service catalog** — products/services with recurring plans and digital delivery metadata
- 🔁 **Recurring billing** — subscription-capable plans, client subscriptions, recurring invoice cron flow
- 💳 **Internal payment flow** — manual bank transfer, mock QRIS, payment proof upload, invoice state sync
- 👤 **Customer portal** — customers can review quotations, projects, invoices, subscriptions, and digital access
- 📄 **Document flow** — quotation/invoice print views, PDF endpoints, email and WhatsApp delivery actions
- 💬 **Communications inbox** — WhatsApp-ready inbox, attach thread to client, send quotation/invoice via channel
- 📊 **Operations overview** — agency KPIs, pipeline, outstanding invoices, recent payments, project status

---

## Project Structure

```
src/
├── app/dashboard/          # Internal app routes
│   ├── overview/           # KPI overview
│   ├── clients/            # CRM
│   ├── product/            # Services / products
│   ├── categories/         # Service types
│   ├── quotations/         # Quotations
│   ├── projects/           # Projects
│   ├── invoices/           # Invoices
│   ├── payments/           # Payments
│   ├── expenses/           # Expenses
│   ├── communications/     # WhatsApp inbox and thread views
│   ├── reports/            # Reporting
│   ├── settings/           # Company setup
│   ├── workspaces/         # Org management (Clerk)
│   ├── billing/            # Billing (Clerk)
│   └── profile/            # User profile (Clerk)
│
├── app/portal/             # Customer-facing portal
│   ├── invoices/           # Invoice payment pages
│   ├── quotations/         # Quotation review pages
│   ├── subscriptions/      # Subscription list
│   └── digital-access/     # Access to digital products
│
├── features/               # Domain modules (feature-based)
│   ├── overview/           # Analytics components
│   ├── products/           # Service catalog + embedded recurring plans
│   ├── clients/            # CRM
│   ├── quotations/         # Sales documents
│   ├── projects/           # Delivery operations
│   ├── invoices/           # Billing
│   ├── payments/           # Payment recording
│   ├── expenses/           # Cost tracking
│   ├── communications/     # Inbox, thread, attach/send actions
│   │   ├── api/
│   │   │   ├── types.ts    # Response shapes, filter types, payloads
│   │   │   ├── service.ts  # Data access layer
│   │   │   └── queries.ts  # React Query options + key factories
│   │   ├── components/     # Listing, form, table, cell actions
│   │   └── schemas/        # Zod schemas
│   ├── reports/            # Reporting UI
│   ├── settings/           # Company setup form
│   ├── auth/               # Auth edge components
│   └── profile/            # Profile form
│
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── layout/             # Sidebar, header, page-container
│   ├── themes/             # Theme config, selector, active provider
│   └── icons.tsx           # Icon registry (single source)
│
├── config/
│   ├── nav-config.ts       # Navigation groups with RBAC
│   └── infoconfig.ts       # Infobar content per page
│
├── lib/                    # query-client, api-client, searchparams, utils
├── hooks/                  # use-nav (RBAC), use-data-table, etc.
├── styles/themes/          # Per-theme CSS files (OKLCH tokens)
└── types/                  # NavItem, NavGroup, etc.

prisma/
├── schema.prisma           # PostgreSQL schema for agency + portal flows
└── seed.mjs                # Initial seed data

scripts/
├── cleanup.js              # Module manager (disable / remove features)
└── postinstall.js          # Dev startup banner (auto-cleans when done)
```

---

## Getting Started

### 1. Clone & install

```bash
git clone <your-fork>
cd next-shadcn-dashboard-starter
bun install
```

### 2. Configure environment

```bash
cp env.example.txt .env.local
```

Required variables — see `env.example.txt` for the full list:

```env
# Database (PostgreSQL / Supabase / Neon)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/auth/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/auth/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard/overview"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard/overview"
```

Optional but commonly used in this starter:

```env
# Mail
MAIL_PROVIDER="emulator"
MAIL_FROM_EMAIL="Agency Dashboard <onboarding@resend.dev>"
MAIL_REPLY_TO=
RESEND_API_KEY=

# Blob uploads
BLOB_READ_WRITE_TOKEN=
```

> **Note:** Prisma CLI reads `.env` (not `.env.local`) for `db:push` and `db:seed`.  
> Copy your `DATABASE_URL` and `DIRECT_URL` to `.env` as well for CLI commands.

> **Auth keyless mode:** The app works in development without Auth keys — a popup will appear asking you to claim the app.

### 3. Setup database

```bash
bun run db:push      # Push schema to PostgreSQL
bun run db:seed      # Seed service catalog, clients, quotations, invoices, portal data
```

### 4. Run

```bash
bun run dev          # http://localhost:3000
```

---

## Module Management

```bash
# Interactive mode — prompts for each module
node scripts/cleanup.js --interactive

# Disable a module (hidden from nav, code preserved)
node scripts/cleanup.js --disable kanban

# Remove a module permanently
node scripts/cleanup.js kanban

# Preview without modifying files
node scripts/cleanup.js --dry-run kanban chat

# Remove multiple at once
node scripts/cleanup.js kanban chat notifications

# List all modules and their states
node scripts/cleanup.js --list
```

**Available modules:**

| Module          | Default State | Description                    |
| --------------- | :-----------: | ------------------------------ |
| `clerk`         |    enabled    | Auth, orgs, billing, profile   |
| `kanban`        |    enabled    | Drag-and-drop task board       |
| `chat`          |    enabled    | Internal chat demo             |
| `notifications` |    enabled    | Notification center            |
| `examples`      |    enabled    | Forms, React Query demo, Icons |
| `themes`        |    enabled    | Extra themes (keep one)        |
| `sentry`        |    enabled    | Error tracking                 |

After removing all desired modules, delete `scripts/cleanup.js` — the dev server message auto-cleans on next start.

---

## Business Flow Included

The current starter already includes a practical business flow:

1. Create or manage a client
2. Create a quotation from service catalog items
3. Approve quotation into a project and draft invoice
4. Send invoice by email or WhatsApp
5. Let customer open the portal payment page
6. Record payment and sync invoice status
7. Run recurring billing for subscription-capable service plans

This keeps the shell modular, but gives the repo a real working baseline instead of demo-only CRUD.

---

## WhatsApp and Communications

The repo now includes a communications module designed for WhatsApp-first operations:

- `Client.phone` is the standard phone field
- inbox route: `/dashboard/communications`
- send quotation via WhatsApp
- send invoice via WhatsApp
- webhook endpoint for inbound bridge events
- manual attach conversation to client

Provider options in `Settings`:

- `EMULATOR` — safe local testing, logs payloads
- `BRIDGE` — connect your own WhatsApp API service such as WAHA

### WAHA setup

The current recommended path is **WAHA Core**.

Example runtime used during development on this host:

- WAHA base URL: `http://127.0.0.1:3006`
- API key: `local-waha-key`
- session name: `default`

Important:

- **WAHA Core supports only one session named `default`**
- if your dashboard runs on Vercel, use your **public WAHA tunnel URL**, not `127.0.0.1`

In `Dashboard -> Settings -> Company Setup -> WhatsApp Channel`:

1. set `WhatsApp Provider` to `BRIDGE`
2. fill `WA API URL`
3. fill `WA API Key`
4. fill `Session Name` with `default`
5. save settings
6. click `Prepare Session`
7. click `Open QR`
8. scan the QR code
9. click `Refresh Status`

The repo now includes WAHA-specific helper routes:

- `/api/settings/whatsapp/status`
- `/api/settings/whatsapp/connect`
- `/api/settings/whatsapp/qr`

This lets operators complete setup directly from the dashboard instead of managing the session only from Swagger.

### What the dashboard sends over WhatsApp

- quotation delivery with document link
- invoice delivery with document link
- invoice delivery with payment link
- manual outbound messages from the communications thread

This keeps the dashboard modular: the shell does not depend on one WhatsApp provider, only on the communication abstraction. Right now the bridge implementation is tuned for WAHA.

---

## Adding a New Domain Module

Full end-to-end guide in `AGENTS.md`. Quick summary:

1. `src/constants/mock-api-<name>.ts` — mock data store
2. `src/features/<name>/api/types.ts` — response + filter types
3. `src/features/<name>/api/service.ts` — data access layer
4. `src/features/<name>/api/queries.ts` — React Query options
5. `src/features/<name>/api/mutations.ts` — mutation options
6. `src/features/<name>/schemas/<name>.ts` — Zod schema
7. `src/features/<name>/components/` — listing, table, form
8. `src/app/dashboard/<name>/page.tsx` — route page
9. `src/config/nav-config.ts` — add nav item

To connect to a real backend, only `service.ts` needs to change.

---

## Database

Schema lives in `prisma/schema.prisma`. Core operational models include:

- `Category`
- `Product`
- `Client`
- `Quotation`
- `QuotationItem`
- `Project`
- `Invoice`
- `Payment`
- `Expense`
- `SubscriptionPlan`
- `ClientSubscription`
- `Conversation`
- `MessageLog`
- `AppSettings`
- `DocumentSequence`

```bash
bun run db:generate   # Regenerate Prisma client
bun run db:push       # Push schema changes (no migration files)
bun run db:migrate    # Create migration + apply
bun run db:seed       # Seed initial data
```

---

## Deploy

### Docker

```bash
# Build
docker build \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx \
  -t dashboard .

# Run
docker run -d -p 3000:3000 \
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx \
  -e CLERK_SECRET_KEY=sk_live_xxx \
  -e DATABASE_URL="postgresql://..." \
  --name dashboard \
  dashboard
```

### Vercel

1. Connect repo to Vercel
2. Add all `NEXT_PUBLIC_*`, Clerk, database, and storage env vars
3. Deploy

This repo uses a Vercel build command that keeps Prisma schema in sync during deploy:

```json
{
  "buildCommand": "bun run build:vercel"
}
```

And `build:vercel` runs:

```bash
prisma generate && prisma db push && next build
```

That is intentional for this starter because the schema is still managed with `db push` rather than committed migration files.

---

## External Documentation

- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase Postgres](https://supabase.com/docs/guides/database)
- [Auth Next.js SDK](https://
- [shadcn/ui](https://ui.shadcn.com/docs)
- [TanStack Query v5](https://tanstack.com/query/latest)
- [TanStack Form](https://tanstack.com/form/latest)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
