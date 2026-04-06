// SILA v2 — Main Assembler with pre-calculated verification
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType } = require('docx');
const fs = require('fs');

const { portada, seccionA, SOURCE_TEXT, p, r, cl, rw, tbl, SZ, SZ_SM, FONT, TW_P } = require('./build_sila_v2_part1.js');
const { seccionA2, seccionB } = require('./build_sila_v2_part2.js');
const { seccionC, seccionC2, seccionD, seccionE } = require('./build_sila_v2_part3.js');

const OUTPUT = 'G:/Mi unidad/Doctorado MGT/SILA/SILA_Bustamante_2004_v4.docx';

console.log('Calculando verificacion de fidelidad...');

// Pre-calculate verification data
const data = JSON.parse(fs.readFileSync('C:/Users/Alejandro Rudloff/sila_secB_data.json', 'utf8'));
let leftText = '';
for (const sec of data.sections) {
  for (const par of sec.paragraphs) {
    leftText += par.text + '\n\n';
  }
}

const norm = t => t.replace(/\s+/g, ' ').replace(/[\u201c\u201d\u2018\u2019\u2013\u2014]/g, c => ({'\u201c':'"','\u201d':'"','\u2018':"'",'\u2019':"'",'\u2013':'-','\u2014':'-'}[c]||c)).trim();
const srcN = norm(SOURCE_TEXT);
const leftN = norm(leftText);
const srcWords = srcN.split(/\s+/).length;
const leftWords = leftN.split(/\s+/).length;
const srcChars = srcN.length;
const leftChars = leftN.length;
const wordPct = (Math.min(srcWords, leftWords) / Math.max(srcWords, leftWords) * 100).toFixed(1);
const charPct = (Math.min(srcChars, leftChars) / Math.max(srcChars, leftChars) * 100).toFixed(1);
const approved = parseFloat(wordPct) >= 95;

console.log(`Palabras: ${srcWords} vs ${leftWords} = ${wordPct}%`);
console.log(`Caracteres: ${srcChars} vs ${leftChars} = ${charPct}%`);
console.log(`Estado: ${approved ? '✓ APROBADO' : '✗ REQUIERE REVISIÓN'}`);

// Replace PENDING in portada with actual values
// Find the verification table in portada.children and replace it
const CW = 2340;
const verificationTable = tbl([
  rw([
    cl([p('Metrica', { bold: true, size: SZ_SM })], { w: CW, f: 'E8E8E8' }),
    cl([p('Texto fuente', { bold: true, size: SZ_SM })], { w: CW, f: 'E8E8E8' }),
    cl([p('Col. izquierda', { bold: true, size: SZ_SM })], { w: CW, f: 'E8E8E8' }),
    cl([p('Coincidencia', { bold: true, size: SZ_SM })], { w: CW, f: 'E8E8E8' }),
  ]),
  rw([
    cl([p('Palabras', { size: SZ_SM })], { w: CW }),
    cl([p(String(srcWords), { size: SZ_SM })], { w: CW }),
    cl([p(String(leftWords), { size: SZ_SM })], { w: CW }),
    cl([p(wordPct + '%', { bold: true, size: SZ_SM, color: approved ? '1A5C38' : 'C00000' })], { w: CW, f: 'F0F7E6' }),
  ]),
  rw([
    cl([p('Caracteres', { size: SZ_SM })], { w: CW }),
    cl([p(String(srcChars), { size: SZ_SM })], { w: CW }),
    cl([p(String(leftChars), { size: SZ_SM })], { w: CW }),
    cl([p(charPct + '%', { bold: true, size: SZ_SM, color: approved ? '1A5C38' : 'C00000' })], { w: CW, f: 'F0F7E6' }),
  ]),
  rw([
    cl([p('Estado', { bold: true, size: SZ_SM })], { w: CW }),
    cl([p('')], { w: CW }),
    cl([p('')], { w: CW }),
    cl([p(approved ? '✓ APROBADO' : '✗ REQUIERE REVISIÓN', { bold: true, size: SZ_SM, color: approved ? '1A5C38' : 'C00000' })], { w: CW, f: approved ? 'F0F7E6' : 'FFF0F0' }),
  ]),
], TW_P, [CW, CW, CW, CW]);

// Replace the PENDING table (index 10 in portada.children — after banner)
// Find the table with PENDING text
for (let i = 0; i < portada.children.length; i++) {
  const child = portada.children[i];
  if (child instanceof Table) {
    // Check if this table has PENDING text by checking row count = 4 and has 4 columns
    try {
      const rows = child.root;
      // Simple heuristic: replace the first 4-column table after the verification banner
      if (child.root && child.root.length >= 2) {
        // Check if it's the verification table by looking at structure
        const firstRowCells = child.root[0];
        if (firstRowCells && JSON.stringify(child).includes('PENDING')) {
          portada.children[i] = verificationTable;
          console.log('Tabla de verificacion actualizada en posicion ' + i);
          break;
        }
      }
    } catch(e) {}
  }
}

// If the above detection didn't work, try a simpler approach:
// Just serialize and check
let found = false;
for (let i = 0; i < portada.children.length; i++) {
  try {
    const str = JSON.stringify(portada.children[i]);
    if (str.includes('PENDING')) {
      portada.children[i] = verificationTable;
      console.log('Tabla de verificacion reemplazada en posicion ' + i);
      found = true;
      break;
    }
  } catch(e) {}
}
if (!found) console.log('ADVERTENCIA: No se encontro tabla PENDING para reemplazar');

console.log('\nEnsamblando SILA v2...');

const doc = new Document({
  sections: [portada, seccionA, seccionA2, seccionB, seccionC, seccionC2, seccionD, seccionE],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(OUTPUT, buffer);
  console.log('SILA v2 generado: ' + OUTPUT);
  console.log('Tamano: ' + (buffer.length / 1024).toFixed(1) + ' KB');
}).catch(err => {
  console.error('Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
