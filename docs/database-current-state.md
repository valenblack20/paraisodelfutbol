# Estado Actual de la Base de Datos (MySQL)

Este documento detalla el estado actual, estructura de tablas y consideraciones de la base de datos de "El Paraíso del Fútbol" tras completar la Fase 2.

---

## 1. Estructura del Esquema de Catálogo (Fase 2)

El esquema actual consta de dos tablas principales relacionales y una tabla de control de migraciones:

### Tabla: `categories`
Almacena las clasificaciones de las camisetas para ordenación y filtros estructurados.

| Columna | Tipo | Nullable | Default | Extra |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | No | *NULL* | `AUTO_INCREMENT`, `PRIMARY KEY` |
| `name` | `VARCHAR(100)` | No | *NULL* | |
| `slug` | `VARCHAR(120)` | No | *NULL* | `UNIQUE` |
| `product_type`| `ENUM('CLUB', 'NATIONAL_TEAM', 'OTHER')` | No | *NULL* | |
| `scope` | `ENUM('NATIONAL', 'INTERNATIONAL')` | No | *NULL* | |
| `active` | `BOOLEAN` | No | `TRUE` | |
| `display_order`| `INT UNSIGNED` | No | `0` | |
| `created_at` | `TIMESTAMP` | No | `CURRENT_TIMESTAMP` | |
| `updated_at` | `TIMESTAMP` | No | `CURRENT_TIMESTAMP` | `ON UPDATE CURRENT_TIMESTAMP` |

- **Índices:**
  - `idx_categories_active_display` compuesto en `(active, display_order)`.

---

### Tabla: `products`
Almacena las camisetas físicas y sus atributos comerciales y de inventario.

| Columna | Tipo | Nullable | Default | Extra |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | No | *NULL* | `AUTO_INCREMENT`, `PRIMARY KEY` |
| `category_id` | `BIGINT UNSIGNED` | No | *NULL* | `FOREIGN KEY -> categories.id` (RESTRICT) |
| `slug` | `VARCHAR(180)` | No | *NULL* | `UNIQUE` |
| `sku` | `VARCHAR(80)` | Sí | *NULL* | `UNIQUE` |
| `name` | `VARCHAR(180)` | No | *NULL* | |
| `description` | `TEXT` | Sí | *NULL* | |
| `retail_price`| `DECIMAL(12, 2)` | No | *NULL* | Check `retail_price >= 0` |
| `wholesale_price`| `DECIMAL(12, 2)`| Sí | *NULL* | Check `wholesale_price IS NULL OR >= 0` |
| `wholesale_minimum`| `INT UNSIGNED`| No | `6` | Check `wholesale_minimum >= 1` |
| `stock` | `INT UNSIGNED` | No | `0` | Check `stock >= 0` |
| `primary_image_path`| `VARCHAR(500)` | No | *NULL* | |
| `featured` | `BOOLEAN` | No | `FALSE` | |
| `published` | `BOOLEAN` | No | `TRUE` | |
| `created_at` | `TIMESTAMP` | No | `CURRENT_TIMESTAMP` | |
| `updated_at` | `TIMESTAMP` | No | `CURRENT_TIMESTAMP` | `ON UPDATE CURRENT_TIMESTAMP` |

- **Índices:**
  - `idx_products_published_featured` compuesto en `(published, featured)`.
  - `idx_products_created_at` compuesto en `(created_at)`.
  - Clave foránea en `category_id` (implícita).

---

### Tabla: `schema_migrations`
Controla el historial de cambios aplicados por el sistema de migraciones.

| Columna | Tipo | Nullable | Default | Extra |
| :--- | :--- | :--- | :--- | :--- |
| `version` | `VARCHAR(100)` | No | *NULL* | `PRIMARY KEY` |
| `applied_at` | `TIMESTAMP` | No | `CURRENT_TIMESTAMP` | |

---

## 2. Invariantes de Integridad Soportados
- Los precios (`retail_price`, `wholesale_price`) y el inventario (`stock`) no pueden ser negativos.
- La cantidad mínima para acceder al precio mayorista (`wholesale_minimum`) debe ser de al menos 1 unidad.
- Estos invariantes se validan a nivel de base de datos (`CHECK` constraints de MySQL 8.0.16+) y también a nivel de aplicación dentro del `ProductMapper`.
