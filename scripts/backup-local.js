#!/usr/bin/env node
// ============================================================
// CRISOL — Local Backup Script
// Downloads latest data from Supabase and saves to local folder
//
// Usage:  node scripts/backup-local.js
// Schedule: Windows Task Scheduler every 30 min or daily
// ============================================================

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://cupykpcsxjihnzwyflbm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cHlrcGNzeGppaG56d3lmbGJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTU1MjMsImV4cCI6MjA4OTE3MTUyM30.GFEW-prBl39zRGbqIhOfqKoWcVLICEIXXQvPkL9UaOU';

const BACKUP_DIR = 'G:/Mi unidad/RESPALDOS/CRISOL/weekly';
const MAX_LOCAL_BACKUPS = 30; // keep last 30 files

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
  'article_annotations'
];

function fetchTable(table) {
  return new Promise((resolve, reject) => {
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
          resolve({ table, data: JSON.parse(data), status: res.statusCode });
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
  console.log('Downloading from Supabase...');

  // Fetch all tables in parallel
  const results = await Promise.all(TABLES.map(fetchTable));

  const backup = {
    version: '3.2',
    created: new Date().toISOString(),
    script: 'backup-local.js',
    tables: {}
  };

  let totalRows = 0;
  results.forEach(r => {
    if (r.error) {
      console.log(`  ⚠ ${r.table}: ${r.error}`);
      backup.tables[r.table] = [];
    } else {
      const count = Array.isArray(r.data) ? r.data.length : 0;
      console.log(`  ✓ ${r.table}: ${count} rows`);
      backup.tables[r.table] = r.data;
      totalRows += count;
    }
  });

  // Save to file
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const filename = `CRISOL_backup_${dateStr}.json`;
  const filepath = path.join(BACKUP_DIR, filename);

  // Ensure directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf8');
  const sizeMB = (fs.statSync(filepath).size / 1024 / 1024).toFixed(2);
  console.log(`\n💾 Saved: ${filename} (${sizeMB} MB, ${totalRows} rows)`);

  // Cleanup: remove old backups beyond MAX_LOCAL_BACKUPS
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
