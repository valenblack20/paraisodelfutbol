# Estado Actual de la Base de Datos (MySQL)

Este documento detalla el estado actual, estructura de tablas y consideraciones de la base de datos de "El Paraíso del Fútbol".

## Tablas Relevantes Detectadas

Al inspeccionar de forma segura la base de datos online configurada, se constató que:
* **Estado:** La base de datos está vacía (0 tablas encontradas).
* **Definición de Referencia:** El script `db/schema.sql` contiene la estructura oficial para crear la tabla de `camisetas` en las fases subsiguientes.

### Estructura Oficial Esperada (Tabla: `camisetas`)

| Columna | Tipo | Nullable | Default | Extra |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | No | *NULL* | `AUTO_INCREMENT` |
| `codigo_foto` | `VARCHAR(100)` | No | *NULL* | `UNIQUE` |
| `nombre` | `VARCHAR(150)` | No | *NULL* | |
| `descripcion` | `TEXT` | Sí | *NULL* | |
| `precio_minorista`| `DECIMAL(10, 2)`| No | *NULL* | |
| `precio_mayorista`| `DECIMAL(10, 2)`| No | *NULL* | |
| `categoria` | `VARCHAR(50)` | No | *NULL* | |
| `stock` | `INT` | Sí | `0` | |
| `created_at` | `TIMESTAMP` | Sí | `CURRENT_TIMESTAMP` | |

* **Clave Primaria (PK):** `id`
* **Índices (Indexes):**
  - `idx_categoria` en la columna `categoria` (tipo `VARCHAR(50)`)
  - Índice implícito único en la columna `codigo_foto` (`UNIQUE KEY`)

## Campos Usados por el Frontend

Actualmente, las vistas del catálogo y componentes de camisetas utilizan los siguientes campos mapeados desde la base de datos:
- `id` (Identificador numérico)
- `codigo_foto` (String utilizado para referenciar localmente o de manera remota la imagen del producto)
- `nombre` (Título legible del producto)
- `descripcion` (Texto de descripción)
- `precio_minorista` (Precio de compra por unidad)
- `precio_mayorista` (Precio de compra en cantidad >= 6 unidades)
- `categoria` (Categoría de ordenación: Nacionales, Internacionales, Clubes, Selecciones)
- `stock` (Cantidad física disponible)

## Deuda Técnica

1. **Base de Datos Vacía:** El entorno de producción/online carece de tablas, por lo que las consultas fallarán hasta que se ejecute la migración (Fase 3).
2. **Falta de Migraciones Controladas:** Se depende de un script raw de SQL (`schema.sql`) para inicializar la base de datos en lugar de contar con un framework de migraciones (como Knex, Kysely, Prisma o TypeORM).
3. **Manejo Centralizado de Conexiones:** El pool de base de datos se inicializa en base a variables de entorno que contenían typos en FASE 0, lo cual impedía su conexión segura.

## Recomendaciones Futuras (Fase 2+)

Para escalar el catálogo, se propone incorporar las siguientes columnas e índices en futuras iteraciones:
* `slug`: Para URLs amigables en buscadores (e.g., `camisetas/camiseta-seleccion-argentina-3-estrellas`).
* `sku`: Código de referencia único de inventario.
* `published`: Boolean para ocultar o publicar productos sin tener que eliminarlos.
* `featured`: Boolean para destacar camisetas en la página de inicio.
* `wholesale_minimum`: Cantidad mínima configurable para acceder al precio mayorista (actualmente fijo en >= 6).
* `categories` (Tabla relacional): Reemplazar el campo plano `categoria` por una relación muchos-a-muchos.
* `product_images`: Permitir múltiples fotos por producto.
* `product_sizes` / `stock_sizes`: Manejar inventario detallado por talle (S, M, L, XL, XXL) en lugar de un stock plano único.
