# AGENTS.md — AI Coding Agent Reference

This file is the primary reference for AI coding agents working on this project. It documents the project architecture, code conventions, and patterns that every agent must follow.

---

## Project Overview

**Modular Admin Dashboard Starter** — a production-ready, plug-and-play admin dashboard template built with:

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.7 (strict)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (New York style)
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma
- **Authentication**: Clerk (with Organizations + Billing)
- **Error Tracking**: Sentry (optional)
- **Charts**: Recharts
- **Package Manager**: Bun (preferred) or npm

### Core Design Principle

Every domain module is **optional and self-contained**. The core shell never depends on domain modules. Modules can exist in one of three states:

| State      | Nav visible | Code in repo |
| ---------- | :---------: | :----------: |
| `enabled`  |     ✅      |      ✅      |
| `disabled` |     ❌      |      ✅      |
| `removed`  |     ❌      |      ❌      |

Use `scripts/cleanup.js` to manage module states.

---

## Technology Stack Details

### Core Framework & Runtime

- Next.js 16.2.1 with App Router
- React 19.2.0
- TypeScript 5.7.2 with strict mode

### Styling & UI

- Tailwind CSS v4 (`@import 'tailwindcss'` syntax)
- PostCSS with `@tailwindcss/postcss` plugin
- shadcn/ui component library (Radix UI primitives)
- CSS custom properties for theming (OKLCH color format)

### Database & ORM

- PostgreSQL hosted on Supabase
- Prisma ORM (`prisma/schema.prisma`)
- Prisma Client generated to `node_modules/@prisma/client`
- Database scripts: `db:push`, `db:migrate`, `db:generate`, `db:seed`
- Seed file: `prisma/seed.mjs`

> **Important:** Prisma CLI reads `.env`, not `.env.local`. Keep `DATABASE_URL` and `DIRECT_URL` in both files.

### Authentication & Authorization

- Clerk for auth, user management, organizations
- Clerk Organizations for multi-tenant workspaces
- Clerk Billing for B2B subscription management
- Client-side RBAC in `src/hooks/use-nav.ts` (UI-only — enforce server-side too)

### State Management

- Zustand 5.x for local UI state (kanban, chat, notifications)
- Nuqs for URL search params state management
- TanStack Form + Zod for forms via `useAppForm` hook

### Data Fetching & Caching

- TanStack React Query v5 for all data fetching
- Server: `void queryClient.prefetchQuery()` + `HydrationBoundary` + `dehydrate`
- Client: `useSuspenseQuery()` (integrates with React Suspense)
- Mutations: `mutationOptions` + `getQueryClient()` in `mutations.ts`
- Query client singleton: `src/lib/query-client.ts`

### Linting & Formatting

- OxLint (`oxlint`) — fast Rust-based linter
- Oxfmt (`oxfmt`) — formatter
- Husky + lint-staged for pre-commit

---

## Project Structure

