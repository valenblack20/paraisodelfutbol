/**
 * Validated configuration and environment variables.
 */

function getEnvString(key: string, defaultValue?: string): string {
  const value = import.meta.env[key] ?? process.env[key];
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Environment variable validation error: ${key} is required but missing.`);
  }
  return String(value);
}

function getEnvNumber(key: string, defaultValue?: number): number {
  const value = import.meta.env[key] ?? process.env[key];
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Environment variable validation error: ${key} is required but missing.`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable validation error: ${key} must be a number.`);
  }
  return parsed;
}

function getEnvBoolean(key: string, defaultValue?: boolean): boolean {
  const value = import.meta.env[key] ?? process.env[key];
  if (value === undefined || value === '') {
    return defaultValue ?? false;
  }

  const normalized = String(value).toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

function validateConfig() {
  try {
    const nodeEnv = getEnvString('NODE_ENV', 'development');
    const publicSiteUrl =
      import.meta.env.PUBLIC_SITE_URL ??
      process.env.PUBLIC_SITE_URL ??
      'https://paraisofutbol.com';

    const publicWhatsappNumber =
      import.meta.env.PUBLIC_WHATSAPP_NUMBER ??
      process.env.PUBLIC_WHATSAPP_NUMBER ??
      import.meta.env.WHATSAPP_NUMBER ??
      process.env.WHATSAPP_NUMBER ??
      '';

    if (!publicWhatsappNumber) {
      throw new Error(
        'Environment variable validation error: PUBLIC_WHATSAPP_NUMBER is required.'
      );
    }

    const authRateLimitPepper = getEnvString(
      'AUTH_RATE_LIMIT_PEPPER',
      nodeEnv === 'development' ? 'dev-default-pepper-secret-32-chars-long' : ''
    );

    if (
      nodeEnv === 'production' &&
      (!authRateLimitPepper || authRateLimitPepper.length < 16)
    ) {
      throw new Error(
        'Environment variable validation error: AUTH_RATE_LIMIT_PEPPER is required in production and must be at least 16 characters.'
      );
    }

    return {
      NODE_ENV: nodeEnv,
      DB: {
        host: getEnvString('DB_HOST'),
        port: getEnvNumber('DB_PORT', 3306),
        user: getEnvString('DB_USER'),
        password: getEnvString('DB_PASSWORD', ''),
        database: getEnvString('DB_NAME'),
        connectionLimit: getEnvNumber('DB_CONNECTION_LIMIT', 10),
        ssl: getEnvBoolean('DB_SSL', false)
      },
      PUBLIC_SITE_URL: String(publicSiteUrl),
      PUBLIC_WHATSAPP_NUMBER: String(publicWhatsappNumber),
      ENABLE_UNSAFE_ADMIN: getEnvBoolean('ENABLE_UNSAFE_ADMIN', false),
      AUTH: {
        rateLimitPepper: authRateLimitPepper,
        sessionHours: getEnvNumber('ADMIN_SESSION_HOURS', 8),
        cookieSecure: getEnvBoolean('COOKIE_SECURE', nodeEnv === 'production'),
        trustProxy: getEnvBoolean('TRUST_PROXY', false)
      }
    };
  } catch (error: unknown) {
    const message = error instanceof Error
      ? error.message
      : 'Unknown configuration error.';
    console.error('❌ Configuration validation failed:', message);
    throw error;
  }
}

export const env = validateConfig();
export type EnvConfig = typeof env;
