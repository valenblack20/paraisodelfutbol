-- db/migrations/008_add_product_version.sql
ALTER TABLE products ADD COLUMN version INT UNSIGNED NOT NULL DEFAULT 1;
