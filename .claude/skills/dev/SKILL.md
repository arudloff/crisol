---
name: dev
description: >
  Modo desarrollo profesional (/dev) — activa verificación exhaustiva de calidad
  basada en fitness functions ejecutables. Activar cuando el usuario diga 'dev',
  '/dev', 'modo desarrollo', 'verificar calidad', 'auditar código', 'fitness check',
  'quality check', o cuando pida revisar, auditar o verificar un proyecto de software.
---

# /dev — Modo Desarrollo Profesional

Activa un modo de verificación exhaustiva de calidad de software. No es un checklist manual — son **fitness functions ejecutables** que producen PASS/FAIL concretos.

## Activación

El usuario dice `/dev` una vez. A partir de ese momento, Claude opera en modo desarrollo para toda la conversación.

## Comportamiento central

### 1. Detección automática de tipo de tarea

Al recibir cada instrucción, clasificar en uno de 5 tipos:

| Tipo | Señales | Verificaciones primarias |
|------|---------|------------------------|
| **implement** | "agregar", "crear", "nueva feature" | Pre: módulo correcto, no duplica. Post: 15 dimensiones |
| **fix** | "bug", "no funciona", "error", "rompe" | Pre: reproducir, causa raíz. Post: no introduce nuevos |
| **refactor** | "mover", "extraer", "reorganizar", "limpiar" | Pre: tests pasan. Post: imports resuelven, tests siguen |
| **audit** | "revisar", "verificar", "auditar", "check" | Ejecutar todas las fitness functions del scope solicitado |
| **deploy** | "deploy", "subir", "release", "push" | Pre: fitness check completo. Post: smoke test |

### 2. Flujo por tipo de tarea

**implement (nueva feature):**
```
PREFLIGHT
├── ¿En qué módulo va? (SRP — un solo lugar)
├── ¿Existe ya algo similar? (grep en codebase)
├── ¿Qué tabla/datos necesita? (modelo de datos)
└── ¿Qué imports/exports se afectan?

EJECUCIÓN
├── Implementar con las dimensiones de CLAUDE.md activas
└── Cada decisión arquitectónica documentada inline

POSTFLIGHT
├── Ejecutar fitness functions relevantes (ver references/fitness_functions.md)
├── Reportar badge: ✓ N/N dimensiones · M archivos verificados
└── Listar dimensiones no verificadas con justificación
```

**fix (corrección de bug):**
```
DIAGNÓSTICO
├── Reproducir el problema (entender síntomas)
├── Identificar causa raíz (no parchear síntomas)
└── ¿El mismo patrón existe en otros archivos?

FIX
├── Corregir con test que reproduzca el bug
└── Verificar que el fix no rompe invariantes

POSTFLIGHT
├── Fitness functions en archivos afectados + vecinos
└── Verificar que no se introdujeron nuevos problemas
```

**refactor:**
```
PREFLIGHT
├── Tests existentes pasan (baseline)
├── Mapear dependencias del código a mover
└── Identificar imports/exports que cambiarán

EJECUCIÓN
├── Refactorizar
└── Actualizar imports/exports

POSTFLIGHT
├── INV-1 (integridad referencial) — OBLIGATORIO
├── INV-2 (fuente única) — OBLIGATORIO
├── Re-correr tests
└── Verificar que no hay código muerto
```

**audit:**
```
Ejecutar TODAS las fitness functions según scope:
├── /dev audit full      → Todo el proyecto, todas las dimensiones
├── /dev audit security  → Solo dimensiones de seguridad
├── /dev audit arch      → Solo arquitectura + modelo de datos
├── /dev audit a11y      → Solo accesibilidad
├── /dev audit perf      → Solo performance
└── /dev audit [dim]     → Dimensión específica

Formato de reporte: ver sección "Formato de reporte" abajo
```

**deploy:**
```
PRE-DEPLOY
├── /dev audit full (debe pasar)
├── npm test (debe pasar)
├── Verificar que .env.example está actualizado
└── Verificar que README refleja cambios

DEPLOY
├── git push (Vercel auto-deploy)

POST-DEPLOY
├── Revisar SMOKE_TEST.md y verificar cada item
└── Verificar logs en producción (primeros 5 minutos)
```

### 3. Fitness functions ejecutables

Las fitness functions están en `references/fitness_functions.md`. Son comandos grep/glob concretos que Claude ejecuta y que producen resultados verificables.

**Reglas de ejecución:**
- Ejecutar SIEMPRE las fitness functions del tipo de tarea detectado
- NO preguntar "¿quieres que verifique?" — verificar automáticamente
- NO repetir verificaciones ya pasadas en el mismo ciclo
- Si una fitness function FALLA, reportar con file:line y severidad

### 4. Formato de reporte

**Si todo pasa (badge compacto):**
```
✓ dev check · 12/15 dimensiones · 0 violaciones · 5 archivos
  (no verificadas: privacidad, API design, dependencies — no aplican a este cambio)
```

**Si hay fallas (expandido):**
```
✗ dev check · 12/15 dimensiones · 3 violaciones

FAIL  INV-1 Integridad referencial
  ✗ js/editor.js:42 — import { saveDoc } from './projects-core.js'
    → projects-core.js no exporta saveDoc (exporta saveOneProject)

FAIL  Dim-8 Observabilidad  
  ✗ js/sync.js:128 — catch vacío, sin console.error ni showToast

FAIL  Dim-3 Seguridad
  ✗ js/auth.js:15 — API key hardcoded (debe usar env var)

PASS  INV-2 Fuente única · INV-3 Aislamiento · INV-4 Fallo visible
PASS  INV-5 Recuperabilidad · INV-6 Accesibilidad
PASS  Dim-1 Arquitectura · Dim-4 Performance · Dim-6 Mantenibilidad
N/A   Dim-11 API design · Dim-15 Privacidad (no aplican)
```

## Lo que /dev NO hace

- No se activa en conversaciones de investigación doctoral (/dr)
- No pregunta "¿quieres que verifique?" — verifica automáticamente
- No repite verificaciones ya pasadas en el mismo ciclo
- No agrega features no solicitadas
- No reemplaza el CLAUDE.md global — lo complementa con verificación ejecutable
