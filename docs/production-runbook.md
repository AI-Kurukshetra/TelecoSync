# TelecoSync Production Runbook

## Objective
- Keep tenant isolation, event dispatch, revenue assurance, and workflow automation healthy in production.

## Pre-deploy
- Confirm `pnpm type-check` and CI are green.
- Confirm Supabase migrations are applied.
- Confirm Edge Functions are deployed:
  - `billing-processor`
  - `notification-sender`
  - `fault-detector`
  - `workflow-engine`
  - `revenue-assurance-processor`
  - `integration-dispatcher`
- Confirm env vars exist for:
  - Supabase
  - Upstash Redis
  - QStash
  - Resend
  - Twilio
  - internal secrets

## Post-deploy validation
- Verify `/api/analytics` returns a populated snapshot.
- Trigger one auth login and confirm `auth.login` reaches `event_log`.
- Trigger one outbound event and confirm:
  - `webhook_deliveries` records a delivery
  - `connector_executions` records execution
- Trigger one document upload and validate signed download URL issuance.
- Trigger one alarm and verify:
  - trouble ticket creation
  - notification creation
  - workflow instance creation for active alarm workflows

## Runtime checks
- Monitor `event_log.processed = false` backlog.
- Monitor failed `webhook_deliveries`.
- Monitor failed `connector_executions`.
- Monitor `revenue.leakage.alert` events.
- Monitor `notifications.status = failed`.

## Incident actions
- Webhook failures:
  - inspect `webhook_deliveries`
  - validate QStash retry queue
  - confirm subscription secret and target availability
- Connector failures:
  - inspect connector config and last execution payload
  - validate upstream endpoint and credentials
- Auth anomalies:
  - confirm tenant metadata on the user
  - confirm role lookup in `user_profiles`
- Revenue anomalies:
  - inspect assurance job discrepancy rows
  - confirm invoice and usage period boundaries

## Recovery
- Re-run dispatcher for a stuck event by re-enqueueing the event id.
- Re-run assurance for a period using the revenue assurance API.
- Re-run connector manually from the connector run endpoint.