```
/
├── prisma/
│   ├── schema.prisma         # Database schema (Category, Product)
│   └── seed.mjs              # Initial seed data
│
├── scripts/
│   ├── cleanup.js            # Module manager (disable/remove features)
│   └── postinstall.js        # Dev startup banner
│
├── docs/
│   ├── clerk_setup.md        # Clerk configuration guide
│   ├── nav-rbac.md           # RBAC documentation
│   └── themes.md             # Theme customization guide
│
├── src/
│   ├── app/
│   │   ├── auth/             # Sign-in, sign-up routes (Clerk)
│   │   ├── dashboard/
│   │   │   ├── overview/     # Analytics (parallel routes)
│   │   │   ├── product/      # Product CRUD pages
│   │   │   ├── categories/   # Category management pages
│   │   │   ├── users/        # Users table page
│   │   │   ├── kanban/       # Kanban board page
│   │   │   ├── chat/         # Messaging page
│   │   │   ├── notifications/ # Notifications page
│   │   │   ├── workspaces/   # Org management (Clerk)
│   │   │   ├── billing/      # Billing (Clerk)
│   │   │   ├── profile/      # User profile (Clerk)
│   │   │   ├── exclusive/    # Plan-gated demo page
│   │   │   ├── forms/        # Form examples
│   │   │   ├── elements/     # Icon showcase
│   │   │   └── react-query/  # React Query demo
│   │   ├── api/              # Route handlers (REST / BFF patterns)
│   │   ├── layout.tsx        # Root layout with providers
│   │   ├── page.tsx          # Landing → redirects to /dashboard/overview
│   │   ├── global-error.tsx  # Sentry-integrated error boundary
│   │   └── not-found.tsx     # 404 page
│   │
│   ├── features/             # Domain modules (self-contained)
│   │   ├── overview/         # Analytics charts & cards
│   │   ├── products/         # Product management (Prisma-backed)
│   │   │   ├── api/
│   │   │   │   ├── types.ts  # Response shapes, filter types, payloads
│   │   │   │   ├── service.ts # Data access layer (swap for your backend)
│   │   │   │   ├── queries.ts # React Query options + key factories
│   │   │   │   └── mutations.ts # Mutation options
│   │   │   ├── components/   # Listing, form, table, cell actions
│   │   │   ├── schemas/      # Zod validation schemas
│   │   │   └── constants/    # Filter options
│   │   ├── categories/       # Category management (same pattern)
│   │   ├── users/            # User management (same pattern, mock)
│   │   ├── kanban/           # Kanban board (Zustand + dnd-kit)
│   │   ├── chat/             # Messaging UI
│   │   ├── notifications/    # Notification center & Zustand store
│   │   ├── auth/             # Auth edge components
│   │   ├── profile/          # Profile form schemas
│   │   ├── forms/            # Form example components
│   │   ├── elements/         # Element showcase components
│   │   └── react-query-demo/ # React Query showcase (Pokemon API)
│   │
│   ├── components/
│   │   ├── ui/               # shadcn/ui primitives (do not modify directly)
│   │   ├── layout/           # Sidebar, header, page-container, providers
│   │   ├── themes/           # Theme config, selector, active-theme provider
│   │   ├── kbar/             # Command+K interface
│   │   └── icons.tsx         # Icon registry (single source of truth)
│   │
│   ├── config/
│   │   ├── nav-config.ts     # Navigation groups + RBAC access properties
│   │   └── infoconfig.ts     # Infobar content per page
│   │
│   ├── hooks/
│   │   ├── use-nav.ts        # RBAC navigation filtering (Clerk)
│   │   ├── use-data-table.ts # Data table state management
│   │   └── ...
│   │
│   ├── lib/
│   │   ├── utils.ts          # cn() + formatters
│   │   ├── query-client.ts   # TanStack Query client singleton
│   │   ├── api-client.ts     # Typed fetch wrapper
│   │   ├── searchparams.ts   # Nuqs param definitions
│   │   └── parsers.ts        # getSortingStateParser
│   │
│   ├── constants/
│   │   └── mock-api*.ts      # In-memory mock data stores (default backend)
│   │
│   ├── styles/
│   │   ├── globals.css       # Tailwind imports + view transitions
│   │   ├── theme.css         # Theme imports
│   │   └── themes/           # Per-theme CSS files (OKLCH tokens)
│   │
│   └── types/
│       └── index.ts          # NavItem, NavGroup, etc.
```

---

## Build & Development Commands

```bash
# Install dependencies
bun install

# Development server (with startup banner)
bun run dev

# Build for production
bun run build

# Production server
bun run start

# Database
bun run db:generate   # Regenerate Prisma client
bun run db:push       # Push schema to DB (no migration files)
bun run db:migrate    # Create + apply migration
bun run db:seed       # Seed initial data

# Linting
bun run lint          # OxLint
bun run lint:fix      # Fix + format
bun run lint:strict   # Zero warnings

# Formatting
bun run format        # Oxfmt write
bun run format:check  # Oxfmt check
```

---

## Environment Configuration

Copy `env.example.txt` to `.env.local`. For Prisma CLI commands, also copy DB vars to `.env`.

### Database (Supabase)

```env
DATABASE_URL="postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:password@aws-0-region.supabase.com:5432/postgres"
```

### Authentication (Clerk)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/auth/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/auth/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard/overview"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard/overview"
```

### Error Tracking (Sentry — optional)

```env
NEXT_PUBLIC_SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_ORG=your-org
NEXT_PUBLIC_SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=sntrys_...
NEXT_PUBLIC_SENTRY_DISABLED="true"  # Set to "false" in production
```

---

## Prisma & Database Patterns

### Schema location: `prisma/schema.prisma`

Current models: `Category`, `Product` (with `ProductType` enum: `PRODUCT | SERVICE`).

### Adding a new model

1. Add the model to `prisma/schema.prisma`
2. Run `bun run db:push` (dev) or `bun run db:migrate` (prod)
3. Run `bun run db:generate` to regenerate Prisma client
4. Create `src/features/<name>/api/service.ts` with Prisma calls

### Service layer with Prisma

```ts
// src/features/<name>/api/service.ts
'use server'; // ← add for Server Actions pattern
import { prisma } from '@/lib/prisma'; // re-export PrismaClient singleton

