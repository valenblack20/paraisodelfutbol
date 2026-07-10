-- Semilla de datos idempotente para categorías y productos

-- 1. Insertar categorías
INSERT INTO categories (id, name, slug, product_type, scope, active, display_order)
VALUES
(1, 'Selecciones', 'selecciones', 'NATIONAL_TEAM', 'INTERNATIONAL', 1, 1),
(2, 'Clubes Nacionales', 'clubes-nacionales', 'CLUB', 'NATIONAL', 1, 2),
(3, 'Clubes Internacionales', 'clubes-internacionales', 'CLUB', 'INTERNATIONAL', 1, 3)
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  product_type = VALUES(product_type),
  scope = VALUES(scope),
  active = VALUES(active),
  display_order = VALUES(display_order);

-- 2. Insertar productos
INSERT INTO products (id, category_id, slug, sku, name, description, retail_price, wholesale_price, wholesale_minimum, stock, primary_image_path, featured, published)
VALUES
(1, 1, 'camiseta-seleccion-argentina-3-estrellas', 'ARG-HOME-3S', 'Camiseta Selección Argentina - 3 Estrellas', 'La camiseta oficial del Campeón del Mundo con las tres estrellas doradas y el parche oficial de campeón de la FIFA.', 45000.00, 32000.00, 6, 50, '/Imagenes/arg_home_3stars.webp', 1, 1),
(2, 2, 'camiseta-boca-juniors-titular-2024', 'BOC-HOME-24', 'Camiseta Boca Juniors Titular 2024', 'Camiseta titular de Boca Juniors. Sentí la pasión xeneize en tu piel con el diseño tradicional azul y oro.', 42000.00, 30000.00, 6, 30, '/Imagenes/boca_home_24.webp', 0, 1),
(3, 2, 'camiseta-river-plate-titular-2024', 'RIV-HOME-24', 'Camiseta River Plate Titular 2024', 'Camiseta titular de River Plate. La mítica banda roja cruzada con detalles modernos y tecnología de alta respirabilidad.', 42000.00, 30000.00, 6, 25, '/Imagenes/river_home_24.webp', 0, 1),
(4, 3, 'camiseta-inter-miami-messi-10', 'INT-MIA-MESSI', 'Camiseta Inter Miami - Messi 10', 'La camiseta rosa de las garzas con el nombre y número del mejor jugador de la historia del fútbol.', 48000.00, 35000.00, 6, 40, '/Imagenes/inter_miami_messi.webp', 0, 1),
(5, 3, 'camiseta-real-madrid-titular-2024-25', 'RMA-HOME-24', 'Camiseta Real Madrid Titular 2024/25', 'La clásica camiseta blanca del rey de Europa, con detalles en dorado y la máxima elegancia.', 46000.00, 33000.00, 6, 15, '/Imagenes/real_madrid_titular.webp', 0, 1)
ON DUPLICATE KEY UPDATE
  category_id = VALUES(category_id),
  sku = VALUES(sku),
  name = VALUES(name),
  description = VALUES(description),
  retail_price = VALUES(retail_price),
  wholesale_price = VALUES(wholesale_price),
  wholesale_minimum = VALUES(wholesale_minimum),
  stock = VALUES(stock),
  primary_image_path = VALUES(primary_image_path),
  featured = VALUES(featured),
  published = VALUES(published);
