# Modular Admin Dashboard Starter

> Next.js 16 · shadcn/ui · Tailwind CSS v4 · Prisma · Supabase · Clerk · TypeScript

A production-ready, **fully modular** admin dashboard starter. Every domain module can be toggled on/off or removed entirely — making this a single codebase that scales from a simple CRUD panel to a full multi-tenant SaaS.

---

## Design Philosophy

This starter is built around one principle: **plug-and-play domain modules**.

```
Core Shell (always present)
  └── Dashboard layout, auth, navigation, theme, RBAC

Domain Modules (optional)
  ├── Products & Categories  ← enabled by default (seeded in DB)
  ├── Users                  ← enabled by default
  ├── Kanban                 ← enabled, removable
  ├── Chat                   ← enabled, removable
  ├── Notifications          ← enabled, removable
  └── Examples / Elements    ← enabled, removable
```

Each module has three possible states:

| State | What it means |
|-------|--------------|
| `enabled` | Route, nav item, and feature code are all active |
| `disabled` | Code exists, but hidden from navigation (feature-flagged) |
| `removed` | Permanently deleted from the codebase |

Use `scripts/cleanup.js` to transition modules between states.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.7 (strict) |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (Radix primitives) |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Auth | Clerk (orgs, billing, RBAC) |
| Data Fetching | TanStack React Query v5 |
| Tables | TanStack Table |
| Forms | TanStack Form + Zod |
| State | Zustand (UI state), nuqs (URL state) |
| Charts | Recharts |
| Error Tracking | Sentry (optional) |
| Package Manager | Bun (preferred) |

---

## Features (Core)

- 🧱 **Dashboard shell** — sidebar, header, page container, command bar, theme switcher
- 🔐 **Auth & multi-tenant** — Clerk sign-in/up, workspace switcher, team management, billing
- 🎨 **Multi-theme system** — 10 themes, easy to add custom themes
- 🔒 **RBAC navigation** — client-side filtering by org / permission / role / plan / feature
- ℹ️ **Infobar component** — contextual help panel on any page
- 🛠️ **Builder CLI** — `scripts/cleanup.js` for enabling/disabling/removing modules

## Features (Domain Modules — enabled by default)

- 📦 **Products & Categories** — full CRUD with Prisma-backed data (real DB), data table, form
- 👥 **Users** — user management table with search, filter, pagination
- 📊 **Analytics overview** — cards and charts with parallel routes
- 🗂️ **Kanban** — drag-and-drop task board (dnd-kit + Zustand)
- 💬 **Chat** — messaging UI with conversation list and composer
- 🔔 **Notifications** — notification center with bell badge and full page

---

## Project Structure

```
src/
├── app/dashboard/          # Route pages per module
│   ├── overview/           # Analytics (parallel routes)
│   ├── product/            # Product CRUD pages
│   ├── categories/         # Category management
│   ├── users/              # Users table
│   ├── kanban/             # Task board
│   ├── chat/               # Messaging
│   ├── notifications/      # Notification center
│   ├── workspaces/         # Org management (Clerk)
│   ├── billing/            # Billing (Clerk)
│   └── profile/            # User profile (Clerk)
│
├── features/               # Domain modules (feature-based)
│   ├── overview/           # Analytics components
│   ├── products/           # Product listing, form, table, API layer
│   │   ├── api/
│   │   │   ├── types.ts    # Response shapes, filter types, payloads
│   │   │   ├── service.ts  # Data access (swap this file for your backend)
│   │   │   └── queries.ts  # React Query options + key factories
│   │   ├── components/     # Listing, form, table, cell actions
│   │   └── schemas/        # Zod schemas
│   ├── categories/         # Category management (same pattern)
│   ├── users/              # User management (same pattern)
│   ├── kanban/             # Kanban board (Zustand + dnd-kit)
│   ├── chat/               # Messaging UI
│   ├── notifications/      # Notification store + page
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
├── schema.prisma           # PostgreSQL schema (Category, Product)
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
# Database (Supabase PostgreSQL)
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

> **Note:** Prisma CLI reads `.env` (not `.env.local`) for `db:push` and `db:seed`.  
> Copy your `DATABASE_URL` and `DIRECT_URL` to `.env` as well for CLI commands.

> **Clerk keyless mode:** The app works in development without Clerk keys — a popup will appear asking you to claim the app.

### 3. Setup database

```bash
bun run db:push      # Push schema to PostgreSQL
bun run db:seed      # Seed initial categories and products
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

| Module | Default State | Description |
|--------|:---:|---|
| `clerk` | enabled | Auth, orgs, billing, profile |
| `kanban` | enabled | Drag-and-drop task board |
| `chat` | enabled | Messaging UI |
| `notifications` | enabled | Notification center |
| `examples` | enabled | Forms, React Query demo, Icons |
| `themes` | enabled | Extra themes (keep one) |
| `sentry` | enabled | Error tracking |

After removing all desired modules, delete `scripts/cleanup.js` — the dev server message auto-cleans on next start.

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

Schema lives in `prisma/schema.prisma`. Current models:

- **Category** — `id`, `name`, `slug`, `description`, `products[]`
- **Product** — `id`, `name`, `description`, `type` (PRODUCT | SERVICE), `price`, `photoUrl`, `categorySlug`

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
2. Add all `NEXT_PUBLIC_*` and `DATABASE_URL` env vars in dashboard
3. Deploy

---

## External Documentation

- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase Postgres](https://supabase.com/docs/guides/database)
- [Clerk Next.js SDK](https://clerk.com/docs/references/nextjs)
- [shadcn/ui](https://ui.shadcn.com/docs)
- [TanStack Query v5](https://tanstack.com/query/latest)
- [TanStack Form](https://tanstack.com/form/latest)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