export async function getProducts(filters: ProductFilters) {
  const [items, total_items] = await Promise.all([
    prisma.product.findMany({
      /* ... */
    }),
    prisma.product.count({
      /* ... */
    })
  ]);
  return { items, total_items };
}
```

### Seed

`prisma/seed.mjs` is idempotent (uses `upsert`). Run anytime to reset initial data:

```bash
bun run db:seed
```

---

## Module Management System

`scripts/cleanup.js` manages optional domain modules.

### States

```bash
# Remove module permanently (files deleted)
node scripts/cleanup.js kanban

# Disable module (hidden from nav, files stay)
node scripts/cleanup.js --disable kanban

# Preview without modifying
node scripts/cleanup.js --dry-run kanban

# Interactive mode
node scripts/cleanup.js --interactive

# List all modules + states
node scripts/cleanup.js --list
```

### Available modules

| Module          | Removes                                              |
| --------------- | ---------------------------------------------------- |
| `clerk`         | auth routes, profile, workspaces, billing, exclusive |
| `kanban`        | kanban board + dnd-kit deps                          |
| `chat`          | messaging UI                                         |
| `notifications` | notification center                                  |
| `examples`      | forms demo, react-query demo, elements               |
| `themes`        | extra themes (keep one)                              |
| `sentry`        | error tracking                                       |

### When a module is disabled

- Nav item is hidden from sidebar and kbar
- Route is still accessible via URL
- Feature flag: set `visible: () => false` in nav-config (or use `access` property)

---

## Code Style Guidelines

### TypeScript

- Strict mode — no `any`, no implicit types
- Explicit return types on public functions
- Prefer `interface` over `type` for object shapes
- Use `@/*` alias for all `src/` imports

### Formatting

```json
{
  "singleQuote": true,
  "jsxSingleQuote": true,
  "semi": true,
  "trailingComma": "none",
  "tabWidth": 2,
  "arrowParens": "always"
}
```

### Component Conventions

- Function declarations: `function ComponentName() {}`
- Props interface: `interface ComponentNameProps {}`
- Server components by default — `'use client'` only when using browser APIs or hooks
- `cn()` for all className merging — never concatenate strings

### Import Order (enforced)

1. React / Next.js core
2. Third-party libraries
3. Internal `@/components`, `@/lib`, `@/hooks`
4. Feature-internal relative imports

---

## Adding a New Feature (End-to-End)

### Step 1: Mock data store (`src/constants/mock-api-<name>.ts`)

```ts
import { faker } from '@faker-js/faker';
import { matchSorter } from 'match-sorter';
import { delay } from './mock-api';

export type Order = { id: number; customer: string; status: string; total: number /* ... */ };

export const fakeOrders = {
  records: [] as Order[],
  initialize() {
    /* generate with faker */
  },
  async getOrders({ page, limit, search, sort }) {
    await delay(800);
    /* filter + paginate → return { items, total_items } */
  },
  async getOrderById(id: number) {
    /* ... */
  },
  async createOrder(data) {
    /* ... */
  },
  async updateOrder(id, data) {
    /* ... */
  },
  async deleteOrder(id) {
    /* ... */
  }
};
fakeOrders.initialize();
```

> To connect a real backend: only replace `service.ts`. The mock store and other layers stay untouched.

### Step 2: API layer (`src/features/<name>/api/`)

**`types.ts`** — re-export entity type + filter/response/payload types:

```ts
export type { Order } from '@/constants/mock-api-orders';
export type OrderFilters = { page?: number; limit?: number; search?: string; sort?: string };
export type OrdersResponse = { items: Order[]; total_items: number };
export type OrderMutationPayload = { customer: string; status: string; total: number };
```

**`service.ts`** — data access layer (the ONE file you swap for real backend):

```ts
import { fakeOrders } from '@/constants/mock-api-orders';
import type { OrderFilters, OrdersResponse, OrderMutationPayload } from './types';

