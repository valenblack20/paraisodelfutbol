# El Paraíso del Fútbol - Astro SSR + MySQL

Esta aplicación es una plataforma de comercio electrónico para camisetas de fútbol, migrada a renderizado del lado del servidor (SSR) utilizando Astro y MySQL.

---

## Requisitos de Entorno

Creá un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```ini
# Configuración del Entorno Astro
NODE_ENV=development
PORT=4321

# Configuración de Base de Datos MySQL
DB_HOST=your_mysql_host
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=xxxx
DB_NAME=paraiso_futbol_db
DB_CONNECTION_LIMIT=10
DB_SSL=false

# Datos de Negocio
PUBLIC_SITE_URL=https://paraisofutbol.com
PUBLIC_WHATSAPP_NUMBER=5491100000000

# Seguridad
ENABLE_UNSAFE_ADMIN=false
```

> [!WARNING]
> Nunca expongas ni versiones secretos en repositorios públicos de Git. Asegúrate de que `.env` está en tu `.gitignore`.

---

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

---

## Estructura de Rutas Clave

* **/api/health:** Devuelve HTTP 200 si la aplicación web se encuentra activa.
* **/api/health/database:** Devuelve HTTP 200 si la conexión con la base de datos MySQL es correcta.
* **/productos:** Catálogo interactivo de camisetas.
* **/productos/[slug]:** Detalle del producto con galería de imágenes interactiva, selector de talle y stock dinámico.

---

## Restricción de Despliegue Estático

> [!IMPORTANT]
> El proyecto ha sido reconfigurado para **Astro SSR (Server-Side Rendering)**. Las plataformas de hosting estático (como GitHub Pages) **ya no sirven como runtime productivo** debido a que la aplicación requiere un proceso de backend persistente Node.js para interactuar con MySQL en tiempo real. Debe desplegarse en VPS, Railway, Render, Fly.io o similar.
