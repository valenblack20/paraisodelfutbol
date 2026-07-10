-- Migración 003: Crear tabla de imágenes de productos

CREATE TABLE IF NOT EXISTS product_images (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  image_path VARCHAR(500) NOT NULL,
  alt_text VARCHAR(250) NULL,
  display_order INT UNSIGNED NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Relación de clave foránea
  CONSTRAINT fk_product_images_products
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON DELETE CASCADE
    ON UPDATE RESTRICT,
    
  -- Restricción única de imagen por producto
  CONSTRAINT uq_product_image_path UNIQUE (product_id, image_path)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices de búsqueda y ordenación
CREATE INDEX idx_product_images_order ON product_images (product_id, display_order);
CREATE INDEX idx_product_images_primary ON product_images (product_id, is_primary);
