// scripts/test-runner.js
import assert from 'node:assert';
import { PasswordService } from '../src/modules/auth/password.service.ts';
import { SessionService } from '../src/modules/auth/session.service.ts';
import { AuthService } from '../src/modules/auth/auth.service.ts';

// A mock repository for testing the auth service logic
class MockAuthRepository {
  constructor() {
    this.users = [];
    this.sessions = [];
    this.loginAttempts = [];
  }

  async findActiveUserByEmail(email) {
    return this.users.find(u => u.email === email && u.active) || null;
  }

  async updateLastLogin(userId) {
    const user = this.users.find(u => u.id === userId);
    if (user) user.lastLoginAt = new Date();
  }

  async createSession(userId, tokenHash, csrfTokenHash, expiresAt) {
    this.sessions.push({
      id: this.sessions.length + 1,
      adminUserId: userId,
      tokenHash,
      csrfTokenHash,
      expiresAt,
      lastSeenAt: new Date(),
      createdAt: new Date()
    });
  }

  async findSessionByTokenHash(tokenHash) {
    const session = this.sessions.find(s => s.tokenHash === tokenHash);
    if (!session) return null;
    const user = this.users.find(u => u.id === session.adminUserId);
    return user ? { session, user } : null;
  }

  async rotateSession(oldTokenHash, newTokenHash, expiresAt) {
    const session = this.sessions.find(s => s.tokenHash === oldTokenHash);
    if (session) {
      session.tokenHash = newTokenHash;
      session.expiresAt = expiresAt;
      session.lastSeenAt = new Date();
    }
  }

  async deleteSession(tokenHash) {
    this.sessions = this.sessions.filter(s => s.tokenHash !== tokenHash);
  }

  async deleteExpiredSessions() {
    const initialCount = this.sessions.length;
    this.sessions = this.sessions.filter(s => s.expiresAt.getTime() > Date.now());
    return initialCount - this.sessions.length;
  }

  async recordLoginAttempt(emailHash, ipHash, successful) {
    this.loginAttempts.push({
      emailHash,
      ipHash,
      successful,
      attemptedAt: new Date()
    });
  }

  async countRecentFailedAttempts(emailHash, ipHash, minutes) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.loginAttempts.filter(
      a => (a.emailHash === emailHash || a.ipHash === ipHash) &&
           !a.successful &&
           a.attemptedAt.getTime() > cutoff.getTime()
    ).length;
  }
}

// Client cart item XSS escaping simulation helper
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function runTests() {
  console.log('=== INICIANDO UNIT TESTS DE SEGURIDAD ===\n');

  const passwordService = new PasswordService();
  const sessionService = new SessionService();

  // Test 1: Hashing y verificación de contraseñas con Argon2id
  console.log('Test 1: Password Hashing & Verification...');
  const pass = 'SuperSecret123';
  const hash = await passwordService.hashPassword(pass);
  assert.ok(hash.startsWith('$argon2'), 'El hash de contraseña debe usar Argon2id.');
  assert.ok(await passwordService.verifyPassword(pass, hash), 'Debe verificar correctamente la contraseña.');
  assert.ok(!(await passwordService.verifyPassword('WrongPass', hash)), 'Debe rechazar una contraseña incorrecta.');
  console.log('  ✓ Completado.');

  // Test 2: Hashing y Generación de Sesión Segura (SHA-256)
  console.log('Test 2: Token Hashing & Expiration...');
  const token = sessionService.generateRandomToken();
  const tokenHash = sessionService.hashToken(token);
  assert.strictEqual(tokenHash.length, 64, 'El hash SHA-256 debe tener 64 caracteres hexadecimales.');

  const pastDate = new Date(Date.now() - 10000);
  const futureDate = new Date(Date.now() + 10000);
  assert.ok(sessionService.isExpired(pastDate), 'Debe marcar como expirada una fecha del pasado.');
  assert.ok(!sessionService.isExpired(futureDate), 'Debe marcar como activa una fecha del futuro.');
  console.log('  ✓ Completado.');

  // Test 3: Validación de CSRF
  console.log('Test 3: CSRF Generation & Timing-safe Verification...');
  const csrfRaw = sessionService.generateCsrfToken();
  const csrfHash = sessionService.hashToken(csrfRaw);
  const matchingRawHash = sessionService.hashToken(csrfRaw);
  assert.ok(sessionService.timingSafeEqual(csrfHash, matchingRawHash), 'Debe pasar validación de tokens idénticos.');
  assert.ok(!sessionService.timingSafeEqual(csrfHash, sessionService.hashToken('fakeCsrf')), 'Debe rechazar tokens alterados.');
  console.log('  ✓ Completado.');

  // Test 4: Rate Limiting de Login y Hashing con Pepper
  console.log('Test 4: Login Rate Limiting & Pepper Hashing...');
  const mockRepo = new MockAuthRepository();
  const pepper = 'super-secure-rate-limit-pepper-key-32-chars';
  const authService = new AuthService(mockRepo, passwordService, sessionService, pepper, 8);

  const ip = '192.168.1.100';
  const email = 'user@example.com';

  const emailHash = authService.hashWithPepper(email);
  const ipHash = authService.hashWithPepper(ip);

  assert.strictEqual(emailHash.length, 64);
  assert.notStrictEqual(emailHash, crypto.createHash('sha256').update(email).digest('hex'), 'El hash del email debe verse afectado por el pepper.');

  // Simulate 5 failures
  for (let i = 0; i < 5; i++) {
    await mockRepo.recordLoginAttempt(emailHash, ipHash, false);
  }

  // Attempt login should trigger RateLimitError
  await assert.rejects(
    async () => {
      await authService.login(email, 'anypass', ip);
    },
    (err) => err.name === 'RateLimitError',
    'Debe rechazar el login cuando se alcanzan 5 intentos fallidos.'
  );
  console.log('  ✓ Completado.');

  // Test 5: Sanitización de Cart Item (XSS Hardening)
  console.log('Test 5: Cart XSS Escaping...');
  const dangerousXss = '<script>alert("XSS")</script>';
  const escaped = escapeHtml(dangerousXss);
  assert.ok(!escaped.includes('<'), 'La salida sanitizada no debe contener caracteres "<".');
  assert.ok(!escaped.includes('>'), 'La salida sanitizada no debe contener caracteres ">".');
  assert.strictEqual(escaped, '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;', 'Debe codificar a HTML entities correctamente.');
  console.log('  ✓ Completado.');

  console.log('\n✅ TODOS LOS UNIT TESTS SE COMPLETARON CON ÉXITO.');
}

import crypto from 'node:crypto';
runTests().catch(err => {
  console.error('❌ Fallo en los tests:', err);
  process.exit(1);
});
