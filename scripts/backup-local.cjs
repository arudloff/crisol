#!/usr/bin/env node
// ============================================================
// CRISOL — Local Backup Script
// Downloads latest data from Supabase and saves to local folder
//
// Usage:  node scripts/backup-local.js
// Setup:  Create scripts/.env with your service_role key:
//         SUPABASE_SERVICE_KEY=eyJ...
// Schedule: Windows Task Scheduler every 30 min or daily
// ============================================================

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SUPABASE_URL = 'https://cupykpcsxjihnzwyflbm.supabase.co';
const BACKUP_DIR = 'G:/Mi unidad/RESPALDOS/CRISOL/weekly';
const MAX_LOCAL_BACKUPS = 30;

// Load service_role key from .env file (bypasses RLS)
function loadServiceKey() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('ERROR: scripts/.env no encontrado.');
    console.error('Crea el archivo con: SUPABASE_SERVICE_KEY=eyJ...');
    console.error('La key está en Supabase Dashboard → Settings → API → service_role');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(/SUPABASE_SERVICE_KEY=(.+)/);
  if (!match) {
    console.error('ERROR: SUPABASE_SERVICE_KEY no encontrada en scripts/.env');
    process.exit(1);
  }
  return match[1].trim();
}

const SUPABASE_KEY = loadServiceKey();

const TABLES = [
  'projects',
  'sila_docs',
  'sila_kanban',
  'sila_prisma',
  'sila_userdata',
  'sila_settings',
  'sila_projects',
  'dr_socratic_log',
  'dr_alerts',
  'dr_wizard_context',
  'dr_backups',
  'profiles',
  'invite_requests',
  'project_members',
  'project_invitations',
  'article_annotations',
  'notifications',
  'user_project_phase',
  'prisma_data',
  'admins'
];

function fetchTable(table) {
  return new Promise((resolve) => {
    const url = new URL(`/rest/v1/${table}?select=*`, SUPABASE_URL);
    const options = {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode !== 200) {
            resolve({ table, data: [], status: res.statusCode, error: parsed.message || `HTTP ${res.statusCode}` });
          } else {
            resolve({ table, data: parsed, status: res.statusCode });
          }
        } catch (e) {
          resolve({ table, data: [], status: res.statusCode, error: e.message });
        }
      });
    }).on('error', (e) => {
      resolve({ table, data: [], error: e.message });
    });
  });
}

async function main() {
  console.log('CRISOL Backup — ' + new Date().toLocaleString());
  console.log('Downloading from Supabase (service_role)...');

  const results = await Promise.all(TABLES.map(fetchTable));

  const backup = {
    version: '3.2',
    created: new Date().toISOString(),
    script: 'backup-local.js',
    tables: {}
  };

  let totalRows = 0;
  let errors = 0;
  results.forEach(r => {
    if (r.error) {
      console.log(`  ⚠ ${r.table}: ${r.error}`);
      backup.tables[r.table] = [];
      errors++;
    } else {
      const count = Array.isArray(r.data) ? r.data.length : 0;
      console.log(`  ✓ ${r.table}: ${count} rows`);
      backup.tables[r.table] = r.data;
      totalRows += count;
    }
  });

  if (totalRows === 0) {
    console.log('\n⚠ No se obtuvieron datos. Verifica la service_role key.');
    return;
  }

  // Check if data changed since last backup
  const hashTables = { ...backup.tables };
  delete hashTables.dr_backups;
  const dataStr = JSON.stringify(hashTables);
  const currentHash = crypto.createHash('md5').update(dataStr).digest('hex');
  const hashFile = path.join(BACKUP_DIR, '.last_backup_hash');
  const lastHash = fs.existsSync(hashFile) ? fs.readFileSync(hashFile, 'utf8').trim() : '';

  if (currentHash === lastHash) {
    console.log('\n⏭ Sin cambios desde el último backup. No se genera archivo.');
    return;
  }

  // Ensure directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // Save to file
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const filename = `CRISOL_backup_${dateStr}.json`;
  const filepath = path.join(BACKUP_DIR, filename);

  fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf8');
  fs.writeFileSync(hashFile, currentHash, 'utf8');
  const sizeMB = (fs.statSync(filepath).size / 1024 / 1024).toFixed(2);
  console.log(`\n💾 Saved: ${filename} (${sizeMB} MB, ${totalRows} rows${errors > 0 ? `, ${errors} errors` : ''})`);

  // Cleanup old backups
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('CRISOL_backup_') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length > MAX_LOCAL_BACKUPS) {
    const toDelete = files.slice(MAX_LOCAL_BACKUPS);
    toDelete.forEach(f => {
      fs.unlinkSync(path.join(BACKUP_DIR, f));
      console.log(`  🗑 Deleted old: ${f}`);
    });
  }

  console.log('Done.\n');
}

main().catch(e => {
  console.error('Backup failed:', e);
  process.exit(1);
});
