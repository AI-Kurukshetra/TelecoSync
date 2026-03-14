-- Remove schema objects that are no longer queried by the app runtime.
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS revenue_discrepancies CASCADE;
DROP TABLE IF EXISTS sla_violations CASCADE;
DROP TABLE IF EXISTS rating_rules CASCADE;
DROP TABLE IF EXISTS work_orders CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
