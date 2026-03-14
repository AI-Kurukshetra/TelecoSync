# TelecoSync - AI assistant rules

## Secrets and environment variables
- NEVER hardcode any key, token, password, or secret in source files
- NEVER commit .env files - only .env.example with placeholder values
- SUPABASE_SERVICE_ROLE_KEY is server-only - never import in any file under `app/` that contains `use client`
- When adding a new env var, add a commented placeholder to `.env.example`
- Never log `process.env` values to console

## Database and RLS
- Every new table MUST have `tenant_id UUID REFERENCES tenants(id)` unless it is a strictly global lookup table
- Every tenant-scoped table MUST have RLS enabled with a `tenant_isolation` policy
- Never use the service role client in client-side code
- Use parameterised queries always - never string-interpolate user input into SQL
- Run the audit trigger on every new table that touches business data
- NEVER run destructive database commands such as dropping the database, resetting the database, wiping schemas, or removing applied migrations unless the user explicitly requests it
- NEVER delete, rewrite, or remove existing migration files to "start fresh"; only add new migrations or edit unapplied local work when the user explicitly approves it
- NEVER run `supabase db reset`, `supabase migration repair`, or equivalent destructive recovery commands without explicit user approval

## API routes
- All route handlers validate input with Zod before touching the database
- All routes check authentication via Supabase session in middleware
- All routes check RBAC via `lib/api/auth-guard.ts` before executing
- All public-facing responses use TMF Open API shapes from `lib/integrations/tmf.ts`
- `webhook_subscriptions.secret` must NEVER appear in any API response body

## Integration framework
- All domain mutations must fire an event to `event_log` after success
- Event types follow dot-notation: `entity.action`
- Outbound HTTP calls to external systems go through `integration-dispatcher` only
- Connector config sensitive fields must be encrypted at rest

## Code style
- TypeScript strict mode - no implicit any and no `@ts-ignore`
- Server Components by default - `use client` only when truly needed
- `lib/supabase/server.ts` for all server-side data access
- `lib/supabase/client.ts` only for browser-side subscriptions and auth helpers
- All currency amounts stored as `NUMERIC(18,4)`
- All timestamps stored as `TIMESTAMPTZ`
