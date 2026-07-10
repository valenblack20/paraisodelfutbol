// src/modules/auth/auth.types.ts

export interface AdminUser {
  id: number;
  email: string;
  passwordHash: string;
  displayName: string;
  active: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminSession {
  id: number;
  adminUserId: number;
  tokenHash: string;
  csrfTokenHash: string;
  expiresAt: Date;
  lastSeenAt: Date;
  createdAt: Date;
}

export interface AuthContext {
  authenticated: boolean;
  user: {
    id: number;
    email: string;
    displayName: string;
  } | null;
  session: {
    tokenHash: string;
    csrfTokenHash: string;
    expiresAt: Date;
  } | null;
}
