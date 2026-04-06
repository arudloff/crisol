// ============================================================
// CRISOL — flashcards.js  (flashcard management & rendering)
// Extracted from SILA v4 monolith · flashcard module
// ============================================================

import { state } from './state.js';
import { ld, sv } from './storage.js';

// ============================================================
// DEFAULT CARDS (legacy for bustamante_2004)
// ============================================================
const DEFAULT_CARDS = [
  { id: 'b1', type: 'basic', front: '¿Qué es la complejidad según Bustamante y Opazo (2004)?', back: 'Un proceso sistemático y recursivo por el cual los sistemas sociales, al reducir la complejidad del entorno, aumentan la propia.' },
  { id: 'b2', type: 'basic', front: '¿Cuándo se dice que un sistema es complejo?', back: 'Cuando puede tomar al menos dos estados compatibles con su estructura. El entorno siempre es más complejo que el sistema.' },
  { id: 'b3', type: 'basic', front: '¿Qué son los "límites de sentido" según Luhmann?', back: 'El mecanismo por el cual un sistema social define la porción del entorno que aprende y reduce, estableciendo las fronteras operativas.' },
  { id: 'b4', type: 'basic', front: '¿Qué es la autopoiesis aplicada a las empresas?', back: 'Capacidad de un sistema de producirse y mantenerse a sí mismo. Las empresas son autopoiéticas: se autosostienen y autoorganizan.' },
  { id: 'b5', type: 'basic', front: '¿Qué es el acoplamiento estructural?', back: 'Relación entre sistemas donde los cambios de uno generan perturbaciones en el otro sin determinar su respuesta. Autonomía mutua.' },
  { id: 'b6', type: 'basic', front: '¿Qué es la homeostasis organizacional?', back: 'Capacidad de sustentarse a sí misma, aprendiendo y desarrollándose. Sin homeostasis, el sistema muere.' },
  { id: 'b7', type: 'basic', front: '¿Qué es la reducción de complejidad?', back: 'Proceso INTERNO: definir límites de sentido para aprender del ambiente. Paradójicamente, reduce complejidad externa pero aumenta la interna.' },
  { id: 'b8', type: 'basic', front: 'Diferencia: reducción de complejidad vs simplificación', back: 'Reducción: proceso INTERNO vía límites de sentido. Simplificación: intento de cambiar el entorno (no funciona según Luhmann).' },
  { id: 'b9', type: 'basic', front: 'Diferencia: planificación estratégica vs gerencial', back: 'Estratégica (largo plazo): entorno fijo, define sentido. Gerencial (corto plazo): entorno volátil, sometida a los azotes del ambiente.' },
  { id: 'b10', type: 'basic', front: 'Diferencia: autopoiesis vs heteropoiesis', back: 'Autopoiesis: se autoproduce. Heteropoiesis: creación artificial. Personas creando empresas = "dato anecdótico".' },
  { id: 'b11', type: 'basic', front: 'Parsons vs Luhmann/Habermas: ¿dónde están las personas?', back: 'Parsons: en el AMBIENTE. Luhmann/Habermas: en el SISTEMA. Distinción crucial para fuentes de complejidad.' },
  { id: 'b12', type: 'basic', front: 'Diferencia: complejidad vs incertidumbre', back: 'Complejidad: sistémica, múltiples estados. Incertidumbre: dirigida a una decisión. Complejidad sin incertidumbre: sí. Al revés: no.' },
  { id: 'b13', type: 'basic', front: '¿Por qué el tiempo cataliza la complejidad?', back: '1) Capacidad limitada de abstracción temporal. 2) Variables volátiles en corto pero uniformes en largo plazo.' },
  { id: 'b14', type: 'basic', front: '¿Por qué las empresas son autopoiéticas?', back: 'Surgen espontáneamente de la complejización social. Las personas son "partículas en el caos" cuya inventiva es anecdótica.' },
  { id: 'b15', type: 'basic', front: '¿Por qué "reducción de complejidad" es paradójico?', back: 'Reducir complejidad del ENTORNO = AUMENTAR la propia. Esa complejidad se convierte en ambiental para otros sistemas.' },
  { id: 'c1', type: 'cloze', front: 'La complejidad es un {{c1::proceso}} sistemático y {{c2::recursivo}} por el cual los sistemas, al {{c3::reducir}} la complejidad del entorno, {{c4::aumentan}} la propia.', back: 'proceso, recursivo, reducir, aumentan' },
  { id: 'c2', type: 'cloze', front: 'Un sistema es complejo cuando puede tomar al menos {{c1::dos estados}} compatibles con su {{c2::estructura}}.', back: 'dos estados, estructura' },
  { id: 'c3', type: 'cloze', front: 'Según Habermas, existen {{c1::dos}} fuentes de complejidad: la {{c2::externa}} (ambiente) y la {{c3::interna}} (propio sistema).', back: 'dos, externa, interna' },
  { id: 'c4', type: 'cloze', front: 'La reducción de complejidad se realiza mediante {{c1::límites de sentido}}, propuestos por {{c2::Luhmann}}.', back: 'límites de sentido, Luhmann' },
  { id: 'c5', type: 'cloze', front: 'Las empresas son de tipo {{c1::autopoiético}} ({{c2::Maturana y Varela}}). Lo contrario: {{c3::heteropoiéticas}}.', back: 'autopoiético, Maturana y Varela, heteropoiéticas' },
  { id: 'c6', type: 'cloze', front: 'Puede haber {{c1::complejidad}} sin incertidumbre, pero NO {{c2::incertidumbre}} sin complejidad.', back: 'complejidad, incertidumbre' },
  { id: 'c7', type: 'cloze', front: '"La reducción de la complejidad es el {{c1::medio}} para la {{c2::construcción}} de complejidad." — Luhmann', back: 'medio, construcción' },
];

