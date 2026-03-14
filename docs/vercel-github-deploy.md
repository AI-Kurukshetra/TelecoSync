# Vercel GitHub Deployment

GitHub Actions deploys this app from `apps/web`.

Triggers:

- Pull requests to `main` create a Vercel preview deployment.
- Pushes to `main` create a Vercel production deployment.

Required GitHub repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`

Required Vercel project environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `WEBHOOK_SIGNING_SECRET`
- `INTERNAL_API_SECRET`
- `REVENUE_LEAKAGE_ALERT_THRESHOLD_PCT`

Workflow files:

- `.github/workflows/deploy-preview.yml`
- `.github/workflows/deploy-production.yml`

The workflows use:

1. `vercel pull`
2. `vercel build`
3. `vercel deploy --prebuilt`

This avoids monorepo root-directory issues during GitHub-based deployments.
