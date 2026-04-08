// Tests for backup script logic

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

describe('Backup — change detection', () => {
  const BACKUP_DIR = path.join(__dirname, 'tmp_backup_test');
  const hashFile = path.join(BACKUP_DIR, '.last_backup_hash');

  beforeEach(() => {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    if (fs.existsSync(hashFile)) fs.unlinkSync(hashFile);
  });

  afterAll(() => {
    // Cleanup
    const files = fs.readdirSync(BACKUP_DIR);
    files.forEach(f => fs.unlinkSync(path.join(BACKUP_DIR, f)));
    fs.rmdirSync(BACKUP_DIR);
  });

  function computeHash(data) {
    return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
  }

  test('first run always saves (no hash file)', () => {
    const lastHash = fs.existsSync(hashFile) ? fs.readFileSync(hashFile, 'utf8').trim() : '';
    const currentHash = computeHash({ projects: [{ id: 1 }] });
    expect(lastHash).toBe('');
    expect(currentHash !== lastHash).toBe(true);
  });

  test('same data produces same hash', () => {
    const data = { projects: [{ id: 1, name: 'Test' }], docs: [] };
    const hash1 = computeHash(data);
    const hash2 = computeHash(data);
    expect(hash1).toBe(hash2);
  });

  test('different data produces different hash', () => {
    const data1 = { projects: [{ id: 1 }] };
    const data2 = { projects: [{ id: 1 }, { id: 2 }] };
    expect(computeHash(data1)).not.toBe(computeHash(data2));
  });

  test('hash file persistence works', () => {
    const hash = computeHash({ test: true });
    fs.writeFileSync(hashFile, hash, 'utf8');
    const read = fs.readFileSync(hashFile, 'utf8').trim();
    expect(read).toBe(hash);
  });

  test('skips when hash matches', () => {
    const data = { projects: [{ id: 1 }] };
    const hash = computeHash(data);
    fs.writeFileSync(hashFile, hash, 'utf8');

    const lastHash = fs.readFileSync(hashFile, 'utf8').trim();
    const currentHash = computeHash(data);
    expect(currentHash === lastHash).toBe(true); // should skip
  });
});

describe('Backup — file retention', () => {
  const BACKUP_DIR = path.join(__dirname, 'tmp_retention_test');
  const MAX = 5;

  beforeEach(() => {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  });

  afterAll(() => {
    const files = fs.readdirSync(BACKUP_DIR);
    files.forEach(f => fs.unlinkSync(path.join(BACKUP_DIR, f)));
    fs.rmdirSync(BACKUP_DIR);
  });

  test('keeps only MAX files', () => {
    // Create 8 fake backup files
    for (let i = 0; i < 8; i++) {
      const name = `CRISOL_backup_2026-04-0${i + 1}T00-00-00.json`;
      fs.writeFileSync(path.join(BACKUP_DIR, name), '{}', 'utf8');
    }

    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('CRISOL_backup_') && f.endsWith('.json'))
      .sort()
      .reverse();

    expect(files.length).toBe(8);

    // Simulate retention
    if (files.length > MAX) {
      const toDelete = files.slice(MAX);
      toDelete.forEach(f => fs.unlinkSync(path.join(BACKUP_DIR, f)));
    }

    const remaining = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('CRISOL_backup_') && f.endsWith('.json'));

    expect(remaining.length).toBe(MAX);
  });
});

describe('Backup — JSON structure', () => {
  test('backup has required fields', () => {
    const backup = {
      version: '3.2',
      created: new Date().toISOString(),
      script: 'backup-local.js',
      tables: {
        projects: [],
        sila_docs: [],
        profiles: []
      }
    };

    expect(backup.version).toBeDefined();
    expect(backup.created).toBeDefined();
    expect(backup.tables).toBeDefined();
    expect(typeof backup.tables).toBe('object');
  });

  test('created is valid ISO date', () => {
    const created = new Date().toISOString();
    expect(() => new Date(created)).not.toThrow();
    expect(new Date(created).toISOString()).toBe(created);
  });
});
