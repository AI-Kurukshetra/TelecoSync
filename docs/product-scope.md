# TelecoSync Product Scope

TelecoSync is currently focused on a fixed-line-first product scope.

## In Scope

- BSS: customers, products, orders, billing
- OSS: inventory, provisioning-lite
- Admin: users, roles, minimal workflows
- Integrations: webhooks, connectors, event log
- Platform: auth, RLS, audit, pagination, load testing

## Deferred

- Revenue assurance, reconciliation, settlement, and finance reporting
- SLA management
- Fault management as a primary module
- Analytics as a primary module
- Documents and broad notification workflows
- Configuration management and advanced performance monitoring
- API registry and broader tenant administration

## Platform Rules

- Keep tenant isolation and audit active for all business data
- Treat pagination as mandatory on core list APIs
- Keep load testing focused on read-heavy customer, product, order, and billing flows
- Prefer fixed-line order-to-activate flows over broader telecom domain coverage
