#!/bin/sh

set -eu

pnpm --dir supabase/functions install --frozen-lockfile --ignore-workspace

if [ -z "${SUPABASE_PROJECT_REF:-}" ]; then
  echo "SUPABASE_PROJECT_REF is required."
  exit 1
fi

for fn in \
  billing-processor \
  notification-sender \
  fault-detector \
  workflow-engine \
  revenue-assurance-processor \
  integration-dispatcher
do
  pnpm dlx supabase functions deploy "$fn" --project-ref "$SUPABASE_PROJECT_REF"
done
