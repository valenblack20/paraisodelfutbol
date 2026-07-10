# Arquitectura Técnica y Guía de Desarrollo

Este documento detalla el diseño de software implementado para "El Paraíso del Fútbol" (Fase 1) y define las directrices arquitectónicas para futuros módulos.

## Estructura en Capas

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
   - Implementan lógica de contingencia y control de errores visuales (ej. cargando catálogos alternativos o mensajes explicativos).

2. **ProductService (Servicios / Negocio):**
   - Localizado en `src/modules/products/product.service.ts`.
   - Encapsula la lógica de negocio, validaciones y reglas de negocio del módulo.
   - Trabaja únicamente con el contrato del repositorio (`ProductRepository`) y tipos de dominio (`Product`), lo que permite que sea testeable unitariamente de forma aislada.

3. **ProductRepository (Interfaz):**
   - Localizado en `src/modules/products/product.repository.ts`.
   - Define el contrato/interfaz de TypeScript de los métodos de persistencia requeridos por la lógica de negocio.

4. **MySqlProductRepository (Infraestructura / Persistencia):**
   - Localizado en `src/modules/products/mysql-product.repository.ts`.
   - Implementa de forma concreta el contrato de repositorio interactuando con la base de datos MySQL mediante `mysql2`.
   - Realiza consultas parametrizadas explícitas (`SELECT id, nombre...`) y ordenaciones determinísticas (`ORDER BY id ASC`).
   - Invoca al Mapper para retornar objetos mapeados de dominio.

5. **ProductMapper (Mapeadores):**
   - Localizado en `src/modules/products/product.mapper.ts`.
   - Realiza el saneamiento, casteo (ej. `DECIMAL` a `number`) y traducción del formato de base de datos (`ProductRow` en snake_case) al formato del modelo de dominio (`Product` en camelCase).

## Dirección de Dependencias

Las dependencias fluyen estrictamente desde la periferia (Infraestructura y Presentación) hacia el centro (Interfaces y Dominio). Las capas internas (Servicios e Interfaces) nunca dependen de bases de datos específicas o de frameworks.

La inyección de dependencias se coordina en el archivo contenedor (`product.container.ts`):
```typescript
import { MySqlProductRepository } from './mysql-product.repository';
import { ProductService } from './product.service';
import { getDatabasePool } from '../../infrastructure/database/mysql';

const pool = getDatabasePool();
const productRepository = new MySqlProductRepository(pool);
export const productService = new ProductService(productRepository);
```

## Reglas para Futuros Módulos

Al implementar nuevas funcionalidades (como usuarios, pedidos, pagos) en fases posteriores:
1. **No mezclar capas:** No agregues consultas SQL, pools de BD o lógica de persistencia en páginas Astro o endpoints de API directamente.
2. **Crear tipos explícitos:** Cada módulo debe contar con su correspondiente archivo `.types.ts` de dominio (camelCase) y `-row.types.ts` de persistencia (snake_case).
3. **Mapear siempre:** Usa un Mapper estricto sin comodines `any` para verificar la existencia e integridad de los campos numéricos y nullables.
4. **SELECTs explícitos:** No utilices `SELECT *`. Lista todas las columnas requeridas en el repositorio.
