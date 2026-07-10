# Arquitectura Técnica y Guía de Desarrollo

Este documento detalla el diseño de software implementado para "El Paraíso del Fútbol" (Fase 3) y define las directrices arquitectónicas para futuros módulos.

---

## 1. Estructura en Capas

El módulo de productos (`src/modules/products/`) está estructurado siguiendo los principios de la arquitectura limpia, aislándola del framework (Astro) y del motor de base de datos específico (MySQL).

```
[Astro Pages / Endpoints] (Capa de Presentación)
          │
          ▼
   [ProductService]       (Capa de Aplicación / Negocio)
          │
          ▼
  [ProductRepository]     (Capa de Interfaz / Abstracción)
          │
          ▼
[MySqlProductRepository]  (Capa de Infraestructura / Persistencia)
```

### Responsabilidades de Capas

1. **Astro Pages (Presentación):**
   - Archivos localizados en `src/pages/`.
   - Responsables de renderizar HTML/CSS (SSR) y coordinar el comportamiento del cliente.
   - Consumen los servicios exportados desde los contenedores de dependencias (`product.container.ts`).
   - Tienen prohibido ejecutar consultas SQL directas o instanciar conectores de base de datos.
   - Implementan lógica de contingencia y control de errores visuales.

2. **ProductService (Servicios / Negocio):**
   - Localizado en `src/modules/products/product.service.ts`.
   - Encapsula la lógica de negocio, validaciones y reglas de negocio del catálogo.
   - Valida el formato de slug y oculta los detalles internos de base de datos de la UI.

3. **ProductRepository (Interfaz):**
   - Localizado en `src/modules/products/product.repository.ts`.
   - Define las firmas de lectura de catálogo (`findCatalogProducts`) y detalle público (`findPublicBySlug`).

4. **MySqlProductRepository (Infraestructura / Persistencia):**
   - Localizado en `src/modules/products/mysql-product.repository.ts`.
   - Implementa de forma concreta el contrato de repositorio interactuando con MySQL.
   - Evita problemas de producto cartesiano realizando consultas parametrizadas ordenadas y secuenciales para el detalle del producto.

5. **ProductMapper (Mapeadores):**
   - Localizado en `src/modules/products/product.mapper.ts`.
   - Realiza el saneamiento y casteo traduciendo del formato de base de datos (`ProductRow`, `ProductImageRow`, `ProductVariantRow`) al modelo de dominio (`ProductSummary`, `ProductDetail`).

---

## 2. Separación de Modelos de Lectura (Fase 3)

Para evitar la sobrecarga de consultas y transferencia innecesaria de datos, se divide la lectura en dos modelos:
- **ProductSummary (Catálogo):** Ligero, contiene datos comerciales del producto y categoría pero **sin** variantes de talles o imágenes secundarias.
- **ProductDetail (Detalle):** Completo, incluye la categoría relacional, galería ordenada de imágenes (`ProductImage[]`) y variantes de talle activas (`ProductVariant[]`).

---

## 3. Reglas para Futuros Módulos

Al implementar nuevas funcionalidades en fases posteriores:
1. **No mezclar capas:** No agregues consultas SQL, pools de BD o lógica de persistencia en páginas Astro directamente.
2. **Crear tipos explícitos:** Cada módulo debe contar con su correspondiente archivo `.types.ts` de dominio (camelCase) y `-row.types.ts` de persistencia (snake_case).
3. **Mapear siempre:** Usa un Mapper estricto sin comodines `any` para verificar la existencia e integridad de los campos numéricos y nullables.
4. **SELECTs explícitos:** No utilices `SELECT *`. Lista todas las columnas requeridas en el repositorio.