export async function getOrders(filters: OrderFilters): Promise<OrdersResponse> {
  return fakeOrders.getOrders(filters);
}
export async function getOrderById(id: number) {
  return fakeOrders.getOrderById(id);
}
export async function createOrder(data: OrderMutationPayload) {
  return fakeOrders.createOrder(data);
}
export async function updateOrder(id: number, data: OrderMutationPayload) {
  return fakeOrders.updateOrder(id, data);
}
export async function deleteOrder(id: number) {
  return fakeOrders.deleteOrder(id);
}
```

**`queries.ts`** — React Query options + key factory:

```ts
import { queryOptions } from '@tanstack/react-query';
import { getOrders, getOrderById } from './service';
import type { Order, OrderFilters } from './types';
export type { Order };

export const orderKeys = {
  all: ['orders'] as const,
  list: (filters: OrderFilters) => [...orderKeys.all, 'list', filters] as const,
  detail: (id: number) => [...orderKeys.all, 'detail', id] as const
};

export const ordersQueryOptions = (filters: OrderFilters) =>
  queryOptions({ queryKey: orderKeys.list(filters), queryFn: () => getOrders(filters) });

export const orderByIdOptions = (id: number) =>
  queryOptions({ queryKey: orderKeys.detail(id), queryFn: () => getOrderById(id) });
```

**`mutations.ts`** — use `mutationOptions` + `getQueryClient()` (not `useQueryClient()`):

```ts
import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createOrder, updateOrder, deleteOrder } from './service';
import { orderKeys } from './queries';
import type { OrderMutationPayload } from './types';

export const createOrderMutation = mutationOptions({
  mutationFn: (data: OrderMutationPayload) => createOrder(data),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: orderKeys.all })
});
export const updateOrderMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: OrderMutationPayload }) =>
    updateOrder(id, values),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: orderKeys.all })
});
export const deleteOrderMutation = mutationOptions({
  mutationFn: (id: number) => deleteOrder(id),
  onSuccess: () => getQueryClient().invalidateQueries({ queryKey: orderKeys.all })
});
```

### Step 3: Zod schema (`src/features/<name>/schemas/<name>.ts`)

```ts
import { z } from 'zod';

export const orderSchema = z.object({
  customer: z.string().min(2),
  status: z.string().min(1),
  total: z.number({ message: 'Required' })
});

export type OrderFormValues = z.infer<typeof orderSchema>;
```

### Step 4: Feature components (`src/features/<name>/components/`)

- `<name>-listing.tsx` — server component: `HydrationBoundary` + `Suspense` + skeleton
- `<name>-table/index.tsx` — client: `useSuspenseQuery` + `useDataTable` + `DataTable`
- `<name>-table/columns.tsx` — column definitions with `DataTableColumnHeader`
- `<name>-table/cell-action.tsx` — dropdown with edit/delete + `AlertModal`
- `<name>-view-page.tsx` — client: `id === 'new'` → create form; else `useSuspenseQuery` → edit form
- `<name>-form.tsx` — TanStack Form with `useAppForm` + `useFormFields<T>()`

### Step 5: Page route (`src/app/dashboard/<name>/page.tsx`)

```tsx
import PageContainer from '@/components/layout/page-container';
import OrderListingPage from '@/features/orders/components/order-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = { title: 'Dashboard: Orders' };
type PageProps = { searchParams: Promise<SearchParams> };

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);
  return (
    <PageContainer scrollable={false} pageTitle='Orders' pageDescription='Manage your orders.'>
      <OrderListingPage />
    </PageContainer>
  );
}
```

### Step 6: Navigation (`src/config/nav-config.ts`)

```ts
{ title: 'Orders', url: '/dashboard/orders', icon: 'product', items: [] }
```

Access control on nav items:

```ts
access: {
  requireOrg: true;
} // Requires active org
access: {
  permission: 'org:x:manage';
} // Requires specific permission
access: {
  plan: 'pro';
} // Requires subscription plan
access: {
  role: 'admin';
} // Requires role
```

### Step 7: Icons (`src/components/icons.tsx`)

```ts
import { IconShoppingCart } from '@tabler/icons-react';
export const Icons = { /* ...existing */ cart: IconShoppingCart };
```

**Never import from `@tabler/icons-react` directly. Always use `Icons.keyName`.**

---

## Data Fetching Patterns

### Standard pattern: server prefetch → client

```tsx
// Listing component (server)
const queryClient = getQueryClient();
void queryClient.prefetchQuery(ordersQueryOptions(filters)); // void = fire-and-forget

