// ============================================================
// CRISOL — tts.js  (Text-to-Speech with word tracking)
// Extracted from SILA v4 monolith · TTS module
// ============================================================

import { state } from './state.js';
import { gC, sC, calcProgress } from './storage.js';

// ============================================================
// TTS STATE
// ============================================================
let currentTTSId = null;
let ttsVoices = [];
let ttsQueue = [];
let ttsPaused = false;

// ============================================================
// LOAD VOICES
// ============================================================
export function loadVoices() {
  ttsVoices = window.speechSynthesis.getVoices();
}
if (window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

// ============================================================
// WORD WRAPPING for highlighting
// ============================================================
export function ttsWrapWords(container) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  const textNodes = [];
  while (walker.nextNode()) {
    if (walker.currentNode.textContent.trim()) textNodes.push(walker.currentNode);
  }
  textNodes.forEach(node => {
    const words = node.textContent.split(/(\s+)/);
    const frag = document.createDocumentFragment();
    words.forEach(w => {
      if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); }
      else if (w) { const sp = document.createElement('span'); sp.className = 'tts-w'; sp.textContent = w; frag.appendChild(sp); }
    });
    node.parentNode.replaceChild(frag, node);
  });
}

// ============================================================
// RESTORE HTML after TTS ends
// ============================================================
export function ttsRestoreHTML(pid) {
  const el = document.getElementById('tts-' + pid);
  if (!el) return;
  const container = el.parentElement;
  if (container && container._origHTML) { container.innerHTML = container._origHTML; delete container._origHTML; }
}

