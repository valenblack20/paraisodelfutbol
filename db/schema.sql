-- Script de creación de la base de datos y la tabla camisetas para "El Paraíso del Fútbol"

CREATE DATABASE IF NOT EXISTS paraiso_futbol_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE paraiso_futbol_db;

CREATE TABLE IF NOT EXISTS camisetas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo_foto VARCHAR(100) NOT NULL UNIQUE,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  precio_minorista DECIMAL(10, 2) NOT NULL,
  precio_mayorista DECIMAL(10, 2) NOT NULL,
  categoria VARCHAR(50) NOT NULL, -- 'Nacionales', 'Internacionales', 'Clubes', 'Selecciones'
  stock INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_categoria (categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar algunas camisetas iniciales de muestra
INSERT INTO camisetas (codigo_foto, nombre, descripcion, precio_minorista, precio_mayorista, categoria, stock)
VALUES 
('arg_home_3stars', 'Camiseta Selección Argentina - 3 Estrellas', 'La camiseta oficial del Campeón del Mundo con las tres estrellas doradas y el parche oficial de campeón de la FIFA.', 45000.00, 32000.00, 'Selecciones', 50),
('boca_home_24', 'Camiseta Boca Juniors Titular 2024', 'Camiseta titular de Boca Juniors. Sentí la pasión xeneize en tu piel con el diseño tradicional azul y oro.', 42000.00, 30000.00, 'Clubes', 30),
('river_home_24', 'Camiseta River Plate Titular 2024', 'Camiseta titular de River Plate. La mítica banda roja cruzada con detalles modernos y tecnología de alta respirabilidad.', 42000.00, 30000.00, 'Clubes', 25),
('inter_miami_messi', 'Camiseta Inter Miami - Messi 10', 'La camiseta rosa de las garzas con el nombre y número del mejor jugador de la historia del fútbol.', 48000.00, 35000.00, 'Internacionales', 40),
('real_madrid_titular', 'Camiseta Real Madrid Titular 2024/25', 'La clásica camiseta blanca del rey de Europa, con detalles en dorado y la máxima elegancia.', 46000.00, 33000.00, 'Internacionales', 15)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);
