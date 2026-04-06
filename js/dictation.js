// ============================================================
// CRISOL — dictation.js  (Voice dictation / Speech-to-Text)
// Extracted from SILA v4 monolith · dictation module
// ============================================================

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let activeRecognition = null;
let activeRecBtn = null;

// Expose to other modules that need to check/stop active dictation
window._activeRecognition = null;
window._activeRecBtn = null;

// ============================================================
// TOGGLE DICTATION
// ============================================================
window.toggleDictation = function (btn, textareaId) {
  if (!SpeechRecognition) { alert('Tu navegador no soporta dictado por voz. Usa Chrome o Edge.'); return; }
  // If already recording this textarea, stop
  if (activeRecBtn === btn && activeRecognition) {
    activeRecognition.stop();
    return;
  }
  // Stop any existing recording
  if (activeRecognition) { activeRecognition.stop(); }

  const textarea = document.getElementById(textareaId);
  if (!textarea) return;
  const rec = new SpeechRecognition();
  rec.lang = 'es-CL';
  rec.continuous = true;
  rec.interimResults = true;

  let finalTranscript = textarea.value;
  if (finalTranscript && !finalTranscript.endsWith(' ')) finalTranscript += ' ';

  rec.onstart = function () {
    btn.classList.add('recording');
    btn.textContent = '⏹';
    btn.title = 'Detener dictado';
    activeRecognition = rec;
    activeRecBtn = btn;
    window._activeRecognition = rec;
    window._activeRecBtn = btn;
  };
  rec.onresult = function (e) {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        finalTranscript += e.results[i][0].transcript + ' ';
      } else {
        interim += e.results[i][0].transcript;
      }
    }
    textarea.value = finalTranscript + interim;
    textarea.style.height = 'auto'; textarea.style.height = textarea.scrollHeight + 'px';
  };
  rec.onend = function () {
    btn.classList.remove('recording');
    btn.textContent = '🎤';
    btn.title = 'Dictar por voz';
    textarea.value = finalTranscript.trim();
    // Trigger onchange to save
    textarea.dispatchEvent(new Event('change'));
    activeRecognition = null;
    activeRecBtn = null;
    window._activeRecognition = null;
    window._activeRecBtn = null;
  };
  rec.onerror = function (e) {
    btn.classList.remove('recording');
    btn.textContent = '🎤';
    activeRecognition = null; activeRecBtn = null;
    window._activeRecognition = null; window._activeRecBtn = null;
    if (e.error !== 'aborted') console.error('Dictation error:', e.error);
  };
  rec.start();
};

// ============================================================
// DICT WRAP — wraps a textarea HTML with dictation button
// ============================================================
export function dictWrap(textareaHtml, id) {
  if (!SpeechRecognition) return textareaHtml; // no dictation support, return as-is
  return `<div class="dict-wrap">${textareaHtml}<button class="dict-btn" onclick="toggleDictation(this,'${id}')" title="Dictar por voz">🎤</button></div>`;
}

// Also expose as window for articles.js fallback
window._dictWrap = dictWrap;
