/**
 * Validated configuration and environment variables.
 */

function getEnvString(key: string, defaultValue?: string): string {
  const value = import.meta.env[key] ?? process.env[key];
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable validation error: ${key} is required but missing.`);
  }
  return String(value);
}

function getEnvNumber(key: string, defaultValue?: number): number {
  const value = import.meta.env[key] ?? process.env[key];
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable validation error: ${key} is required but missing.`);
  }
  const parsed = Number(value);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable validation error: ${key} must be a number, got "${value}".`);
  }
  return parsed;
}

function getEnvBoolean(key: string, defaultValue?: boolean): boolean {
  const value = import.meta.env[key] ?? process.env[key];
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    return false;
  }
  const strVal = String(value).toLowerCase();
  return strVal === 'true' || strVal === '1' || strVal === 'yes';
}

// Validation function that builds the Config object
function validateConfig() {
  try {
    const nodeEnv = getEnvString('NODE_ENV', 'development');
    const dbHost = getEnvString('DB_HOST');
    const dbPort = getEnvNumber('DB_PORT', 3306);
    const dbUser = getEnvString('DB_USER');
    const dbPassword = getEnvString('DB_PASSWORD', '');
    const dbName = getEnvString('DB_NAME');
    const dbConnectionLimit = getEnvNumber('DB_CONNECTION_LIMIT', 10);
    const dbSsl = getEnvBoolean('DB_SSL', false);
    
    // Check both PUBLIC_SITE_URL and SITE or default
    const publicSiteUrl = import.meta.env.PUBLIC_SITE_URL ?? process.env.PUBLIC_SITE_URL ?? 'https://paraisofutbol.com';
    
    // Check both PUBLIC_WHATSAPP_NUMBER and WHATSAPP_NUMBER
    const publicWhatsappNumber = import.meta.env.PUBLIC_WHATSAPP_NUMBER ?? 
                                 process.env.PUBLIC_WHATSAPP_NUMBER ?? 
                                 import.meta.env.WHATSAPP_NUMBER ?? 
                                 process.env.WHATSAPP_NUMBER ?? 
                                 '';
    
    if (!publicWhatsappNumber) {
      throw new Error("Environment variable validation error: WHATSAPP_NUMBER / PUBLIC_WHATSAPP_NUMBER is required but missing.");
    }

    const enableUnsafeAdmin = getEnvBoolean('ENABLE_UNSAFE_ADMIN', false);

    return {
      NODE_ENV: nodeEnv,
      DB: {
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        database: dbName,
        connectionLimit: dbConnectionLimit,
        ssl: dbSsl,
      },
      PUBLIC_SITE_URL: publicSiteUrl,
      PUBLIC_WHATSAPP_NUMBER: publicWhatsappNumber,
      ENABLE_UNSAFE_ADMIN: enableUnsafeAdmin,
    };
  } catch (error: any) {
    // Crucial: we don't log DB connection details or passwords in the message.
    // The error message is clean.
    console.error('❌ Configuration validation failed:', error.message);
    throw error;
  }
}

export const env = validateConfig();
export type EnvConfig = typeof env;