// ============================================================
// SPLIT TEXT into chunks for Chrome TTS limit
// ============================================================
export function splitText(text, maxLen) {
  if (text.length <= maxLen) return [text];
  const chunks = []; const sentences = text.split(/(?<=[.;])\s+/); let current = '';
  for (const s of sentences) {
    if ((current + ' ' + s).length > maxLen && current) { chunks.push(current.trim()); current = s; }
    else { current += (current ? ' ' : '') + s; }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

// ============================================================
// STATUS ELEMENT (fixed bar at bottom)
// ============================================================
export function getStatusEl() {
  let el = document.getElementById('tts-status');
  if (!el) {
    el = document.createElement('div');
    el.id = 'tts-status';
    el.style.cssText = 'position:fixed;bottom:0;left:260px;right:0;padding:8px 16px;background:var(--bg4);border-top:1px solid rgba(225,220,210,0.1);font-size:14px;color:var(--tx2);z-index:50;display:flex;align-items:center;gap:10px;';
    document.body.appendChild(el);
  }
  return el;
}

// ============================================================
// SIMPLE TTS for any text (used in doc editor)
// ============================================================
window.speakText = function (btn, text) {
  const synth = window.speechSynthesis;
  if (synth.speaking) { synth.cancel(); btn.textContent = '🔊'; return; }
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'es-ES'; utter.rate = 0.92;
  const v = ttsVoices.find(v => v.lang.startsWith('es')); if (v) utter.voice = v;
  btn.textContent = '⏸';
  utter.onend = () => { btn.textContent = '🔊'; };
  utter.onerror = () => { btn.textContent = '🔊'; };
  synth.speak(utter);
};

// ============================================================
// READ ENTIRE DOCUMENT aloud
// ============================================================
window.readDoc = function () {
  const getDocs = state.getDocs || (() => []);
  const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId); if (!doc) return;
  const synth = window.speechSynthesis;
  if (synth.speaking) { synth.cancel(); return; }
  let fullText = '';
  doc.blocks.forEach(b => {
    if (b.type === 'text' && b.content) fullText += b.content + '. ';
    else if (b.type === 'cite') fullText += 'Cita: ' + b.fragment + '. ' + b.ref + '. ';
  });
  if (!fullText.trim()) return;
  const chunks = splitText(fullText, 200);
  let idx = 0;
  function next() {
    if (idx >= chunks.length) return;
    const utter = new SpeechSynthesisUtterance(chunks[idx++]);
    utter.lang = 'es-ES'; utter.rate = 0.92;
    const v = ttsVoices.find(v => v.lang.startsWith('es')); if (v) utter.voice = v;
    utter.onend = next;
    synth.speak(utter);
  }
  next();
};

// ============================================================
// TOGGLE TTS — main paragraph TTS with word tracking
// ============================================================
window.toggleTTS = function (pid) {
  const synth = window.speechSynthesis;
  const btn = document.getElementById('tts-' + pid);
  const DATA = state.DATA;

  // CASE 1: Same paragraph, currently playing -> PAUSE
  if (currentTTSId === pid && !ttsPaused && synth.speaking) {
    synth.pause();
    ttsPaused = true;
    btn.textContent = '▶';
    btn.title = 'Reanudar';
    const st = getStatusEl();
    st.querySelector('span').textContent = '⏸ En pausa';
    st.querySelector('span').style.color = 'var(--amber)';
    return;
  }

  // CASE 2: Same paragraph, paused -> RESUME
  if (currentTTSId === pid && ttsPaused) {
    synth.resume();
    ttsPaused = false;
    btn.textContent = '⏸';
    btn.title = 'Pausar';
    const st = getStatusEl();
    st.querySelector('span').textContent = '🔊 Reproduciendo';
    st.querySelector('span').style.color = 'var(--green)';
    return;
  }

  // CASE 3: Different paragraph or stopped -> STOP previous and START new
  synth.cancel();
  ttsQueue = []; ttsPaused = false;
  // Clean up previous word highlights
  document.querySelectorAll('.tts-word-active').forEach(w => w.classList.remove('tts-word-active'));
  document.querySelectorAll('.tts-btn.playing').forEach(b => { b.classList.remove('playing'); b.textContent = '🔊'; b.title = 'Escuchar'; });
  if (currentTTSId === pid) { currentTTSId = null; ttsRestoreHTML(pid); const st = document.getElementById('tts-status'); if (st) st.remove(); return; }
  currentTTSId = null;

  // Get the text container and prepare word spans
  const textEl = btn.parentElement;
  const text = textEl.textContent.replace(/[🔊⏸⏹▶]/g, '').trim();
  if (!text) return;

  // Save original HTML and wrap words for tracking
  if (!textEl._origHTML) textEl._origHTML = textEl.innerHTML;
  ttsWrapWords(textEl);
  const wordSpans = textEl.querySelectorAll('.tts-w');

  const chunks = splitText(text, 200);
  ttsQueue = [...chunks];
  currentTTSId = pid;
  btn.classList.add('playing');
  btn.textContent = '⏸';
  btn.title = 'Pausar';

  const esVoice = ttsVoices.find(v => v.lang.startsWith('es')) || null;
  const statusEl = getStatusEl();
  const totalChunks = chunks.length;
  let chunkIdx = 0;
  let globalCharOffset = 0;

  function speakNext() {
    if (ttsQueue.length === 0 || currentTTSId !== pid) {
      btn.classList.remove('playing'); btn.textContent = '🔊'; btn.title = 'Escuchar'; currentTTSId = null; ttsPaused = false;
      document.querySelectorAll('.tts-word-active').forEach(w => w.classList.remove('tts-word-active'));
      ttsRestoreHTML(pid);
      statusEl.innerHTML = '<span style="color:var(--green);">✓ Lectura completada</span>';
      const m = pid.match(/^p(\d+)-(\d+)$/);
      if (m) {
        const si = parseInt(m[1]), pi = parseInt(m[2]);
        const cid = `c${si}-${pi}`;
        if (!gC(cid)) { sC(cid, true); const chk = document.querySelector('#acc-' + pid + ' .pcheck'); if (chk) { chk.classList.add('done'); chk.textContent = '✓'; } }
        calcProgress();
        const sec = DATA.sections[si];
        if (sec && pi < sec.paragraphs.length - 1) {
          // Next paragraph in same section
          setTimeout(() => {
            window.togglePar('p' + si + '-' + (pi + 1));
            const nextAcc = document.getElementById('acc-p' + si + '-' + (pi + 1));
            if (nextAcc) nextAcc.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => window.toggleTTS('p' + si + '-' + (pi + 1)), 500);
          }, 1000);
          statusEl.innerHTML = '<span style="color:var(--gold);">→ Siguiente párrafo...</span>';
          return;
        } else if (si < DATA.sections.length - 1) {
          // Last paragraph: advance to next section
          const pkc = document.querySelector('.pkc');
          if (pkc && !pkc.classList.contains('done')) window.tgP('s' + si, pkc);
          setTimeout(() => {
            window.switchSub(si + 1);
            setTimeout(() => {
              window.togglePar('p' + (si + 1) + '-0');
              const acc = document.getElementById('acc-p' + (si + 1) + '-0');
              if (acc) acc.scrollIntoView({ behavior: 'smooth', block: 'start' });
              setTimeout(() => window.toggleTTS('p' + (si + 1) + '-0'), 500);
            }, 300);
          }, 1000);
          statusEl.innerHTML = '<span style="color:var(--gold);">→ Siguiente sección...</span>';
          return;
        }
      }
      setTimeout(() => { if (statusEl.parentNode) statusEl.remove(); }, 3000);
      return;
    }
    chunkIdx++;
    const chunk = ttsQueue.shift();
    statusEl.innerHTML = `<span style="color:var(--green);">🔊 Reproduciendo</span> <span>Parte ${chunkIdx}/${totalChunks}</span> <div style="flex:1;height:4px;background:rgba(225,220,210,0.1);border-radius:2px;overflow:hidden;"><div style="height:100%;background:var(--gold);border-radius:2px;width:${Math.round(chunkIdx / totalChunks * 100)}%;transition:width 0.3s;"></div></div> <span style="min-width:36px;text-align:right;">${Math.round(chunkIdx / totalChunks * 100)}%</span>`;

    const chunkStartOffset = globalCharOffset;
    const utter = new SpeechSynthesisUtterance(chunk);
    utter.lang = 'es-ES'; utter.rate = 0.92; utter.pitch = 1;
    if (esVoice) utter.voice = esVoice;

    // Word highlighting via boundary events
    utter.onboundary = function (e) {
      if (e.name !== 'word') return;
      const charPos = chunkStartOffset + e.charIndex;
      document.querySelectorAll('.tts-word-active').forEach(w => w.classList.remove('tts-word-active'));
      let cumLen = 0; let found = false;
      for (let wi = 0; wi < wordSpans.length; wi++) {
        const wLen = wordSpans[wi].textContent.length + 1;
        if (!found && cumLen + wLen > charPos) {
          const target = wordSpans[Math.min(wi + 1, wordSpans.length - 1)];
          target.classList.add('tts-word-active');
          const rect = target.getBoundingClientRect();
          const container = document.querySelector('.content');
          if (rect.bottom > window.innerHeight - 60) container.scrollBy({ top: 80, behavior: 'smooth' });
          found = true; break;
        }
        cumLen += wLen;
      }
    };

    utter.onend = function () { globalCharOffset += chunk.length + 1; speakNext(); };
    utter.onerror = (e) => {
      if (e.error === 'interrupted') return;
      statusEl.innerHTML = `<span style="color:var(--red);">❌ Error: ${e.error}</span>`;
      ttsQueue = []; btn.classList.remove('playing'); btn.textContent = '🔊'; currentTTSId = null; ttsPaused = false;
      document.querySelectorAll('.tts-word-active').forEach(w => w.classList.remove('tts-word-active'));
      ttsRestoreHTML(pid);
    };
    synth.speak(utter);
  }
  speakNext();
};
