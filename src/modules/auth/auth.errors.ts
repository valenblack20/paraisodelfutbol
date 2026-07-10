// src/modules/auth/auth.errors.ts

export class AuthenticationError extends Error {
  constructor(message = 'Credenciales inválidas') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends Error {
  constructor(message = 'Demasiados intentos de inicio de sesión. Por favor, intente más tarde.') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class CsrfError extends Error {
  constructor(message = 'Token CSRF inválido o faltante.') {
    super(message);
    this.name = 'CsrfError';
  }
}
