# Guía de Despliegue en Producción (SSR)

Este documento detalla los requisitos, variables y pasos obligatorios para desplegar la aplicación "El Paraíso del Fútbol" en un entorno de producción real.

## Requisitos de Infraestructura

La aplicación opera bajo el adaptador `@astrojs/node` en modo `standalone`, lo que significa que **requiere un servidor persistente de Node.js corriendo en segundo plano**.

* **Runtime de Node.js Soportado:** Node.js v18.14.1 o superior (se recomienda Node.js v22.x).
* **Acceso de Red a MySQL:** El servidor de producción debe tener visibilidad a nivel de red para conectarse a la IP del servidor de base de datos MySQL (por el puerto TCP 3306).
* **Incompatibilidad Estática:** Los servicios de alojamiento puramente estáticos (GitHub Pages, Vercel/Netlify en plan estático) **no son compatibles** con este proyecto. Debe desplegarse en servidores VPS, Railway, Render, Fly.io, Heroku o entornos virtuales con soporte para Node.js persistente.

## Variables de Entorno Requeridas

Antes de arrancar la aplicación, se deben inyectar las siguientes variables en el servidor de producción:

| Variable | Descripción | Ejemplo / Valor |
| :--- | :--- | :--- |
| `NODE_ENV` | Entorno de ejecución | `production` |
| `DB_HOST` | Dirección IP o dominio del host MySQL | `your_mysql_host` |
| `DB_PORT` | Puerto de conexión de base de datos | `3306` |
| `DB_USER` | Usuario de base de datos | `your_db_user` |
| `DB_PASSWORD` | Contraseña del usuario MySQL | `xxxxxx` |
| `DB_NAME` | Nombre de la base de datos | `paraiso_futbol_db` |
| `DB_CONNECTION_LIMIT`| Límite del pool de conexiones | `10` |
| `DB_SSL` | Activar SSL seguro para MySQL | `false` (o `true` según servidor) |
| `PUBLIC_SITE_URL` | URL pública oficial de la aplicación | `https://paraisofutbol.com` |
| `PUBLIC_WHATSAPP_NUMBER`| Número telefónico de atención al cliente | `5491100000000` |
| `ENABLE_UNSAFE_ADMIN` | Permitir acceso al panel admin inseguro | `false` (Siempre `false` en producción) |

> [!CAUTION]
> Asegúrate de que `ENABLE_UNSAFE_ADMIN` esté configurado en `false` en producción para evitar accesos indebidos a la ruta `/admin` que opera temporalmente mediante `localStorage`.

## Proceso de Build y Start de Producción

Para desplegar y arrancar la aplicación:

1. **Instalación de Dependencias:**
   ```bash
   npm ci
   ```
2. **Compilación del Proyecto:**
   ```bash
   npm run build
   ```
   Esto compila los archivos de cliente y servidor en la carpeta `dist/`. El punto de entrada para levantar la aplicación se genera en `dist/server/entry.mjs`.

3. **Ejecución del Servidor Standalone:**
   ```bash
   npm start
   ```
   *(Equivale internamente a ejecutar `node ./dist/server/entry.mjs`)*

4. **Monitoreo de Procesos (Recomendado):**
   En servidores virtuales (VPS), se aconseja utilizar administradores de procesos como **PM2** para asegurar que el proceso se reinicie automáticamente ante caídas:
   ```bash
   pm2 start dist/server/entry.mjs --name paraiso-futbol
   ```

## Monitoreo de Salud (Health Checks)

Configure su orquestador o balanceador de carga para monitorear el estado del servicio:
- **Ping de Aplicación:** Peticiones HTTP GET a `/api/health` (debe retornar status 200).
- **Ping de Base de Datos:** Peticiones HTTP GET a `/api/health/database` (debe retornar status 200 si conecta y responde, o 503 si el pool está caído).
