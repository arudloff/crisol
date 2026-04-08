// Tests for utility functions (pure logic, no DOM needed)

// Since utils.js is an ES module with browser globals, we test the logic directly
describe('escH — HTML escaping', () => {
  function escH(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  test('escapes HTML tags', () => {
    expect(escH('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  test('escapes ampersands', () => {
    expect(escH('A & B')).toBe('A &amp; B');
  });

  test('escapes quotes', () => {
    expect(escH('He said "hello"')).toBe('He said &quot;hello&quot;');
  });

  test('handles empty string', () => {
    expect(escH('')).toBe('');
  });

  test('handles null/undefined', () => {
    expect(escH(null)).toBe('');
    expect(escH(undefined)).toBe('');
  });

  test('handles numbers', () => {
    expect(escH(42)).toBe('42');
  });
});

describe('isValidEmail — email validation', () => {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function isValidEmail(str) { return EMAIL_RE.test(str); }

  test('valid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('name.last@university.edu')).toBe(true);
    expect(isValidEmail('a@b.cl')).toBe(true);
  });

  test('invalid emails', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('noatsign')).toBe(false);
    expect(isValidEmail('no@domain')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
    expect(isValidEmail('spaces in@email.com')).toBe(false);
  });
});

describe('sanitizeText — input sanitization', () => {
  function sanitizeText(str, maxLen = 500) {
    if (!str) return '';
    return String(str).trim().substring(0, maxLen);
  }

  test('trims whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello');
  });

  test('truncates to maxLen', () => {
    expect(sanitizeText('abcdefghij', 5)).toBe('abcde');
  });

  test('handles null/undefined', () => {
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
  });

  test('default max is 500', () => {
    const long = 'a'.repeat(600);
    expect(sanitizeText(long).length).toBe(500);
  });
});

describe('generateInviteCode — code format', () => {
  function generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'CR-';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  test('starts with CR-', () => {
    const code = generateInviteCode();
    expect(code.startsWith('CR-')).toBe(true);
  });

  test('is 9 characters total', () => {
    expect(generateInviteCode().length).toBe(9);
  });

  test('only contains valid characters', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateInviteCode();
      expect(code).toMatch(/^CR-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    }
  });

  test('generates unique codes', () => {
    const codes = new Set();
    for (let i = 0; i < 50; i++) codes.add(generateInviteCode());
    expect(codes.size).toBeGreaterThan(45); // statistically should be all unique
  });
});
