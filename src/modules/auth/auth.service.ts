// src/modules/auth/auth.service.ts
import crypto from 'node:crypto';
import type { AuthRepository } from './auth.repository.ts';
import type { PasswordService } from './password.service.ts';
import type { SessionService } from './session.service.ts';
import type { AdminUser, AdminSession, AuthContext } from './auth.types.ts';
import { AuthenticationError, RateLimitError, CsrfError } from './auth.errors.ts';

export class AuthService {
  private authRepository: AuthRepository;
  private passwordService: PasswordService;
  private sessionService: SessionService;
  private pepper: string;
  private sessionHours: number;

  constructor(
    authRepository: AuthRepository,
    passwordService: PasswordService,
    sessionService: SessionService,
    pepper: string,
    sessionHours: number
  ) {
    this.authRepository = authRepository;
    this.passwordService = passwordService;
    this.sessionService = sessionService;
    this.pepper = pepper;
    this.sessionHours = sessionHours;
  }

  /**
   * Hashes a value with HMAC-SHA256 using the server-side pepper
   */
  public hashWithPepper(value: string): string {
    if (!this.pepper) {
      throw new Error('PEPPER de seguridad no inicializado para hashing de rate limit.');
    }
    return crypto.createHmac('sha256', this.pepper).update(value).digest('hex');
  }

  /**
   * Performs administrator login with rate limit verification and password verification
   */
  public async login(email: string, password: string, clientIp: string): Promise<{ token: string; csrfToken: string; user: AdminUser }> {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanIp = String(clientIp || '').trim();

    const emailHash = this.hashWithPepper(cleanEmail);
    const ipHash = this.hashWithPepper(cleanIp);

    // 1. Verify Rate Limiting: max 5 failed attempts in 15 minutes
    const failedAttempts = await this.authRepository.countRecentFailedAttempts(emailHash, ipHash, 15);
    if (failedAttempts >= 5) {
      throw new RateLimitError();
    }

    // 2. Fetch active user
    const user = await this.authRepository.findActiveUserByEmail(cleanEmail);
    if (!user) {
      // Record failed attempt to protect against enumeration
      await this.authRepository.recordLoginAttempt(emailHash, ipHash, false);
      throw new AuthenticationError();
    }

    // 3. Verify Password
    const passwordValid = await this.passwordService.verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      await this.authRepository.recordLoginAttempt(emailHash, ipHash, false);
      throw new AuthenticationError();
    }

    // 4. Reset rate limit / record successful login
    await this.authRepository.recordLoginAttempt(emailHash, ipHash, true);

    // 5. Update user last login time
    await this.authRepository.updateLastLogin(user.id);

    // 6. Create secure opaque session and CSRF
    const sessionToken = this.sessionService.generateRandomToken();
    const sessionTokenHash = this.sessionService.hashToken(sessionToken);
    
    const csrfToken = this.sessionService.generateCsrfToken();
    const csrfTokenHash = this.sessionService.hashToken(csrfToken);

    const expiresAt = new Date(Date.now() + this.sessionHours * 60 * 60 * 1000);

    await this.authRepository.createSession(user.id, sessionTokenHash, csrfTokenHash, expiresAt);

    return {
      token: sessionToken,
      csrfToken: csrfToken,
      user
    };
  }

  /**
   * Validates a session token and returns context
   */
  public async validateSession(token: string): Promise<AuthContext> {
    if (!token || typeof token !== 'string') {
      return { authenticated: false, user: null, session: null };
    }

    const tokenHash = this.sessionService.hashToken(token);
    const match = await this.authRepository.findSessionByTokenHash(tokenHash);

    if (!match) {
      return { authenticated: false, user: null, session: null };
    }

    const { session, user } = match;

    // Check expiration
    if (this.sessionService.isExpired(session.expiresAt)) {
      await this.authRepository.deleteSession(tokenHash);
      return { authenticated: false, user: null, session: null };
    }

    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName
      },
      session: {
        tokenHash: session.tokenHash,
        csrfTokenHash: session.csrfTokenHash,
        expiresAt: session.expiresAt
      }
    };
  }

  /**
   * Destroys an active session
   */
  public async logout(token: string, csrfToken: string): Promise<void> {
    const context = await this.validateSession(token);
    if (!context.authenticated || !context.session) {
      return;
    }

    // Verify CSRF token
    const rawCsrfHash = this.sessionService.hashToken(csrfToken);
    if (!this.sessionService.timingSafeEqual(rawCsrfHash, context.session.csrfTokenHash)) {
      throw new CsrfError();
    }

    await this.authRepository.deleteSession(context.session.tokenHash);
  }

  /**
   * Validates CSRF token for state-changing operations
   */
  public validateCsrf(csrfTokenReceived: string, sessionCsrfHash: string): boolean {
    if (!csrfTokenReceived || !sessionCsrfHash) return false;
    const computedHash = this.sessionService.hashToken(csrfTokenReceived);
    return this.sessionService.timingSafeEqual(computedHash, sessionCsrfHash);
  }

  /**
   * Cleans up expired sessions from the database
   */
  public async cleanupExpiredSessions(): Promise<number> {
    return await this.authRepository.deleteExpiredSessions();
  }
}
