// src/modules/auth/password.service.ts
import argon2 from 'argon2';

export class PasswordService {
  /**
   * Hashes a password using Argon2id
   */
  public async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password, {
      type: argon2.argon2id
    });
  }

  /**
   * Verifies a password against an Argon2id hash
   */
  public async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      console.error('[PasswordService] Error verifying password:', error);
      return false;
    }
  }
}
