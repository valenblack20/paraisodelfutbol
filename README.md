# El Paraíso del Fútbol

Tu tienda online de camisetas de fútbol en Argentina. Ventas minoristas y mayoristas con envíos a todo el país. Acentos celestes y dorados del campeón.

Este proyecto ha sido migrado de un sitio estático compatible con GitHub Pages a una aplicación dinámica ejecutada en el servidor (SSR) mediante Node.js y conectada a una base de datos MySQL real.

## Arquitectura de la Aplicación

La aplicación implementa una arquitectura desacoplada en capas para garantizar la escalabilidad de sus módulos (por ejemplo, el catálogo de productos):

```
Astro Page (SSR) ──> ProductService ──> ProductRepository ──> MySQL
```

* **Astro Pages (SSR):** Las vistas dinámicas consumen los servicios inyectados desde los contenedores de dependencias y manejan posibles errores de conexión en el servidor.
* **Services:** Encapsulan la lógica de negocio y validación de entrada, delegando la persistencia de datos a los repositorios.
* **Repositories:** Administran las consultas SQL crudas con campos explícitos, protegiendo las capas superiores de implementaciones específicas de base de datos.
* **Mappers:** Realizan la traducción bidireccional entre las filas de base de datos (snake_case) y los modelos de dominio (camelCase) garantizando tipado estricto e integridad de datos.

## Requisitos de Entorno

Este proyecto requiere Node.js v18.14.1 o superior y una base de datos MySQL.

### Configuración de Entorno (.env)

Crea un archivo `.env` en la raíz del proyecto basándote en el archivo `.env.example`:

```ini
# Configuración de Base de Datos MySQL
DB_HOST=your_mysql_host
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=xxxx
DB_NAME=paraiso_futbol_db
DB_CONNECTION_LIMIT=10
DB_SSL=false

# Configuración de Entorno e URLs de Sitio
NODE_ENV=development
PUBLIC_SITE_URL=https://paraisofutbol.com

# Configuración de WhatsApp
WHATSAPP_NUMBER=5491100000000
PUBLIC_WHATSAPP_NUMBER=5491100000000

# Seguridad
ENABLE_UNSAFE_ADMIN=false
```

> [!WARNING]
> Nunca expongas ni versionas secretos en repositorios públicos de Git. Asegúrate de que `.env` está en tu `.gitignore`.

## Comandos Útiles

Instala las dependencias de forma determinista antes de iniciar el desarrollo o producción:

```bash
# Instalación limpia y exacta
npm ci
```

### Desarrollo Local

```bash
# Iniciar servidor de desarrollo en modo SSR local
npm run dev
```

### Construcción y Compilación (Producción)

```bash
# Verificar tipos de TypeScript en archivos Astro y TS
npm run check

# Compilar la aplicación para producción (genera un servidor standalone en dist/server/entry.mjs)
npm run build
```

### Comandos de Base de Datos (Migraciones y Semillas)

```bash
# Ver el estado de las migraciones (aplicadas y pendientes)
npm run db:status

# Aplicar las migraciones de esquema pendientes de forma transaccional
npm run db:migrate

# Insertar/actualizar datos semilla del catálogo de forma idempotente
npm run db:seed
```

> [!WARNING]
> Los datos semilla (`db:seed`) no se ejecutan automáticamente durante el inicio normal de la aplicación para evitar escrituras accidentales o sobrecargar la base de datos en producción. Deben correrse de forma manual.

### Ejecución en Producción

```bash
# Iniciar el servidor compilado de Node SSR
npm start
```

## Endpoints de Monitoreo (Health Checks)

La aplicación expone las siguientes rutas de monitoreo en producción:

* **/api/health:** Devuelve HTTP 200 si la aplicación web se encuentra activa.
* **/api/health/database:** Devuelve HTTP 200 si la conexión con la base de datos MySQL es correcta, o HTTP 503 si el servicio de BD no está disponible. No expone detalles del motor ni credenciales internas.

## Restricción de Despliegue Estático

> [!IMPORTANT]
> El proyecto ha sido reconfigurado para **Astro SSR (Server-Side Rendering)**. Las plataformas de hosting estático (como GitHub Pages) **ya no sirven como runtime productivo** debido a que la aplicación requiere un proceso de backend persistente Node.js para interactuar con MySQL en tiempo real. Debe desplegarse en VPS (como DigitalOcean), Railway, Render, Fly.io o similar.