return (
  <HydrationBoundary state={dehydrate(queryClient)}>
    <Suspense fallback={<OrderTableSkeleton />}>
      <OrderTable /> {/* client component */}
    </Suspense>
  </HydrationBoundary>
);

// Client component
const { data } = useSuspenseQuery(ordersQueryOptions(filters)); // NOT useQuery
```

**Why `useSuspenseQuery` not `useQuery`:**

- `useQuery` doesn't integrate with Suspense → shows loading even when data is prefetched
- `useSuspenseQuery` picks up the dehydrated pending query and streams it via React Suspense

### Mutations

```tsx
// In component — spread shared options + layer UI callbacks
const mutation = useMutation({
  ...createOrderMutation,
  onSuccess: () => toast.success('Created')
});
```

### URL state

- Server component: `searchParamsCache.get('page')`
- Client component: `useQueryStates({ page: parseAsInteger.withDefault(1), ... })`

### Portal / Customer Performance Pattern

Portal and customer-facing pages must use **lean, page-specific queries**. Do not reuse a single
`include`-heavy helper across overview, invoices, quotations, projects, subscriptions, and digital
access.

Rules:

1. Use **one helper per page surface** (for example `getPortalInvoicesPageData`, not one giant
   `getPortalClientContext` for everything).
2. Prefer `select` over `include` unless the full relation is truly needed.
3. Paginate list surfaces by default (`take` / `skip` or equivalent). Do not `findMany()` the full
   client history for portal pages.
4. Overview pages should use **counts + small aggregates**, not full record hydration.
5. Keep document/detail pages separate from list pages. A list page should not load the full
   document tree just to show a row summary.
6. Add Prisma indexes whenever a new access pattern becomes standard:
   - tenant/client foreign key + status + createdAt
   - recurring scheduler status + nextBillingDate
   - timeline-style foreign key + date
7. Cache only low-churn shared reads such as company settings or published catalog data. If cached
   data can be mutated from the app, pair it with explicit invalidation in the matching write path.
8. Agency-domain models must be workspace-aware. When adding a new agency table or query, include
   `organizationId` scoping and keep read access compatible with legacy `null` rows while the repo
   is in migration.
9. Document numbering must use the `DocumentSequence` counter pattern. Do not scan the latest
   invoice/quotation number in hot write paths.

If a new page starts from "load the entire client graph and filter in memory", that is the wrong
pattern for this repo.

---

## Theming System

10 built-in themes: `vercel` (default), `claude`, `neobrutualism`, `supabase`, `mono`, `notebook`, `light-green`, `zen`, `astro-vista`, `whatsapp`.

### Adding a new theme

1. Create `src/styles/themes/<name>.css` with `[data-theme='<name>']` selector + OKLCH tokens
2. Import in `src/styles/theme.css`
3. Add to `THEMES` array in `src/components/themes/theme.config.ts`
4. (Optional) Add Google Font in `src/components/themes/font.config.ts`

See `docs/themes.md` for full guide.

---

## Backend Connection Strategies

`service.ts` is the only file that changes when connecting a real backend.

| Pattern                        | How                                                                    |
| ------------------------------ | ---------------------------------------------------------------------- |
| **Prisma + Server Actions**    | Add `'use server'` to `service.ts`, call Prisma directly               |
| **Prisma + Route Handlers**    | `service.ts` calls `/api/` via `apiClient`; route handlers call Prisma |
| **BFF** (Next.js → Laravel/Go) | `service.ts` calls `/api/`; route handlers proxy to external API       |
| **External API directly**      | `service.ts` calls external URL via `fetch()`                          |
| **Mock (default)**             | `service.ts` calls in-memory fake data store                           |

---

## Authentication Patterns

### Server-side route protection

```tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Page() {
  const { orgId } = await auth();
  if (!orgId) redirect('/dashboard/workspaces');
}
```

### Client-side feature gating

```tsx
import { Protect } from '@clerk/nextjs';

<Protect plan='pro' fallback={<UpgradePrompt />}>
  <PremiumFeature />
