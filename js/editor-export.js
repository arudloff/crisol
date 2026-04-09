// ============================================================
// CRISOL — editor-export.js
// Document export: APA, txt, clipboard, docx
// Extracted from editor.js (Sprint S4)
// ============================================================

import { state } from './state.js';
import { showToast, escH } from './utils.js';
import { getDocs } from './editor.js';

// ============================================================
// EXPORT APA
// ============================================================
export function buildDocExport(docId) {
  const docs = getDocs(); const doc = docs.find(d => d.id === docId); if (!doc) return '';
  let text = doc.title.toUpperCase() + '\n' + '═'.repeat(doc.title.length) + '\n\n';
  const refs = new Set();
  doc.blocks.forEach(b => {
    if (b.type === 'heading') text += '\n' + b.content + '\n' + '─'.repeat(b.content.length) + '\n\n';
    else if (b.type === 'text' && b.content) text += b.content + '\n\n';
    else if (b.type === 'cite') {
      text += '  "' + b.fragment + '"\n  — ' + b.ref + '\n\n';
      refs.add(b.ref);
    }
  });
  if (refs.size) {
    text += '\n' + '═'.repeat(30) + '\nREFERENCIAS\n' + '═'.repeat(30) + '\n\n';
    [...refs].sort().forEach(r => { text += r + '\n'; });
  }
  return text;
}

export function exportDocAPA(docId) {
  const text = buildDocExport(docId); if (!text) return;
  const docs = getDocs(); const doc = docs.find(d => d.id === docId);
  const h = `<div style="text-align:center;padding:10px;">
    <h3 style="color:#fff;margin-bottom:14px;">Exportar documento</h3>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
      <button class="btn bg" onclick="exportDocxAPA('${escH(docId)}');document.getElementById('export-modal').remove();" style="padding:10px 20px;">📄 Word APA (.docx)</button>
      <button class="btn bo" onclick="exportTxt('${escH(docId)}');document.getElementById('export-modal').remove();">📝 Texto plano (.txt)</button>
      <button class="btn bo" onclick="exportClipboard('${escH(docId)}');document.getElementById('export-modal').remove();">📋 Copiar al portapapeles</button>
    </div>
    <button class="btn bo" onclick="document.getElementById('export-modal').remove();" style="margin-top:12px;font-size:12px;color:var(--tx3);">Cancelar</button>
  </div>`;
  const modal = document.createElement('div');
  modal.id = 'export-modal';
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:100;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `<div style="background:var(--bg2);border:1px solid rgba(220,215,205,0.1);border-radius:12px;padding:24px;max-width:400px;width:90%;">${h}</div>`;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}
window.exportDocAPA = exportDocAPA;

export function exportTxt(docId) {
  const text = buildDocExport(docId);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  const docs = getDocs(); const doc = docs.find(d => d.id === docId);
  a.download = (doc ? doc.title : 'documento').replace(/[^a-zA-Z0-9áéíóúñ ]/gi, '_') + '.txt'; a.click();
}
window.exportTxt = exportTxt;

export function exportClipboard(docId) {
  const text = buildDocExport(docId);
  navigator.clipboard.writeText(text).then(() => showToast('Copiado al portapapeles', 'success'));
}
window.exportClipboard = exportClipboard;

export async function exportDocxAPA(docId) {
  const docs = getDocs(); const doc = docs.find(d => d.id === docId); if (!doc) return;
  showToast('Generando .docx APA...', 'info');
  if (!window.docx) {
    try {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.min.js';
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
    } catch (e) { showToast('Error cargando librería docx', 'error'); return; }
  }
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = window.docx;
  const children = [];
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: doc.title, bold: true, size: 24, font: 'Times New Roman' })] }));
  children.push(new Paragraph({ spacing: { after: 400 }, children: [] }));
  const refs = new Set();
  doc.blocks.forEach(b => {
    if (b.type === 'heading') {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 360, after: 120 }, children: [new TextRun({ text: b.content || '', bold: true, size: 24, font: 'Times New Roman' })] }));
    } else if (b.type === 'text' && b.content) {
      const lines = b.content.split('\n');
      lines.forEach(line => {
        if (!line.trim()) return;
        const runs = [];
        const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
        parts.forEach(part => {
          if (part.startsWith('**') && part.endsWith('**')) {
            runs.push(new TextRun({ text: part.slice(2, -2), bold: true, size: 24, font: 'Times New Roman' }));
          } else if (part.startsWith('*') && part.endsWith('*')) {
            runs.push(new TextRun({ text: part.slice(1, -1), italics: true, size: 24, font: 'Times New Roman' }));
          } else if (part) {
            runs.push(new TextRun({ text: part, size: 24, font: 'Times New Roman' }));
          }
        });
        if (runs.length) children.push(new Paragraph({ spacing: { line: 480, after: 0 }, indent: { firstLine: 720 }, children: runs }));
      });
    } else if (b.type === 'cite') {
      children.push(new Paragraph({
        spacing: { line: 480, after: 0 }, indent: { left: 720 }, children: [
          new TextRun({ text: '"' + (b.fragment || '') + '"', italics: true, size: 24, font: 'Times New Roman' }),
          new TextRun({ text: ' — ' + (b.ref || ''), size: 24, font: 'Times New Roman' })
        ]
      }));
      if (b.ref) refs.add(b.ref);
      children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
    }
  });
  if (refs.size) {
    children.push(new Paragraph({ spacing: { before: 600 }, children: [] }));
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 360, after: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Referencias', bold: true, size: 24, font: 'Times New Roman' })] }));
    [...refs].sort().forEach(r => {
      children.push(new Paragraph({ spacing: { line: 480, after: 0 }, indent: { left: 720, hanging: 720 }, children: [new TextRun({ text: r, size: 24, font: 'Times New Roman' })] }));
    });
  }
  const docx = new Document({ sections: [{ properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, children }] });
  const blob = await Packer.toBlob(docx);
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = (doc.title || 'documento').replace(/[^a-zA-Z0-9áéíóúñ ]/gi, '_') + '.docx'; a.click();
  showToast('📄 .docx APA descargado', 'success');
}
window.exportDocxAPA = exportDocxAPA;
