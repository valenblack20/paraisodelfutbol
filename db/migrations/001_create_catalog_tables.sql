-- Migración 001: Crear tablas de categorías y productos

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  product_type ENUM('CLUB', 'NATIONAL_TEAM', 'OTHER') NOT NULL,
  scope ENUM('NATIONAL', 'INTERNATIONAL') NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT UNSIGNED NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  sku VARCHAR(80) NULL UNIQUE,
  name VARCHAR(180) NOT NULL,
  description TEXT NULL,
  retail_price DECIMAL(12,2) NOT NULL,
  wholesale_price DECIMAL(12,2) NULL,
  wholesale_minimum INT UNSIGNED NOT NULL DEFAULT 6,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  primary_image_path VARCHAR(500) NOT NULL,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Relación de clave foránea
  CONSTRAINT fk_products_categories
    FOREIGN KEY (category_id) REFERENCES categories (id)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT,
    
  -- Constraints de integridad (MySQL 8.0.16+)
  CONSTRAINT chk_retail_price CHECK (retail_price >= 0),
  CONSTRAINT chk_wholesale_price CHECK (wholesale_price IS NULL OR wholesale_price >= 0),
  CONSTRAINT chk_wholesale_minimum CHECK (wholesale_minimum >= 1),
  CONSTRAINT chk_stock CHECK (stock >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
