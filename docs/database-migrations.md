# Control de Versiones de Base de Datos - Migraciones y Semillas

Este documento detalla el sistema de migraciones personalizado y los datos semilla del catálogo para "El Paraíso del Fútbol".

---

## 1. Funcionamiento del Sistema de Migraciones

El proyecto cuenta con un sistema pequeño y explícito de migraciones SQL sin ORM, ubicado en `scripts/database/migrate.js`.

### Tabla Interna de Registro
Las versiones aplicadas se registran en la tabla interna `schema_migrations`:
- `version` (VARCHAR(100), PRIMARY KEY): Nombre del archivo de migración (ej. `001_create_catalog_tables.sql`).
- `applied_at` (TIMESTAMP): Fecha y hora en que se aplicó la migración.

### Flujo de Ejecución del Runner
1. Lee los archivos SQL ordenados alfabéticamente de `db/migrations/`.
2. Consulta la tabla `schema_migrations` para identificar cuáles ya fueron aplicadas.
3. Ejecuta únicamente las migraciones pendientes.
4. Cada migración se ejecuta dentro de una transacción de base de datos.
5. Si ocurre algún error en las sentencias de una migración, se realiza un rollback automático y se aborta el proceso inmediatamente.
6. Nunca se ejecuta una migración dos veces.
7. Los secretos y contraseñas de la base de datos están protegidos y no se exponen en los logs.

---

## 2. Comandos Disponibles

Los siguientes comandos pueden ejecutarse desde la terminal utilizando npm:

### Ver Estado de las Migraciones
Muestra una lista de todas las migraciones e indica si están aplicadas o pendientes:
```bash
npm run db:status
```

### Aplicar Migraciones Pendientes
Aplica secuencialmente todas las migraciones SQL pendientes en la base de datos:
```bash
npm run db:migrate
```

### Poblar Datos Semilla
Inserta o actualiza de manera idempotente los productos iniciales y sus categorías:
```bash
npm run db:seed
```
*Advertencia: Los seeds no se ejecutan automáticamente durante el inicio del servidor para evitar escrituras accidentales o sobrecarga en producción. Deben ejecutarse explícitamente mediante este comando.*

---

## 3. Guía de Desarrollo para Nuevos Cambios

### Cómo Crear una Nueva Migración
1. Creá un nuevo archivo SQL en `db/migrations/`.
2. Utilizá un prefijo numérico secuencial de 3 dígitos (ej: `003_add_new_table.sql`).
3. Asegurá que la migración no contenga instrucciones como `CREATE DATABASE`, `USE nombre_base` o `DROP DATABASE`. La conexión ya selecciona automáticamente la base de datos configurada en el archivo `.env`.

### Modificación de Migraciones
> [!IMPORTANT]
> **Nunca modifiques un archivo de migración que ya haya sido aplicado en producción.**
> Cualquier cambio posterior, corrección de errores o alteración de esquema debe realizarse mediante una **nueva migración** (ej. `003_alter_products_table.sql`).

### Estrategia de Respaldo (Backup)
Antes de aplicar migraciones destructivas o realizar cambios en el esquema en producción, realizá un backup manual de la base de datos:
1. Accedé al panel de control de tu hosting (Hostinger phpMyAdmin).
2. Seleccioná la base de datos.
3. Hacé clic en **Exportar**, elegí el método rápido y descargá el archivo `.sql`.
4. En caso de fallo catastrófico, podés restaurar importando este archivo `.sql` de respaldo.
