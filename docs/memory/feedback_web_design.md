---
name: Feedback sobre diseño web del cluster COEX-IA
description: Preferencias de diseño, problemas encontrados y soluciones para el sitio web del cluster doctoral
type: feedback
---

## Lecciones del diseño web COEX-IA

**No scroll infinito** — usar paneles fijos con tabs. El usuario prefiere comprensión contenida, no avalancha.

**Why:** El scroll infinito contradice P1 (límite vinculante). La información debe organizarse por capas de comprensión, no por volumen.

**How to apply:** Usar arquitectura de zoom progresivo (Esencia → Estructura → Coordenadas → Profundización).

---

**Nomenclatura evocadora, no técnica** — A1→"La trampa silenciosa", P4→"Sin sudor no hay genio", B1→"El cuello de botella", etc.

**Why:** Los códigos técnicos (A1, P1, B1) no generan engagement. El lector pregunta implícitamente "¿por qué me interesaría?".

**How to apply:** Cada label debe responder esa pregunta. Mantener código técnico en paréntesis para referencia académica.

---

**Grafos SVG se desbordan fácilmente** — múltiples intentos de grafo con nodos circulares fallaron por líneas superpuestas y textos ilegibles.

**Why:** En un panel-left de 68% del viewport, un SVG de 700-820px con 7 nodos + labels + edges no cabe sin overflow.

**How to apply:** La MATRIZ RELACIONAL (tabla 7×7) funciona mejor que el grafo — cero líneas superpuestas, relaciones legibles en la intersección, formato académico que la comisión reconoce.

---

**Textos mínimo 12px** — el usuario rechazó textos de 9-10px como ilegibles.

**How to apply:** Headers de tabla: 12px. Celdas: 12px. Body: 14-15px. Nunca bajar de 12px en contenido legible.

---

**Verificar balance de DIVs** — múltiples iteraciones de edición generaron </div> extras o faltantes que rompían el layout sin error visible en consola.

**How to apply:** Después de ediciones complejas al HTML, SIEMPRE correr verificación de balance de divs con script Node.js. Un solo </div> extra destruye todo el layout.

---

**Panel de detalle dinámico** — cuando un panel cambia contenido al hacer clic, necesita feedback visual (flash, scale, sombra) para que el usuario note el cambio.

**Why:** Sin feedback visual, el panel parece estático y el usuario no sabe que respondió a su clic.

**How to apply:** transform: scale(1.02) + boxShadow transitorio + borderColor change al actualizar contenido.
