// src/modules/auth/mysql-auth.repository.ts
import type mysql from 'mysql2/promise';
import type { AuthRepository } from './auth.repository.ts';
import type { AdminUser, AdminSession } from './auth.types.ts';

export class MySqlAuthRepository implements AuthRepository {
  private pool: mysql.Pool;
  constructor(pool: mysql.Pool) {
    this.pool = pool;
  }

  public async findActiveUserByEmail(email: string): Promise<AdminUser | null> {
    const [rows] = await this.pool.execute(
      `SELECT id, email, password_hash, display_name, active, last_login_at, created_at, updated_at 
       FROM admin_users 
       WHERE email = ? AND active = TRUE`,
      [email]
    );

    const list = rows as any[];
    if (list.length === 0) return null;

    const row = list[0];
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      displayName: row.display_name,
      active: row.active === 1 || row.active === true,
      lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  public async updateLastLogin(userId: number): Promise<void> {
    await this.pool.execute(
      'UPDATE admin_users SET last_login_at = NOW() WHERE id = ?',
      [userId]
    );
  }

  public async createSession(userId: number, tokenHash: string, csrfTokenHash: string, expiresAt: Date): Promise<void> {
    await this.pool.execute(
      `INSERT INTO admin_sessions (admin_user_id, token_hash, csrf_token_hash, expires_at) 
       VALUES (?, ?, ?, ?)`,
      [userId, tokenHash, csrfTokenHash, expiresAt]
    );
  }

  public async findSessionByTokenHash(tokenHash: string): Promise<{ session: AdminSession; user: AdminUser } | null> {
    const [rows] = await this.pool.execute(
      `SELECT s.id as s_id, s.admin_user_id as s_user_id, s.token_hash as s_token_hash, 
              s.csrf_token_hash as s_csrf_hash, s.expires_at as s_expires_at, 
              s.last_seen_at as s_last_seen, s.created_at as s_created_at,
              u.id as u_id, u.email as u_email, u.password_hash as u_password_hash, 
              u.display_name as u_display_name, u.active as u_active, 
              u.last_login_at as u_last_login, u.created_at as u_created_at, u.updated_at as u_updated_at
       FROM admin_sessions s
       JOIN admin_users u ON s.admin_user_id = u.id
       WHERE s.token_hash = ?`,
      [tokenHash]
    );

    const list = rows as any[];
    if (list.length === 0) return null;

    const row = list[0];
    const session: AdminSession = {
      id: row.s_id,
      adminUserId: row.s_user_id,
      tokenHash: row.s_token_hash,
      csrfTokenHash: row.s_csrf_hash,
      expiresAt: new Date(row.s_expires_at),
      lastSeenAt: new Date(row.s_last_seen),
      createdAt: new Date(row.s_created_at)
    };

    const user: AdminUser = {
      id: row.u_id,
      email: row.u_email,
      passwordHash: row.u_password_hash,
      displayName: row.u_display_name,
      active: row.u_active === 1 || row.u_active === true,
      lastLoginAt: row.u_last_login ? new Date(row.u_last_login) : null,
      createdAt: new Date(row.u_created_at),
      updatedAt: new Date(row.u_updated_at)
    };

    return { session, user };
  }

  public async rotateSession(oldTokenHash: string, newTokenHash: string, expiresAt: Date): Promise<void> {
    await this.pool.execute(
      'UPDATE admin_sessions SET token_hash = ?, expires_at = ?, last_seen_at = NOW() WHERE token_hash = ?',
      [newTokenHash, expiresAt, oldTokenHash]
    );
  }

  public async deleteSession(tokenHash: string): Promise<void> {
    await this.pool.execute(
      'DELETE FROM admin_sessions WHERE token_hash = ?',
      [tokenHash]
    );
  }

  public async deleteExpiredSessions(): Promise<number> {
    const [result] = await this.pool.execute(
      'DELETE FROM admin_sessions WHERE expires_at < NOW()'
    );
    return (result as any).affectedRows || 0;
  }

  public async recordLoginAttempt(emailHash: string, ipHash: string, successful: boolean): Promise<void> {
    await this.pool.execute(
      'INSERT INTO admin_login_attempts (email_hash, ip_hash, successful) VALUES (?, ?, ?)',
      [emailHash, ipHash, successful ? 1 : 0]
    );
  }

  public async countRecentFailedAttempts(emailHash: string, ipHash: string, minutes: number): Promise<number> {
    const [rows] = await this.pool.execute(
      `SELECT COUNT(*) as failed_count 
       FROM admin_login_attempts 
       WHERE (email_hash = ? OR ip_hash = ?) 
         AND successful = FALSE 
         AND attempted_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
      [emailHash, ipHash, minutes]
    );

    const list = rows as any[];
    if (list.length === 0) return 0;
    return list[0].failed_count || 0;
  }

  public async updateCsrfTokenHash(tokenHash: string, csrfTokenHash: string): Promise<void> {
    await this.pool.execute(
      'UPDATE admin_sessions SET csrf_token_hash = ? WHERE token_hash = ?',
      [csrfTokenHash, tokenHash]
    );
  }
}
