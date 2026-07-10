-- Migración 002: Crear índices útiles para búsquedas y filtros de catálogo

-- Índice compuesto para productos publicados y destacados
CREATE INDEX idx_products_published_featured ON products (published, featured);

-- Índice para ordenación por fecha de creación de productos
CREATE INDEX idx_products_created_at ON products (created_at);

-- Índice compuesto en categorías activas y su orden de visualización
CREATE INDEX idx_categories_active_display ON categories (active, display_order);
