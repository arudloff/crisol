// ============================================================
// CRISOL — projects-reports.js
// Report generation, portfolio, and claims export
// ============================================================

import { showToast } from './utils.js';
import { getProjects } from './projects-core.js';

function _getArtifactTags() {
  return (typeof ARTIFACT_TAGS !== 'undefined') ? ARTIFACT_TAGS : [];
}

function generateProjectStructure(projId) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  const name = (proj.eje ? proj.eje + ' - ' : '') + proj.nombre;
  const safeName = name.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ _-]/g, '').replace(/\s+/g, '_');
  let content = `# Estructura de carpetas: ${name}\n`;
  content += `# Generado por YUNQUE el ${new Date().toLocaleDateString()}\n\n`;
  content += `# Instrucciones:\n`;
  content += `# 1. Crea una carpeta en Google Drive llamada "${name}"\n`;
  content += `# 2. Dentro, crea las subcarpetas listadas abajo\n`;
  content += `# 3. Pega el link de la carpeta en YUNQUE → Links del proyecto\n\n`;
  content += `${safeName}/\n`;
  content += `├── 01_Literatura/\n`;
  content += `│   ├── PDFs/                    ← Papers descargados de Elicit/Scholar\n`;
  content += `│   ├── YUNQUE_procesados/        ← Documentos .docx generados por /sila\n`;
  content += `│   └── Protocolo_busqueda.docx   ← String de búsqueda + criterios PRISMA\n`;
  content += `├── 02_Datos/\n`;
  content += `│   ├── Instrumentos/             ← Guiones de entrevista, encuestas\n`;
  content += `│   ├── Raw/                      ← Datos brutos (transcripciones, CSV)\n`;
  content += `│   └── Procesados/               ← Datos limpios, codificados\n`;
  content += `├── 03_Manuscrito/\n`;
  content += `│   ├── ${safeName}_v1.docx       ← Versión de trabajo\n`;
  content += `│   ├── Cover_letter.docx\n`;
  content += `│   └── Response_reviewers.docx\n`;
  content += `├── 04_Submission/\n`;
  content += `│   ├── Ronda_1/                  ← Versión enviada + reviews recibidos\n`;
  content += `│   ├── Ronda_2/                  ← Revisión + response letter\n`;
  content += `│   └── Submission_log.md         ← Registro: journal, fecha, decisión\n`;
  content += `└── README.md                     ← Este archivo\n\n`;
  content += `# Metadatos del proyecto\n`;
  content += `Nombre: ${proj.nombre}\n`;
  if (proj.eje) content += `Eje: ${proj.eje}\n`;
  if (proj.descripcion) content += `Descripción: ${proj.descripcion}\n`;
  if (proj.fechaLimite) content += `Deadline: ${proj.fechaLimite}\n`;
  content += `Artículos vinculados: ${(proj.articulos || []).length}\n`;
  content += `Documentos vinculados: ${(proj.documentos || []).length}\n`;
  if (proj.preguntaLog && proj.preguntaLog.length > 0) {
    content += `\n# Pregunta de investigación actual\n`;
    content += proj.preguntaLog[proj.preguntaLog.length - 1].texto + '\n';
  }
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = safeName + '_estructura.md'; a.click();
  showToast('📁 Estructura descargada', 'success');
}

