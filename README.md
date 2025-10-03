# Owner Console

A Next.js 15 App Router application that gives the platform owner a centralized console to manage every organization in a multi-tenant NEMT platform. Clerk Organizations act as the source of truth while Supabase mirrors organization data for the rest of the stack.

## Features
- Owner-only access enforced in middleware, server components, and API routes using Clerk public metadata.
- Create a Clerk organization and mirror it to Supabase in a single flow (with rollback on failure).
- Server-rendered owner dashboard with searchable organization cards, detail view, and editable profile form.
- Plan-aware organization management: assign subscription plans, capture billing anchor days, and inspect effective feature values resolved across defaults, plans, and overrides.
- Billing readiness workspace that highlights which organizations are invoice-ready, what blockers remain, and upcoming anchor dates.
- Clerk ↔ Supabase synchronization via webhook handlers for organization lifecycle events.
- Service-role Supabase server client for SSR data access without exposing secrets.
- Utility API endpoint (`/api/whoami`) for quick diagnostics of the authenticated user and platform role.

## Prerequisites
- Node.js 18+
- npm 9+
- A Clerk project with Organizations enabled
- A Supabase project with an `organizations` table (id is `text` and matches the Clerk org id). The optional `organization_settings` table is used for default seeding.

## Environment Variables
Copy `.env.local.example` to `.env.local` and populate the values from Clerk and Supabase:

```bash
cp .env.local.example .env.local
```

| Key | Notes |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key used on the client. |
| `CLERK_SECRET_KEY` | Clerk secret key for server-side helpers and webhooks. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (used **only** on the server). |
| `NEXT_PUBLIC_BASE_URL` | Base URL of the app (e.g. `http://localhost:3000`). |
| `CLERK_WEBHOOK_SECRET` | Optional: required when signature verification is enabled for Clerk webhooks. |

> Never expose the service-role key in client-side code. The provided Supabase helper ensures it is only instantiated on the server.

## Clerk Configuration
1. Enable **Organizations** in your Clerk dashboard.
2. For the owner user, set `publicMetadata.platformRole` to `"owner"`. The console checks this metadata in layouts, pages, and API routes.
3. Create a Clerk webhook pointing to `POST /api/webhooks/clerk` and copy the signing secret into `CLERK_WEBHOOK_SECRET` if you want signature verification.

## Supabase Schema
Ensure the following table exists (fields omitted for brevity):

```sql
create table public.organizations (
  id text primary key,
  name text not null,
  primary_email text not null,
  primary_phone text not null,
  address_line1 text not null,
  city text not null,
  state text not null,
  zip_code text not null,
  country text default 'USA' not null,
  legal_name text,
  address_line2 text,
  is_provider boolean default true,
  is_broker boolean default false,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

Optional: `organization_settings` with at least `org_id`, `setting_key`, `setting_value`, `setting_type` for default seeding.

The owner console also expects the plan and feature catalog tables/views described in the schema snippet you provided (`plans`, `plan_features`, `feature_definitions`, `org_features`, and the `org_feature_effective` views). Seed them so the owner UI can surface plan names and effective feature values.

## Running Locally
Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Navigate to `http://localhost:3000`. The owner console is served at `/owner`.

## Flows & APIs
- `POST /api/orgs`: Creates a Clerk organization, mirrors it to Supabase, and seeds default settings. Owner-only.
- `GET /api/orgs/[orgId]`: Returns the mirrored Supabase record. Owner-only.
- `PATCH /api/orgs/[orgId]`: Updates Supabase and Clerk public metadata (name, contact info, address, status). Owner-only.
- `POST /api/webhooks/clerk`: Handles `organization.created`, `organization.updated`, and `organization.deleted` events to keep Supabase in sync. Optional signature verification with `CLERK_WEBHOOK_SECRET`.
- `GET /api/whoami`: Returns `{ userId, email, platformRole }` for quick diagnostics.

## Manual QA Checklist
- Visiting `/owner` while signed out redirects to Clerk sign-in (middleware).
- A signed-in non-owner sees a styled **Forbidden** message on `/owner` routes.
- Owner can create an organization; Clerk org id is mirrored as the Supabase `organizations.id`.
- Editing an organization updates Supabase and reflects in Clerk (`publicMetadata`).
- Clerk webhook events update or deactivate Supabase rows as expected.

## Next Steps
- Configure Supabase Row Level Security for tenant-facing apps using the stored organization id.
- Extend webhook handling for membership events if you need mirrored `user_org_memberships` tables.
