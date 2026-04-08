# Frameworks de Estrategia — Referencia

## Jobs To Be Done (Clayton Christensen)

Los clientes no compran productos — los "contratan" para hacer un "trabajo".

**Job statement:** [Verbo] + [objeto] + [contexto]
- Funcional: tarea práctica ("procesar un artículo académico")
- Emocional: cómo quiere sentirse ("sentir que controla su investigación")
- Social: cómo quiere ser percibido ("ser visto como investigador riguroso")

**Preguntas clave:**
- ¿Qué está tratando de lograr el usuario?
- ¿Qué usa hoy para lograrlo? (competencia real, no obvia)
- ¿Dónde sufre con la solución actual?
- ¿Cuándo "contrata" y "despide" soluciones?

**Referencia:** Christensen, C. *Competing Against Luck* (2016)

---

## Value Proposition Canvas (Osterwalder)

Zoom-in del Business Model Canvas en 2 bloques: Customer Profile + Value Map.

**Customer Profile:**
- Jobs: ¿qué tareas intenta completar?
- Pains: ¿qué le frustra, qué riesgos ve, qué obstáculos encuentra?
- Gains: ¿qué resultados desea, qué le deleitaría?

**Value Map:**
- Products/Services: ¿qué ofrecemos?
- Pain Relievers: ¿cómo aliviamos cada dolor específico?
- Gain Creators: ¿cómo creamos cada ganancia específica?

**FIT** = cuando el Value Map responde a los Jobs, Pains y Gains más importantes.

**Referencia:** Osterwalder, A. *Value Proposition Design* (2014)

---

## Impact Mapping (Gojko Adzic)

Árbol de 4 niveles: WHY → WHO → HOW → WHAT

- **WHY**: Objetivo de negocio medible ("reducir 50% el tiempo de procesamiento de artículos")
- **WHO**: Actores que influyen en el objetivo (usuarios, administradores, sistemas externos)
- **HOW**: Cambio de comportamiento que buscamos en cada actor
- **WHAT**: Features/entregables que producen ese cambio

**Regla:** Si una feature (WHAT) no se conecta a un objetivo (WHY) vía un impacto (HOW) en un actor (WHO), es candidata a eliminación.

**Referencia:** Adzic, G. *Impact Mapping* (2012)

---

## Kano Model (Noriaki Kano)

Clasifica features por su impacto en satisfacción:

| Tipo | Si está presente | Si está ausente |
|------|-----------------|-----------------|
| **Básica** | No aumenta satisfacción (se espera) | Extrema insatisfacción |
| **Performance** | Satisfacción proporcional | Insatisfacción proporcional |
| **Excitement** | Deleite desproporcionado | No se nota (no se esperaba) |
| **Indiferente** | Nada | Nada (no invertir) |

**Estrategia:** Asegurar TODAS las básicas. Competir en performance. Diferenciarse con excitement.

**Referencia:** Kano, N. (1984) *Attractive Quality and Must-Be Quality*

---

## MoSCoW (Dai Clegg)

| Prioridad | Regla | % esfuerzo |
|-----------|-------|-----------|
| **Must** | Sin esto es inutilizable | ~60% |
| **Should** | Importante pero hay workaround | ~20% |
| **Could** | Deseable si hay tiempo | ~20% |
| **Won't** | Explícitamente fuera de scope (this time) | 0% |

**Regla 60/20/20:** No más de 60% en Must Have deja buffer para contingencia.

---

## Wardley Mapping (Simon Wardley)

Mapa de cadena de valor vs. evolución. Cada componente se posiciona en:

| Evolución | Carácter | Acción |
|-----------|----------|--------|
| Genesis | Nuevo, incierto | Construir (ventaja competitiva) |
| Custom | Emergente | Construir con cuidado |
| Product | Convergiendo, estandarizado | Comprar / usar producto |
| Commodity | Estable, ubicuo | Usar utilidad/SaaS |

**Decisión build-vs-buy:** Si es commodity → usar SaaS (Supabase, Vercel). Si es genesis → construir (es tu diferenciación).

**Referencia:** Wardley, S. *Wardley Maps* (CC, free: learnwardleymapping.com)
