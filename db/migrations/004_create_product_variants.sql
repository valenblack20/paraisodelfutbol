-- Migración 004: Crear tabla de variantes de producto (talles)

CREATE TABLE IF NOT EXISTS product_variants (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  size_code VARCHAR(20) NOT NULL,
  sku VARCHAR(100) NULL UNIQUE,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Relación de clave foránea
  CONSTRAINT fk_product_variants_products
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON DELETE CASCADE
    ON UPDATE RESTRICT,
    
  -- Restricción única de talle por producto
  CONSTRAINT uq_product_variants_size UNIQUE (product_id, size_code),
  
  -- Restricción de integridad para el stock
  CONSTRAINT chk_variant_stock CHECK (stock >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices de búsqueda
CREATE INDEX idx_product_variants_lookup ON product_variants (product_id, active, display_order);
