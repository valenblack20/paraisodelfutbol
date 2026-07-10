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

-- 3. Insertar imágenes de productos
INSERT INTO product_images (id, product_id, image_path, alt_text, display_order, is_primary)
VALUES
-- Argentina (id 1)
(1, 1, '/Imagenes/arg_home_3stars.webp', 'Frente de Camiseta Argentina 3 Estrellas', 0, 1),
(2, 1, '/Imagenes/arg_home_3stars_back.webp', 'Dorso de Camiseta Argentina 3 Estrellas', 1, 0),
-- Boca (id 2)
(3, 2, '/Imagenes/boca_home_24.webp', 'Frente de Camiseta Boca Juniors Titular 2024', 0, 1),
(4, 2, '/Imagenes/boca_home_24_back.webp', 'Dorso de Camiseta Boca Juniors Titular 2024', 1, 0),
-- River (id 3)
(5, 3, '/Imagenes/river_home_24.webp', 'Frente de Camiseta River Plate Titular 2024', 0, 1),
(6, 3, '/Imagenes/river_home_24_back.webp', 'Dorso de Camiseta River Plate Titular 2024', 1, 0),
-- Inter Miami (id 4)
(7, 4, '/Imagenes/inter_miami_messi.webp', 'Frente de Camiseta Inter Miami Messi 10', 0, 1),
(8, 4, '/Imagenes/inter_miami_messi_back.webp', 'Dorso de Camiseta Inter Miami Messi 10', 1, 0),
-- Real Madrid (id 5)
(9, 5, '/Imagenes/real_madrid_titular.webp', 'Frente de Camiseta Real Madrid Titular 2024/25', 0, 1),
(10, 5, '/Imagenes/real_madrid_titular_back.webp', 'Dorso de Camiseta Real Madrid Titular 2024/25', 1, 0)
ON DUPLICATE KEY UPDATE
  product_id = VALUES(product_id),
  image_path = VALUES(image_path),
  alt_text = VALUES(alt_text),
  display_order = VALUES(display_order),
  is_primary = VALUES(is_primary);

-- 4. Insertar variantes de talles (S, M, L, XL, XXL) distribuyendo el stock total
INSERT INTO product_variants (id, product_id, size_code, sku, stock, active, display_order)
VALUES
-- Argentina (id 1, stock 50)
(1, 1, 'S', 'ARG-HOME-3S-S', 10, 1, 1),
(2, 1, 'M', 'ARG-HOME-3S-M', 10, 1, 2),
(3, 1, 'L', 'ARG-HOME-3S-L', 10, 1, 3),
(4, 1, 'XL', 'ARG-HOME-3S-XL', 10, 1, 4),
(5, 1, 'XXL', 'ARG-HOME-3S-XXL', 10, 1, 5),
-- Boca (id 2, stock 30)
(6, 2, 'S', 'BOC-HOME-24-S', 6, 1, 1),
(7, 2, 'M', 'BOC-HOME-24-M', 6, 1, 2),
(8, 2, 'L', 'BOC-HOME-24-L', 6, 1, 3),
(9, 2, 'XL', 'BOC-HOME-24-XL', 6, 1, 4),
(10, 2, 'XXL', 'BOC-HOME-24-XXL', 6, 1, 5),
-- River (id 3, stock 25)
(11, 3, 'S', 'RIV-HOME-24-S', 5, 1, 1),
(12, 3, 'M', 'RIV-HOME-24-M', 5, 1, 2),
(13, 3, 'L', 'RIV-HOME-24-L', 5, 1, 3),
(14, 3, 'XL', 'RIV-HOME-24-XL', 5, 1, 4),
(15, 3, 'XXL', 'RIV-HOME-24-XXL', 5, 1, 5),
-- Inter Miami (id 4, stock 40)
(16, 4, 'S', 'INT-MIA-MESSI-S', 8, 1, 1),
(17, 4, 'M', 'INT-MIA-MESSI-M', 8, 1, 2),
(18, 4, 'L', 'INT-MIA-MESSI-L', 8, 1, 3),
(19, 4, 'XL', 'INT-MIA-MESSI-XL', 8, 1, 4),
(20, 4, 'XXL', 'INT-MIA-MESSI-XXL', 8, 1, 5),
-- Real Madrid (id 5, stock 15)
(21, 5, 'S', 'RMA-HOME-24-S', 3, 1, 1),
(22, 5, 'M', 'RMA-HOME-24-M', 3, 1, 2),
(23, 5, 'L', 'RMA-HOME-24-L', 3, 1, 3),
(24, 5, 'XL', 'RMA-HOME-24-XL', 3, 1, 4),
(25, 5, 'XXL', 'RMA-HOME-24-XXL', 3, 1, 5)
ON DUPLICATE KEY UPDATE
  product_id = VALUES(product_id),
  size_code = VALUES(size_code),
  sku = VALUES(sku),
  stock = VALUES(stock),
  active = VALUES(active),
  display_order = VALUES(display_order);