</Protect>;
```

---

## Forms

Use **TanStack Form** via `useAppForm` + `useFormFields<T>()`.

Available field components via `useFormFields<T>()`:
`FormTextField`, `FormTextareaField`, `FormSelectField`, `FormCheckboxField`, `FormSwitchField`, `FormRadioGroupField`, `FormSliderField`, `FormFileUploadField`

**Page form pattern** (create/edit on dedicated route):

```tsx
const form = useAppForm({
  defaultValues: { name: '' } as OrderFormValues,
  validators: { onSubmit: orderSchema },
  onSubmit: async ({ value }) => mutation.mutateAsync(value)
});
const { FormTextField } = useFormFields<OrderFormValues>();

return (
  <form.AppForm>
    <form.Form className='space-y-4'>
      <FormTextField name='name' label='Name' required />
    </form.Form>
  </form.AppForm>
);
```

**Sheet form pattern** (inline side panel): see `src/features/users/components/user-form-sheet.tsx`.

---

## Error Handling & Monitoring

- Global error: `src/app/global-error.tsx` (Sentry-integrated)
- Parallel route errors: per-slot `error.tsx` files
- Disable Sentry in dev: `NEXT_PUBLIC_SENTRY_DISABLED="true"`

---

## Deployment

### Vercel

1. Connect repo → add env vars → deploy
2. Runtime: `DATABASE_URL`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_*` vars

### Docker

Both `Dockerfile` (Node.js) and `Dockerfile.bun` (Bun) use `output: 'standalone'`.

```bash
docker build --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx -t dashboard .
docker run -d -p 3000:3000 -e CLERK_SECRET_KEY=sk_xxx -e DATABASE_URL="..." dashboard
```

---

## Troubleshooting

| Problem                          | Fix                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------- |
| Build fails with Tailwind errors | Use `@import 'tailwindcss'` syntax; check `postcss.config.js`                 |
| `db:push` fails                  | Ensure `DATABASE_URL` + `DIRECT_URL` are in `.env` (not just `.env.local`)    |
| Clerk keyless popup              | Normal in dev — click to claim or add API keys                                |
| Theme not applying               | Check `[data-theme]` name matches `theme.config.ts` + imported in `theme.css` |
| Nav item not visible             | Check `access` property; verify user has required org/role/plan               |
| Prisma client stale              | Run `bun run db:generate` after schema changes                                |

---

## Notes for AI Agents

1. **`cn()` for className** — never concatenate strings manually
2. **Feature-based structure** — all new feature code goes in `src/features/<name>/`
3. **Server components by default** — add `'use client'` only when using browser APIs or React hooks
4. **No `any`** — avoid any, prefer explicit types and generics
5. **Follow existing patterns** — look at `products/` as the canonical example before creating a new feature
6. **Environment variables** — prefix with `NEXT_PUBLIC_` for client-side access
7. **shadcn components** — never modify `src/components/ui/` directly; extend or compose them
8. **Icons** — ALWAYS register in `src/components/icons.tsx` and import as `import { Icons } from '@/components/icons'`. Never import from `@tabler/icons-react` directly.
9. **Page headers** — use `PageContainer` props (`pageTitle`, `pageDescription`, `pageHeaderAction`). Never import `<Heading>` manually.
10. **Forms** — `useAppForm` + `useFormFields<T>()` from `@/components/ui/tanstack-form`. Never use `useState` inside `AppField` render props.
11. **Button loading** — `<Button isLoading={isPending}>`. `SubmitButton` in forms handles this automatically.
12. **Data layer** — `types.ts` → `service.ts` → `queries.ts`. Components never import from `@/constants/mock-api*` directly.
13. **Mutations** — use `mutationOptions` in `mutations.ts` with `getQueryClient()`. Never use `useQueryClient()` in mutation definitions.
14. **Prisma** — call Prisma only in `service.ts` (or route handlers). Never in components or queries.
15. **Module states** — when asked to "disable" a feature, hide it from nav using `access` or `visible: () => false`. When asked to "remove", use `scripts/cleanup.js` or delete the folder + nav entry manually.

---

## External Documentation

- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma ORM](https://www.prisma.io/docs)
- [Supabase PostgreSQL](https://supabase.com/docs/guides/database)
- [Clerk Next.js SDK](https://clerk.com/docs/references/nextjs)
- [shadcn/ui](https://ui.shadcn.com/docs)
- [TanStack Query v5](https://tanstack.com/query/latest)
- [TanStack Form](https://tanstack.com/form/latest)
- [TanStack Table](https://tanstack.com/table/latest)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
