-- db/migrations/009_add_product_archiving.sql
ALTER TABLE products 
  ADD COLUMN archived BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN archived_at TIMESTAMP NULL;
