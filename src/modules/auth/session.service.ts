// src/modules/auth/session.service.ts
import crypto from 'node:crypto';

export class SessionService {
  /**
   * Generates a secure, cryptographically random opaque token (32 bytes)
   */
  public generateRandomToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hashes a token using SHA-256 for secure database storage
   */
  public hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generates a cryptographically secure random CSRF token (32 bytes)
   */
  public generateCsrfToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validates if a session expiresAt has passed the current time
   */
  public isExpired(expiresAt: Date): boolean {
    return new Date().getTime() > expiresAt.getTime();
  }

  /**
   * Compare two tokens/hashes in constant time to prevent timing attacks
   */
  public timingSafeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Returns standard secure cookie options
   */
  public getCookieOptions(sessionHours: number, secure: boolean) {
    return {
      httpOnly: true,
      secure: secure,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: sessionHours * 60 * 60
    };
  }
}
