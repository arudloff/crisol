---
name: Próxima sesión - Diseño sistema de artefactos y documentación automática
description: Diseñar sistema de 3 niveles de documentación del proceso (automático, sugerido, discrecional) + registro de artefactos con metadata, trayectoria de scores, y portafolio descargable.
type: project
---

## Agenda próxima sesión (7 abril 2026)

### Prioridad 1 — Sistema de documentación de 3 niveles

Diseñar e implementar:

**Nivel 1 — Triggers automáticos (siempre se genera documento):**
- Gate completado → documento de decisión
- Score cambia entre iteraciones → documento de trayectoria
- Fase completada → resumen de fase
- Formato y destino por definir

**Nivel 2 — Sugerencias contextuales (Claude sugiere):**
- Detectar patrones en output (score, tabla, ficha) → sugerir formalización
- "Este output contiene X. ¿Generar reporte formal?"
- Mecanismo de detección por definir

**Nivel 3 — Solicitud del investigador (discrecional):**
- "Claude, formaliza esto en un documento"
- El más flexible, ya funciona naturalmente

### Prioridad 2 — Registro de artefactos en CRISOL

Plan completo ya diseñado (ver output del agente Plan). Decisiones pendientes:
- ¿Los documentos generados se guardan como archivos en disco o como datos en CRISOL?
- ¿Se vinculan con Google Drive automáticamente o el investigador pega el enlace?
- ¿El portafolio descargable incluye los documentos o solo los referencia?

### Prioridad 3 — Tareas pendientes del cluster

- Descargar PDFs Kosmyna + Cui & Yasseri
- Escribir párrafos de posicionamiento (mapa de 35 vacíos como guía)
- Regenerar .docx con gen_AX.js corregidos

### Estado del sistema al cierre de sesión

- /dr: 11 skills, 10 fases en wizard, separación de agentes
- CRISOL: 3 modos (dr/clo/mixto), ayuda actualizada, desplegado en producción
- Cluster: 7 artículos auditados (21 agentes), 47 correcciones, score 79.2→~87.3
- Benchmarking: vs Bustamante (piso 2.08), vs 4 anclas (March 3.50, Teece 3.35, Edmondson 3.56, Kahneman 3.96)
- Brecha #1 cerrable: posicionamiento del autor (2.00 → target 3.50)
