# Modelo de Productos, Variantes e Imágenes

Este documento detalla la estructura lógica de datos, la gestión de inventario por variante de talle, la galería de imágenes y la evolución del carrito de compras para "El Paraíso del Fútbol".

---

## 1. Estructura de Modelos de Dominio

Para optimizar las consultas y mantener el catálogo ágil, separamos el modelo en dos interfaces de dominio:

### ProductSummary
Utilizado para las grillas generales del catálogo (ej. `/productos` e `index.astro`). No realiza JOINs pesados de imágenes secundarias o variantes.
- Atributos básicos comerciales (`id`, `slug`, `sku`, `name`, `retailPrice`, `wholesalePrice`, `wholesaleMinimum`, `stock` (legacy), `primaryImagePath`, `featured`, `published`).
- `category` (Objeto Category: `id`, `name`, `slug`, `productType`, `scope`).

### ProductDetail
Utilizado para la página de detalle del producto (`/productos/[slug]`). Extiende `ProductSummary` e incluye:
- `images` (Array de `ProductImage`: `id`, `imagePath`, `altText`, `displayOrder`, `isPrimary`).
- `variants` (Array de `ProductVariant`: `id`, `sizeCode`, `sku`, `stock`, `active`, `displayOrder`).

---

## 2. Inventario y Variantes de Talle

- **Fuente de Verdad del Stock:** La suma de stock de las variantes (`product_variants.stock`) es la fuente de verdad del inventario por talle para futuras fases. La columna `products.stock` queda como un caché temporal/legado en esta fase.
- **Talles Soportados:** Se configuran los talles estándares `S`, `M`, `L`, `XL`, `XXL`.
- **Integridad:** El stock de cada variante no puede ser negativo (`CHECK stock >= 0`). Si una variante de talle llega a stock `0`, se deshabilita visualmente su selección en la interfaz de usuario.

---

## 3. Identidad de Ítems del Carrito (Cart Line Identity)

Para soportar múltiples talles de un mismo producto en el carrito, la identidad única de cada línea del carrito se compone de:
```
cartLineId = productId + "_" + variantId
```
- **Agregar el mismo producto y mismo talle:** Incrementa la cantidad de esa línea.
- **Agregar el mismo producto con diferente talle:** Crea una línea separada.
- **Límites de Stock:** La interfaz del carrito y del selector controlan que la cantidad seleccionada no supere en ningún momento el stock real de la variante de talle.
- **Persistencia en LocalStorage:** El carrito migra su almacenamiento a la clave versionada `paraiso-cart-v2` para evitar incompatibilidades con datos de la Fase 1.

---

## 4. Regla Mayorista Sincronizada

La lógica mayorista se calcula centralizadamente por producto:
- **Regla:** Una línea de producto accede al precio mayorista (`wholesalePrice`) cuando la cantidad acumulada de ese mismo producto **a lo largo de todos sus talles/variantes** en el carrito alcanza o supera el valor `wholesaleMinimum` del producto.
- Los subtotales, ahorros y cantidades restantes para calificar se calculan dinámicamente en tiempo real en la barra lateral del carrito.
