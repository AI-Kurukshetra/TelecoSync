# TelecoSync Release Checklist

## Quality
- `pnpm type-check`
- `pnpm lint`
- `pnpm load:smoke`

## Security
- Confirm no committed `.env` files.
- Confirm service-role keys are not exposed to client code.
- Confirm RBAC-sensitive routes still require explicit permissions.

## Platform
- Confirm Upstash Redis configuration is valid.
- Confirm QStash configuration is valid.
- Confirm Vercel analytics ingest or p95 env source is configured.

## Operations
- Confirm backup/export path works via `/api/admin/export`.
- Confirm import path works via `/api/admin/import`.
- Confirm notifications deliver across enabled channels.
