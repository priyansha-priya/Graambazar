-- =====================================================================
-- GramBazaar — performance indexes (PROPOSAL, not yet applied anywhere)
-- Requires 001_init.sql.
--
-- PostgreSQL indexes primary keys and UNIQUE columns automatically, but
-- not foreign keys. Each index below backs a real screen or query in
-- the current frontend.
--
-- On a large live table, create these with CREATE INDEX CONCURRENTLY
-- instead (that cannot run inside a transaction).
-- =====================================================================

-- Marketplace discovery & delivery coverage (App.tsx shop list, getDeliveryRelationship)
CREATE INDEX sellers_village_active_idx      ON sellers (village_id) WHERE status = 'ACTIVE';
CREATE INDEX seller_service_villages_vil_idx ON seller_service_villages (village_id);
CREATE INDEX seller_verticals_vertical_idx   ON seller_verticals (vertical_id) WHERE is_primary;

-- Storefront & catalog
CREATE INDEX products_storefront_idx ON products (seller_id, category_id)
  WHERE is_active AND moderation_status = 'APPROVED' AND deleted_at IS NULL;
CREATE INDEX products_moderation_idx ON products (moderation_status, created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX product_variants_product_idx   ON product_variants (product_id) WHERE deleted_at IS NULL;
CREATE INDEX categories_vertical_parent_idx ON categories (vertical_id, parent_id);

-- Customer
CREATE INDEX customer_addresses_user_idx ON customer_addresses (user_id) WHERE deleted_at IS NULL;
CREATE INDEX orders_customer_idx         ON orders (customer_id, created_at DESC);

-- Seller terminal
CREATE INDEX orders_seller_status_idx ON orders (seller_id, status, created_at DESC);
CREATE INDEX orders_incoming_idx      ON orders (accept_deadline_at)
  WHERE status IN ('placed','pending');
CREATE INDEX seller_notifs_unread_idx ON seller_order_notifications (seller_id, created_at DESC)
  WHERE read_at IS NULL;

-- Order detail
CREATE INDEX order_items_order_idx   ON order_items (order_id);
CREATE INDEX order_items_product_idx ON order_items (product_id);
CREATE INDEX order_events_order_idx  ON order_status_events (order_id, created_at);

-- Admin order / finance screens
CREATE INDEX orders_status_created_idx  ON orders (status, created_at DESC);
CREATE INDEX orders_village_created_idx ON orders (village_id, created_at DESC);
CREATE INDEX payment_tx_order_idx       ON payment_transactions (order_id);
CREATE INDEX refunds_order_idx          ON refunds (order_id);
CREATE INDEX refunds_open_idx           ON refunds (status, initiated_at)
  WHERE status IN ('INITIATED','PROCESSING');
CREATE INDEX payouts_seller_idx         ON seller_payouts (seller_id, period_end DESC);
CREATE INDEX support_open_idx           ON support_cases (status, created_at DESC);
CREATE INDEX support_order_idx          ON support_cases (order_id);
CREATE INDEX reviews_seller_idx         ON reviews (seller_id, created_at DESC) WHERE status = 'PUBLISHED';
CREATE INDEX applications_status_idx    ON seller_applications (status, applied_at);

-- Udhari
CREATE INDEX credit_accounts_customer_idx ON credit_accounts (customer_id);
CREATE INDEX ledger_account_idx ON credit_ledger_entries (credit_account_id, posted_at DESC);
CREATE INDEX ledger_due_idx     ON credit_ledger_entries (due_date)
  WHERE entry_type = 'CREDIT_SALE' AND status = 'POSTED';
CREATE INDEX ledger_order_idx   ON credit_ledger_entries (order_id);
CREATE INDEX disputes_open_idx  ON credit_disputes (status) WHERE status IN ('OPEN','UNDER_REVIEW');

-- Safety
CREATE INDEX exam_attempts_seller_idx ON safety_exam_attempts (seller_id, submitted_at DESC);
CREATE INDEX inspections_seller_idx   ON safety_inspections (seller_id, inspected_at DESC);

-- Audit (also serves refund / payout / KYC-document / seller-activity history)
CREATE INDEX audit_created_idx ON audit_logs (created_at DESC);
CREATE INDEX audit_target_idx  ON audit_logs (target_entity, target_id, created_at DESC);
CREATE INDEX audit_actor_idx   ON audit_logs (actor_user_id, created_at DESC);

-- Optional: only if shop/product search moves to the server (App.tsx matches with includes()).
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX sellers_name_trgm  ON sellers  USING gin (public_name gin_trgm_ops);
-- CREATE INDEX products_name_trgm ON products USING gin (name gin_trgm_ops);
