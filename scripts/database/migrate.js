// Runner de Migraciones y Semillas para MySQL
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// Cargar variables de entorno de forma segura sin usar dependencias externas
const envPath = path.resolve(process.cwd(), '.env');
const envVars = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      let val = parts.slice(1).join('=').trim();
      if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
        val = val.substring(1, val.length - 1);
      }
      envVars[key] = val;
    }
  });
}

function getDbConfig() {
  return {
    host: envVars.DB_HOST || process.env.DB_HOST,
    port: parseInt(envVars.DB_PORT || process.env.DB_PORT || '3306'),
    user: envVars.DB_USER || process.env.DB_USER,
    password: envVars.DB_PASSWORD || process.env.DB_PASSWORD,
    database: envVars.DB_NAME || process.env.DB_NAME,
    ssl: (envVars.DB_SSL === 'true' || process.env.DB_SSL === 'true') ? { rejectUnauthorized: false } : undefined
  };
}

async function getDbConnection() {
  const config = getDbConfig();
  return await mysql.createConnection(config);
}

// Crear la tabla de schema_migrations si no existe
async function ensureMigrationsTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(100) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

// Obtener todas las migraciones del directorio db/migrations/
function getMigrationsList() {
  const migrationsDir = path.resolve(process.cwd(), 'db/migrations');
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }
  return fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
}

async function status() {
  console.log('--- ESTADO DE MIGRACIONES ---');
  let connection;
  try {
    connection = await getDbConnection();
    await ensureMigrationsTable(connection);

    const [rows] = await connection.query('SELECT version, applied_at FROM schema_migrations ORDER BY version ASC');
    const appliedVersions = new Set(rows.map(r => r.version));
    const allMigrations = getMigrationsList();

    if (allMigrations.length === 0) {
      console.log('No se encontraron archivos de migración en db/migrations.');
      return;
    }

    allMigrations.forEach(filename => {
      const isApplied = appliedVersions.has(filename);
      const statusText = isApplied ? 'Aplicada' : 'Pendiente';
      console.log(`[${isApplied ? 'X' : ' '}] ${filename} (${statusText})`);
    });
  } catch (error) {
    console.error('Error al obtener estado de migraciones:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

async function migrate() {
  console.log('--- EJECUTANDO MIGRACIONES ---');
  let connection;
  try {
    connection = await getDbConnection();
    await ensureMigrationsTable(connection);

    // Obtener aplicadas
    const [rows] = await connection.query('SELECT version FROM schema_migrations');
    const appliedVersions = new Set(rows.map(r => r.version));
    
    // Obtener todas y filtrar pendientes
    const allMigrations = getMigrationsList();
    const pendingMigrations = allMigrations.filter(file => !appliedVersions.has(file));

    if (pendingMigrations.length === 0) {
      console.log('La base de datos está actualizada. Cero migraciones pendientes.');
      return;
    }

    for (const filename of pendingMigrations) {
      console.log(`Aplicando migración: ${filename}...`);
      const filePath = path.resolve(process.cwd(), 'db/migrations', filename);
      const sqlContent = fs.readFileSync(filePath, 'utf8');

      // Ejecutar dentro de una transacción para evitar inconsistencias si el servidor lo soporta
      await connection.beginTransaction();
      try {
        // Ejecutar las sentencias de la migración una a una (separadas por ;)
        const statements = sqlContent
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        for (const statement of statements) {
          await connection.query(statement);
        }

        // Registrar versión
        await connection.query('INSERT INTO schema_migrations (version) VALUES (?)', [filename]);
        
        await connection.commit();
        console.log(`Migración ${filename} aplicada exitosamente.`);
      } catch (err) {
        await connection.rollback();
        throw new Error(`Fallo en migración "${filename}": ${err.message}`);
      }
    }
  } catch (error) {
    console.error('❌ Proceso de migración cancelado debido a error:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

async function seed() {
  console.log('--- EJECUTANDO DATOS SEMILLA ---');
  let connection;
  try {
    connection = await getDbConnection();
    
    const seedPath = path.resolve(process.cwd(), 'db/seeds/seed.sql');
    if (!fs.existsSync(seedPath)) {
      throw new Error(`Archivo de seed no encontrado en "${seedPath}"`);
    }

    const sqlContent = fs.readFileSync(seedPath, 'utf8');
    
    // Separar por sentencias sql
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    await connection.beginTransaction();
    try {
      for (const statement of statements) {
        await connection.query(statement);
      }
      await connection.commit();
      console.log('✅ Datos semilla aplicados exitosamente.');
    } catch (err) {
      await connection.rollback();
      throw err;
    }
  } catch (error) {
    console.error('❌ Proceso de seed cancelado debido a error:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

const action = process.argv[2];
if (action === 'migrate') {
  migrate();
} else if (action === 'status') {
  status();
} else if (action === 'seed') {
  seed();
} else {
  console.error('Acción no válida. Usar: node scripts/database/migrate.js [migrate|status|seed]');
  process.exit(1);
}
