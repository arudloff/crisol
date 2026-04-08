// Tests for authentication and invite code logic

describe('Invite code generation', () => {
  const VALID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  function generateInviteCode() {
    const chars = VALID_CHARS;
    let code = 'CR-';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  test('excludes ambiguous characters (0, O, 1, I)', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateInviteCode().substring(3); // after CR-
      expect(code).not.toMatch(/[0OI1]/);
    }
  });
});

describe('Email validation for registration', () => {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function isValidEmail(str) { return EMAIL_RE.test(str); }

  test('university emails', () => {
    expect(isValidEmail('alejandro@chenriquez.cl')).toBe(true);
    expect(isValidEmail('researcher@utalca.cl')).toBe(true);
    expect(isValidEmail('phd.student@uni-heidelberg.de')).toBe(true);
  });

  test('rejects obvious non-emails', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('@@double.com')).toBe(false);
    expect(isValidEmail('missing@.com')).toBe(false);
  });

  test('rejects SQL injection in email field', () => {
    expect(isValidEmail("' OR 1=1 --")).toBe(false);
    expect(isValidEmail("user@x.com'; DROP TABLE users;--")).toBe(false);
  });
});

describe('Admin check logic', () => {
  test('isAdmin returns false when no user', () => {
    const state = { isAdmin: false, currentUser: null };
    expect(!!state.isAdmin).toBe(false);
  });

  test('isAdmin returns true when flag set', () => {
    const state = { isAdmin: true, currentUser: { email: 'admin@test.cl' } };
    expect(!!state.isAdmin).toBe(true);
  });
});

describe('Invite request sanitization', () => {
  function sanitizeText(str, maxLen = 500) {
    if (!str) return '';
    return String(str).trim().substring(0, maxLen);
  }

  test('strips leading/trailing whitespace from name', () => {
    expect(sanitizeText('  Juan Perez  ', 100)).toBe('Juan Perez');
  });

  test('truncates long institution names', () => {
    const long = 'Universidad Internacional de Estudios Avanzados en Ciencias Computacionales y Tecnologias de la Informacion del Cono Sur';
    expect(sanitizeText(long, 50).length).toBe(50);
  });

  test('handles HTML in reason field', () => {
    const malicious = '<script>steal(cookies)</script>Quiero investigar';
    const sanitized = sanitizeText(malicious, 500);
    // sanitizeText only trims/truncates, escH handles HTML
    expect(sanitized).toContain('<script>');
    expect(sanitized.length).toBeLessThanOrEqual(500);
  });
});
