# CRISOL — Bandeja de entrada

> **Qué es**: descarga rápida de ideas, reflexiones, pendientes difusos, preguntas abiertas que aún no son tickets formales.
>
> **Cuándo se procesa**: en cada retrospectiva de sprint. Cada entrada se convierte en:
> - 🎯 Ticket en JIRA (si es ejecutable)
> - 📓 Log en BITACORA (si es decisión/reflexión)
> - 📐 ADR en `docs/adr/` (si es decisión arquitectónica)
> - 🗑️ Descartar (si ya no aplica)

## Cómo escribir una entrada

```markdown
## [YYYY-MM-DD HH:MM] · Autor · [tipo]

Texto libre. Contexto si hace falta.

**Acción sugerida**: ticket / ADR / archivar
```

**Tipos**: `idea` · `reflexión` · `pregunta` · `pendiente` · `bug-posible` · `optimización` · `duda`

---

## Entradas abiertas

### [2026-04-15 17:45] · Alejandro · reflexión

CRISOL se incorpora a SINFONÍA en modo adopción parcial. Ya tiene documentación más madura que SOCRATES (ARCHITECTURE, SETUP, SMOKE_TEST, CONTINGENCY). El aporte de SINFONÍA será principalmente: JIRA para gobernanza + PR template estándar + eventuales colaboradores.

**Acción sugerida**: mantener estructura de docs actual; sumar solo lo que agregue valor.

---

<!-- Agrega nuevas entradas arriba. -->