function generateDrReport(projId) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId);
  if (!proj) { showToast('Proyecto no encontrado', 'error'); return; }

  const drFases = proj.drFases || [];
  const drOutputs = proj.drOutputs || {};
  const gateRecords = proj.drGateRecords || [];
  const completedCount = drFases.filter(f => f.estado === 'completado').length;
  const today = new Date().toISOString().split('T')[0];

  function out(phase, task, fallback) {
    return drOutputs[phase]?.[task] || fallback || '(no registrado)';
  }

  function gateSum(gateKey) {
    const rec = gateRecords.find(g => g.gate === gateKey);
    if (!rec) return '(no completado)';
    if (rec.skipped) return '⚠ SALTADO — ' + rec.fecha;
    const answers = Object.entries(rec.responses || {}).map(([k, v]) => {
      return '  - ' + k + ': ' + (v.label || v || '—');
    }).join('\n');
    return '✅ ' + rec.fecha + '\n' + answers;
  }

  let r = '';
  r += '# Reporte de Trazabilidad\n\n';
  r += '## 1. Ficha técnica\n\n';
  r += '| Campo | Valor |\n|-------|-------|\n';
  r += '| **Documento** | ' + (proj.nombre || '(sin título)') + ' |\n';
  r += '| **Investigador** | ' + (proj._investigador || 'Alejandro Rudloff') + ' |\n';
  r += '| **Fecha de generación** | ' + today + ' |\n';
  const wfModeReport = proj.workflowMode || (proj.drMode ? 'dr' : 'default');
  const modeLabels = { dr: '🧬 /dr', clo: '🔬 clo-author', mixed: '🔗 Mixto', default: 'Estándar' };
  r += '| **Modo** | ' + (modeLabels[wfModeReport] || 'Estándar') + ' |\n';
  r += '| **Fases /dr completadas** | ' + completedCount + ' de ' + drFases.length + ' |\n';
  const cloCompletedCount = (proj.cloFases || []).filter(f => f.estado === 'completado').length;
  if (proj.cloFases && proj.cloFases.length > 0) {
    r += '| **Fases clo-author completadas** | ' + cloCompletedCount + ' de ' + proj.cloFases.length + ' |\n';
  }
  r += '| **Fases activas** | ' + drFases.filter(f => f.estado === 'en_progreso').map(f => f.nombre).join(', ') + (proj.cloFases ? ' · ' + proj.cloFases.filter(f => f.estado === 'en_progreso').map(f => f.nombre).join(', ') : '') + ' |\n';
  r += '\n---\n\n';

  r += '## 2. Genealogía del argumento\n\n';
  r += '### Pregunta inicial\n' + out('dr_exploracion', 0, '(no registrada en CRISOL)') + '\n\n';
  r += '### Gap identificado\n' + out('dr_exploracion', 1, '(no registrado)') + '\n\n';
  r += '### Estrategia de búsqueda\n' + out('dr_exploracion', 2, '(no registrada)') + '\n\n';
  r += '### Fuentes seleccionadas\n' + out('dr_exploracion', 3, '(no registradas)') + '\n\n';
  r += '### Posición tentativa\n' + out('dr_exploracion', 4, '(no registrada)') + '\n\n';

  const readOutputs = drOutputs['dr_lectura'] || {};
  const readEntries = Object.values(readOutputs).filter(v => v);
  if (readEntries.length > 0) {
    r += '### Fichas de explotación (' + readEntries.length + ')\n';
    readEntries.forEach((entry, i) => {
      const preview = entry.length > 200 ? entry.substring(0, 200) + '...' : entry;
      r += '\n**Ficha ' + (i + 1) + ':**\n' + preview + '\n';
    });
    r += '\n';
  }

  r += '### Profundización: Mentor socrático\n' + out('dr_depth', 0, '(no ejecutado)') + '\n\n';
  r += '### Respuesta a la pregunta clave del mentor\n' + out('dr_depth', 1, '(no registrada)') + '\n\n';
  r += '### Profundización: Abogado del diablo\n' + out('dr_depth', 2, '(no ejecutado)') + '\n\n';
  r += '### Respuesta al ataque más peligroso\n' + out('dr_depth', 3, '(no registrada)') + '\n\n';
  r += '---\n\n';

  r += '## 3. Trayectoria de calidad\n\n';
  const reviewOutputs = [drOutputs['dr_critica']?.[0], drOutputs['dr_critica']?.[3], drOutputs['dr_entrega']?.[1]].filter(v => v);
  if (reviewOutputs.length > 0) {
    r += '### Scores por ronda de revisión\n\n';
    reviewOutputs.forEach((rev, i) => {
      r += '**Ronda ' + (i + 1) + ':**\n' + (rev.length > 500 ? rev.substring(0, 500) + '...' : rev) + '\n\n';
    });
  } else {
    r += '(No hay scores de /dr review registrados en CRISOL)\n\n';
  }

  r += '### Humanización\n' + out('dr_humanize', 0, '(no ejecutado)') + '\n\n';
  r += '---\n\n';

  r += '## 4. Integridad de fuentes\n\n';
  r += out('dr_verify', 0, '(No hay verificación de citas registrada)') + '\n\n';
  r += '---\n\n';

  const cloOutputs = proj.cloOutputs || {};
  const cloGateRecords = proj.cloGateRecords || [];
  const cloFases = proj.cloFases || [];
  const hasCloData = Object.keys(cloOutputs).length > 0 || cloGateRecords.length > 0;

  if (hasCloData) {
    r += '## 4b. Análisis empírico (clo-author)\n\n';

    function cloOut(phase, task, fallback) {
      return cloOutputs[phase]?.[task] || fallback || '(no registrado)';
    }

    r += '### Descubrimiento\n' + cloOut('clo_discover', 1, '(no ejecutado)') + '\n\n';
    r += '### Estrategia de identificación\n' + cloOut('clo_strategize', 0, '(no ejecutada)') + '\n\n';
    r += '### Análisis/Código\n' + cloOut('clo_analyze', 0, '(no ejecutado)') + '\n\n';
    r += '### Escritura LaTeX\n' + cloOut('clo_write', 0, '(no ejecutada)') + '\n\n';

    const cloReviewOut = cloOutputs['clo_review'] || {};
    const reviewEntries = Object.values(cloReviewOut).filter(v => v);
    if (reviewEntries.length > 0) {
      r += '### Peer review simulado\n';
      reviewEntries.forEach((entry, i) => {
        const preview = entry.length > 500 ? entry.substring(0, 500) + '...' : entry;
        r += '\n**Report ' + (i + 1) + ':**\n' + preview + '\n';
      });
      r += '\n';
    }

    r += '### R&R\n' + cloOut('clo_revise', 0, '(no ejecutado)') + '\n\n';
    r += '---\n\n';
  }

  r += '## 5. Decisiones del investigador\n\n';
  r += '### Gates /dr\n\n';
  const gateNames = {
    dr_gate_exploracion: 'Exploración', dr_gate_lectura: 'Lectura',
    dr_gate_escritura: 'Escritura', dr_gate_critica: 'Revisión crítica',
    dr_gate_humanize: 'Humanización', dr_gate_verify: 'Verificación',
    dr_gate_depth: 'Profundización'
  };
  if (gateRecords.length > 0) {
    gateRecords.forEach(rec => {
      r += '**' + (gateNames[rec.gate] || rec.gate) + '** — ' + gateSum(rec.gate) + '\n\n';
    });
  } else {
    r += '(No hay gates /dr registrados)\n\n';
  }

  if (cloGateRecords.length > 0) {
    r += '### Gates clo-author\n\n';
    const cloGateNames = {
      clo_gate_discover: 'Descubrimiento', clo_gate_strategize: 'Estrategia',
      clo_gate_analyze: 'Análisis', clo_gate_write: 'Escritura',
      clo_gate_review: 'Peer Review'
    };
    cloGateRecords.forEach(rec => {
      const name = cloGateNames[rec.gate] || rec.gate;
      if (rec.skipped) { r += '**' + name + '** — ⚠ SALTADO — ' + rec.fecha + '\n\n'; }
      else {
        const answers = Object.entries(rec.responses || {}).map(([k, v]) => '  - ' + k + ': ' + (v.label || v || '—')).join('\n');
        r += '**' + name + '** — ✅ ' + rec.fecha + '\n' + answers + '\n\n';
      }
    });
  }

  r += '---\n\n';

  const wfMode = proj.workflowMode || (proj.drMode ? 'dr' : 'default');
  const modeLabel = { dr: '/dr (Doctoral Research)', clo: 'clo-author (empirical paper)', mixed: '/dr + clo-author (hybrid)' };
  r += '## 6. Declaración metodológica\n\n';
  r += 'Este texto fue producido siguiendo el protocolo ' + (modeLabel[wfMode] || '/dr') + '\n';
  r += 'del sistema CRISOL.\n\n';

  if (wfMode === 'dr' || wfMode === 'mixed') {
    r += '### Rol de la IA — /dr (producción doctoral)\n';
    r += '- Lectura: extracción de conexiones y citas (verificadas por el investigador)\n';
    r += '- Escritura: borrador a partir de esqueleto aprobado (voz calibrada al investigador)\n';
    r += '- Revisión: evaluación en 6 componentes (interpretada y priorizada por el investigador)\n';
    r += '- Humanización: detección de patrones IA (correcciones aplicadas selectivamente)\n';
    r += '- Verificación: contraste de citas contra PDFs (errores corregidos por el investigador)\n';
    r += '- Profundización: preguntas socráticas y ataques adversariales (respondidos por el investigador)\n\n';
  }
  if (wfMode === 'clo' || wfMode === 'mixed') {
    r += '### Rol de la IA — clo-author (análisis empírico)\n';
    r += '- Descubrimiento: revisión de literatura y evaluación de datos (librarian + explorer)\n';
    r += '- Estrategia: diseño de identificación causal (strategist, validado por strategist-critic)\n';
    r += '- Análisis: pipeline de datos y estimación (coder, verificado por coder-critic)\n';
    r += '- Escritura: manuscrito LaTeX (writer, humanizado y evaluado por writer-critic)\n';
    r += '- Peer review: simulación con editor + 2 referees ciegos (domain + methods)\n';
    r += '- R&R: clasificación de comentarios y routing a agentes especializados\n\n';
  }
  r += '### Rol del investigador\n';
  r += '- Formulación de pregunta y posición inicial\n';
  r += '- Aprobación de esqueletos argumentales y estrategias de identificación\n';
  r += '- Decisiones en cada quality gate\n';
  r += '- Verificación de autoría intelectual\n';
  r += '- Respuesta a cuestionamientos del mentor socrático\n';
  r += '- Reconstrucción después de ataques del abogado del diablo\n';
  r += '- Corrección manual de citas, datos, y código\n';
  r += '- Decisiones sobre items DISAGREE en R&R (nunca delegadas a IA)\n\n';
  r += '---\n\n';
  r += '*Generado por CRISOL · ' + today + '*\n';

  const blob = new Blob([r], { type: 'text/markdown;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  const safeName = (proj.nombre || 'proyecto').replace(/[^a-zA-Z0-9áéíóúñ _-]/g, '').replace(/\s+/g, '_');
  a.download = 'Reporte_Trazabilidad_' + safeName + '_' + today + '.md';
  a.click();
  showToast('📊 Reporte de trazabilidad generado', 'success');
}

function generatePortfolio(projId) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId);
  if (!proj) { showToast('Proyecto no encontrado', 'error'); return; }
  const artifacts = proj.drArtifacts || [];
  const tags = _getArtifactTags();
  const today = new Date().toISOString().split('T')[0];

  let r = '# Portafolio de Artefactos del Proceso\n';
  r += '## ' + (proj.nombre || 'Proyecto') + '\n';
  r += '### Generado: ' + today + '\n\n---\n\n';

  const scored = artifacts.filter(a => a.score != null).sort((a, b) => a.date.localeCompare(b.date));
  if (scored.length > 0) {
    r += '## Trayectoria de scores\n\n';
    r += '| Fase | Tag | Iter | Fecha | Score | Delta | Estado |\n';
    r += '|------|-----|------|-------|-------|-------|--------|\n';
    scored.forEach(a => {
      const tagObj = tags.find(t => t.id === a.tag);
      r += `| ${a.phase} | ${tagObj ? tagObj.icon + ' ' + tagObj.label : a.tag} | R${a.iteration} | ${a.date} | ${a.score} | ${a.delta != null ? (a.delta >= 0 ? '+' : '') + a.delta : '—'} | ${a.status} |\n`;
    });
    r += '\n';
  }

  r += '## Artefactos por fase\n\n';
  const phases = {};
  artifacts.forEach(a => {
    if (!phases[a.phase]) phases[a.phase] = [];
    phases[a.phase].push(a);
  });
  Object.entries(phases).forEach(([phase, arts]) => {
    r += `### ${phase} (${arts.length})\n`;
    arts.forEach(a => {
      const tagObj = tags.find(t => t.id === a.tag);
      r += `- **${tagObj ? tagObj.icon : '📌'} ${a.name}** — ${a.date} — ${a.status}`;
      if (a.score != null) r += ` — Score: ${a.score}`;
      if (a.delta != null) r += ` (${a.delta >= 0 ? '+' : ''}${a.delta})`;
      r += '\n';
      if (a.links && a.links.length > 0) {
        a.links.forEach(l => { r += `  - [${l.desc || 'Enlace'}](${l.url})\n`; });
      }
      if (a.notes) r += `  > ${a.notes}\n`;
    });
    r += '\n';
  });

  const withNotes = artifacts.filter(a => a.notes);
  if (withNotes.length > 0) {
    r += '## Reflexiones del investigador\n\n';
    withNotes.forEach(a => {
      r += `**${a.date} — ${a.name}:** ${a.notes}\n\n`;
    });
  }

  const branches = proj.drBranches || [];
  if (branches.length > 1) {
    r += '## Ramas exploradas\n\n';
    branches.forEach(b => {
      const statusLabels = { active: 'activa', paused: 'pausada', archived: 'archivada' };
      r += `### ${b.name} (${statusLabels[b.status] || b.status})\n`;
      if (b.forkedFrom) {
        const parent = branches.find(p => p.id === b.forkedFrom);
        r += `Bifurcó de ${parent?.name || b.forkedFrom} en fase ${b.forkedAtPhase} · ${b.forkedDate}\n`;
      }
      r += '\n';
    });
  }

  r += '---\n*Generado por CRISOL · ' + today + '*\n';

  const blob = new Blob([r], { type: 'text/markdown;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  const safeName = (proj.nombre || 'proyecto').replace(/[^a-zA-Z0-9áéíóúñ _-]/g, '').replace(/\s+/g, '_');
  a.download = 'Portafolio_' + safeName + '_' + today + '.md';
  a.click();
  showToast('📊 Portafolio generado', 'success');
}

function buildClaimsText() {
  const manifest = window.SILA_MANIFEST || [];
  let lines = ['YUNQUE — Claims para marco teórico', 'Generado: ' + new Date().toLocaleDateString(), '', ''];
  ['support', 'contrast', 'neutral'].forEach(type => {
    const label = type === 'support' ? 'APOYAN MI TESIS' : type === 'contrast' ? 'CONTRASTAN MI TESIS' : 'NEUTROS';
    let items = [];
    manifest.forEach(art => {
      const artData = window.SILA_ARTICLES[art.key]; if (!artData) return;
      let d = {}; try { const raw = localStorage.getItem('sila4_' + art.key) || localStorage.getItem('sila4'); if (raw) d = JSON.parse(raw); } catch (e) { /* storage error */ }
      const claims = d.claims || {}; const notes = d.claimNotes || {};
      Object.entries(claims).forEach(([pid, t]) => {
        if (t !== type) return;
        const m = pid.match(/^p(\d+)-(\d+)$/); if (!m) return;
        const si = parseInt(m[1]), pi = parseInt(m[2]);
        const sec = artData.sections[si]; if (!sec) return;
        const par = sec.paragraphs[pi]; if (!par) return;
        items.push({ authors: art.authors, year: art.year, sec: sec.title, text: par.text.substring(0, 300), note: notes[pid] || '' });
      });
    });
    if (items.length === 0) return;
    lines.push('═══ ' + label + ' (' + items.length + ') ═══', '');
    items.forEach((it, i) => {
      lines.push((i + 1) + '. Según ' + it.authors + ' (' + it.year + '), ' + it.sec + ':');
      lines.push('   "' + it.text + '"');
      if (it.note) lines.push('   → Nota: ' + it.note);
      lines.push('');
    });
  });
  return lines.join('\n');
}

function exportClaims() {
  let text = buildClaimsText();
  navigator.clipboard.writeText(text).then(() => alert('Claims copiados al portapapeles (' + text.split('\n').length + ' líneas)'));
}

function exportClaimsFile() {
  let text = buildClaimsText();
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'YUNQUE_claims_tesis.txt'; a.click();
}

// Window globals for inline onclick
window.generateProjectStructure = generateProjectStructure;
window.generateDrReport = generateDrReport;
window.generatePortfolio = generatePortfolio;
window.exportClaims = exportClaims;
window.exportClaimsFile = exportClaimsFile;

export { generateProjectStructure, generateDrReport, generatePortfolio, buildClaimsText, exportClaims, exportClaimsFile };