// ============================================================
// CARD DATA ACCESS
// ============================================================
export function getCards() {
  const d = ld();
  if (d.cards) return d.cards;
  // Fallback: defaultCards embedded in the article
  const art = window.SILA_ARTICLES && window.SILA_ARTICLES[state.currentArticleKey];
  if (art && art.defaultCards) return art.defaultCards;
  // Legacy fallback for bustamante_2004
  if (state.currentArticleKey === 'bustamante_2004') return DEFAULT_CARDS;
  return [];
}

export function setCards(cards) {
  const d = ld(); d.cards = cards; sv(d);
}

// Legacy init for bustamante_2004
if (!ld().cards && state.currentArticleKey === 'bustamante_2004') setCards(DEFAULT_CARDS);

// ============================================================
// RENDER FLASHCARDS PANEL
// ============================================================
let fcEditMode = false;
let editingCardId = null;

export function renderFlashcards() {
  const ct = state.ct;
  const cards = getCards();
  const basic = cards.filter(c => c.type === 'basic');
  const cloze = cards.filter(c => c.type === 'cloze');
  const custom = cards.filter(c => c.type === 'custom');

  let h = `<div class="sb"><h3>Flashcards</h3></div>`;
  h += `<div class="fc-stats">`;
  h += `<div class="fc-stat sb"><div class="n">${basic.length}</div><div class="l">Básicas</div></div>`;
  h += `<div class="fc-stat sc"><div class="n">${cloze.length}</div><div class="l">Cloze</div></div>`;
  h += `<div class="fc-stat su"><div class="n">${custom.length}</div><div class="l">Personales</div></div>`;
  h += `</div>`;
  // Action buttons
  h += `<div style="display:flex;gap:8px;margin-bottom:14px;align-items:center;">`;
  h += `<button class="btn bg" onclick="newCard()" style="font-size:13px;">+ Nueva flashcard</button>`;
  h += `<button class="btn ${fcEditMode ? 'bg' : 'bo'}" onclick="toggleFcEdit()" style="font-size:13px;">${fcEditMode ? '✓ Listo' : '✏ Editar cards'}</button>`;
  h += `<span style="font-size:13px;color:var(--tx3);margin-left:auto;">Tip: selecciona texto en un párrafo para crear cards desde el artículo</span>`;
  h += `</div>`;

  if (custom.length > 0) {
    h += `<h4 style="font-size:14px;color:var(--gold);margin:14px 0 8px;">Mis flashcards personales</h4>`;
    h += `<div class="fc-grid">`;
    custom.forEach(c => { h += renderCard(c); });
    h += `</div>`;
  }

  h += `<h4 style="font-size:14px;color:var(--blue);margin:14px 0 8px;">Básicas (${basic.length})</h4>`;
  h += `<div class="fc-grid">${basic.map(c => renderCard(c)).join('')}</div>`;

  h += `<h4 style="font-size:14px;color:var(--purple);margin:14px 0 8px;">Cloze (${cloze.length})</h4>`;
  h += `<div class="fc-grid">${cloze.map(c => renderCard(c)).join('')}</div>`;

  ct.innerHTML = h;
}

