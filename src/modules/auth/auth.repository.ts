// src/modules/auth/auth.repository.ts
import type { AdminUser, AdminSession } from './auth.types';

export interface AuthRepository {
  findActiveUserByEmail(email: string): Promise<AdminUser | null>;
  updateLastLogin(userId: number): Promise<void>;
  
  createSession(userId: number, tokenHash: string, csrfTokenHash: string, expiresAt: Date): Promise<void>;
  findSessionByTokenHash(tokenHash: string): Promise<{ session: AdminSession; user: AdminUser } | null>;
  rotateSession(oldTokenHash: string, newTokenHash: string, expiresAt: Date): Promise<void>;
  deleteSession(tokenHash: string): Promise<void>;
  deleteExpiredSessions(): Promise<number>;
  
  recordLoginAttempt(emailHash: string, ipHash: string, successful: boolean): Promise<void>;
  countRecentFailedAttempts(emailHash: string, ipHash: string, minutes: number): Promise<number>;
}
