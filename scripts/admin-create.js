// CLI Command script: admin-create.js
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import argon2 from 'argon2';

// 1. Environment variables loader (matching migrate.js pattern)
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

// 2. Readline helpers
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

function askPassword(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    process.stdout.write(query);
    
    // Mute stdout during password typing
    let stdinHandler = (char) => {
      // Clean display line and write mask if typed (or just let it hide)
    };

    // Override internal write function
    const oldWrite = rl.output.write;
    rl.output.write = function(chunk, encoding, cb) {
      if (chunk === '\r' || chunk === '\n' || chunk === '\r\n') {
        return oldWrite.call(this, chunk, encoding, cb);
      }
      if (chunk.indexOf(query) >= 0) {
        return oldWrite.call(this, chunk, encoding, cb);
      }
      // Do not print characters typed
      return true;
    };

    rl.question('', (password) => {
      rl.output.write = oldWrite; // Restore output
      rl.close();
      process.stdout.write('\n');
      resolve(password);
    });
  });
}

// 3. Validation functions
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePasswordStrength(password) {
  // Require at least 8 characters, with letters and numbers
  if (password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  return hasLetter && hasDigit;
}

// Main execution flow
async function run() {
  console.log('=== CREACIÓN / ACTUALIZACIÓN DE ADMINISTRADOR ===\n');

  // Check if non-interactive mode is requested and env variables are present
  const nonInteractive = envVars.ADMIN_CREATE_NON_INTERACTIVE === 'true' || process.env.ADMIN_CREATE_NON_INTERACTIVE === 'true';
  
  let email, displayName, password;

  if (nonInteractive) {
    console.log('Modo no interactivo (CI) detectado.');
    email = envVars.ADMIN_CREATE_EMAIL || process.env.ADMIN_CREATE_EMAIL;
    displayName = envVars.ADMIN_CREATE_DISPLAY_NAME || process.env.ADMIN_CREATE_DISPLAY_NAME;
    password = envVars.ADMIN_CREATE_PASSWORD || process.env.ADMIN_CREATE_PASSWORD;

    if (!email || !displayName || !password) {
      console.error('Error: Faltan variables de entorno ADMIN_CREATE_EMAIL, ADMIN_CREATE_DISPLAY_NAME o ADMIN_CREATE_PASSWORD en modo no interactivo.');
      process.exit(1);
    }
  } else {
    // Interactive inputs
    email = await askQuestion('Ingrese el Email: ');
    if (!validateEmail(email)) {
      console.error('❌ Error: El formato del email ingresado no es válido.');
      process.exit(1);
    }

    displayName = await askQuestion('Ingrese el Nombre a Mostrar: ');
    if (!displayName || displayName.trim().length === 0) {
      console.error('❌ Error: El nombre a mostrar no puede estar vacío.');
      process.exit(1);
    }

    password = await askPassword('Ingrese la Contraseña (oculta, mínimo 8 caracteres con letras y números): ');
    if (!validatePasswordStrength(password)) {
      console.error('❌ Error: La contraseña es débil. Debe tener al menos 8 caracteres, e incluir letras y números.');
      process.exit(1);
    }

    const confirmPassword = await askPassword('Confirme la Contraseña (oculta): ');
    if (password !== confirmPassword) {
      console.error('❌ Error: Las contraseñas no coinciden.');
      process.exit(1);
    }

    const confirmation = await askQuestion(`\n¿Confirma la creación/actualización del usuario admin "${email}" (${displayName})? (s/n): `);
    if (confirmation.trim().toLowerCase() !== 's') {
      console.log('Operación cancelada.');
      process.exit(0);
    }
  }

  // 4. Hash password with Argon2id
  console.log('\nGenerando hash seguro...');
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id
  });

  // 5. Database persistence
  console.log('Conectando a la base de datos...');
  const dbConfig = getDbConfig();
  const connection = await mysql.createConnection(dbConfig);

  try {
    // Check if user already exists
    const [rows] = await connection.execute('SELECT id FROM admin_users WHERE email = ?', [email]);
    
    if (rows.length > 0) {
      const existingId = rows[0].id;
      console.log(`El usuario ya existe (ID: ${existingId}). Actualizando contraseña y datos...`);
      await connection.execute(
        'UPDATE admin_users SET password_hash = ?, display_name = ?, active = TRUE WHERE id = ?',
        [passwordHash, displayName, existingId]
      );
      console.log(`✅ Administrador "${email}" actualizado correctamente.`);
    } else {
      console.log('Insertando nuevo administrador...');
      await connection.execute(
        'INSERT INTO admin_users (email, password_hash, display_name, active) VALUES (?, ?, ?, TRUE)',
        [email, passwordHash, displayName]
      );
      console.log(`✅ Administrador "${email}" creado exitosamente.`);
    }
  } catch (error) {
    console.error('❌ Error al guardar en la base de datos:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

run().catch(err => {
  console.error('❌ Ocurrió un error inesperado:', err);
  process.exit(1);
});