// ============================================================
// RENDER SINGLE CARD
// ============================================================
export function renderCard(c) {
  const typeClass = c.type === 'basic' ? 'fc-type-basic' : c.type === 'cloze' ? 'fc-type-cloze' : 'fc-type-custom';
  const typeLabel = c.type === 'basic' ? 'BÁSICA' : c.type === 'cloze' ? 'CLOZE' : 'PERSONAL';
  const editStyle = fcEditMode ? 'border-color:rgba(224,112,80,0.2);animation:editPulse 1.5s ease-in-out infinite;' : '';
  return `<div class="fc-card" style="${editStyle}">
    <div class="fc-type ${typeClass}">${typeLabel}</div>
    <div class="fc-front" onclick="this.nextElementSibling.classList.toggle('show')">${c.front.replace(/\{\{c\d+::/g, '<b>[').replace(/\}\}/g, ']</b>')}</div>
    <div class="fc-back" id="fcb-${c.id}">${c.back}</div>
    ${fcEditMode ? `<div class="fc-actions">
      <div class="fc-act" onclick="editCard('${c.id}')">✏️ Editar</div>
      <div class="fc-act danger" onclick="deleteCard('${c.id}')">🗑 Eliminar</div>
    </div>` : ''}
  </div>`;
}

// ============================================================
// WINDOW FUNCTIONS (onclick handlers)
// ============================================================
window.toggleFcEdit = function () { fcEditMode = !fcEditMode; renderFlashcards(); };

window.newCard = function () {
  editingCardId = null;
  document.getElementById('modal-title').textContent = 'Nueva flashcard';
  document.getElementById('modal-front').value = '';
  document.getElementById('modal-back').value = '';
  document.getElementById('edit-modal').classList.add('show');
};

window.editCard = function (id) {
  const cards = getCards();
  const card = cards.find(c => c.id === id);
  if (!card) return;
  editingCardId = id;
  document.getElementById('modal-title').textContent = 'Editar flashcard';
  document.getElementById('modal-front').value = card.front;
  document.getElementById('modal-back').value = card.back;
  document.getElementById('edit-modal').classList.add('show');
};

window.closeModal = function () {
  document.getElementById('edit-modal').classList.remove('show');
  editingCardId = null;
};

window.saveModal = function () {
  const front = document.getElementById('modal-front').value.trim();
  const back = document.getElementById('modal-back').value.trim();
  if (!front) return;
  const cards = getCards();
  if (editingCardId) {
    const idx = cards.findIndex(c => c.id === editingCardId);
    if (idx >= 0) { cards[idx].front = front; cards[idx].back = back; }
  } else {
    cards.push({ id: 'u' + Date.now(), type: 'custom', front, back });
  }
  setCards(cards);
  window.closeModal();
  renderFlashcards();
};

window.deleteCard = function (id) {
  if (!confirm('¿Eliminar esta flashcard?')) return;
  const cards = getCards().filter(c => c.id !== id);
  setCards(cards);
  renderFlashcards();
};

// ============================================================
// SELECTION POPUP — create card from selected text
// ============================================================
let selectedText = '';

document.addEventListener('mouseup', function (e) {
  const sel = window.getSelection();
  const text = sel.toString().trim();
  const popup = document.getElementById('sel-popup');
  if (!popup) return;
  if (text.length > 10 && sel.anchorNode && sel.anchorNode.parentElement.closest('.pb-t')) {
    selectedText = text;
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    popup.style.left = (rect.left + rect.width / 2 - 100) + 'px';
    popup.style.top = (rect.bottom + 8) + 'px';
    popup.classList.add('show');
  } else {
    popup.classList.remove('show');
  }
});

document.addEventListener('mousedown', function (e) {
  const popup = document.getElementById('sel-popup');
  if (popup && !e.target.closest('.sel-popup')) popup.classList.remove('show');
});

window.createCardFromSelection = function (type) {
  const popup = document.getElementById('sel-popup');
  if (popup) popup.classList.remove('show');
  editingCardId = null;
  if (type === 'basic') {
    document.getElementById('modal-title').textContent = 'Nueva flashcard básica';
    document.getElementById('modal-front').value = '¿...? (escribe tu pregunta)';
    document.getElementById('modal-back').value = selectedText;
  } else {
    document.getElementById('modal-title').textContent = 'Nueva flashcard cloze';
    document.getElementById('modal-front').value = selectedText + '\n\n(Reemplaza palabras clave con {{c1::palabra}})';
    document.getElementById('modal-back').value = '';
  }
  document.getElementById('edit-modal').classList.add('show');
};
