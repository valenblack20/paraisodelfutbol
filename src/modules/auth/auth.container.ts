// src/modules/auth/auth.container.ts
import { getDatabasePool } from '../../infrastructure/database/mysql';
import { env } from '../../infrastructure/config/env';
import { MySqlAuthRepository } from './mysql-auth.repository.ts';
import { PasswordService } from './password.service.ts';
import { SessionService } from './session.service.ts';
import { AuthService } from './auth.service.ts';

const pool = getDatabasePool();
export const authRepository = new MySqlAuthRepository(pool);
export const passwordService = new PasswordService();
export const sessionService = new SessionService();

export const authService = new AuthService(
  authRepository,
  passwordService,
  sessionService,
  env.AUTH.rateLimitPepper,
  env.AUTH.sessionHours
);
