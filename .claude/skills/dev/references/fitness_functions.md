# Fitness Functions Ejecutables

Cada fitness function es un comando concreto (Grep, Glob, Read, Bash) que produce PASS o FAIL.
Claude ejecuta las funciones relevantes al tipo de tarea y reporta resultados.

## Scope de verificación

- **Quirúrgico**: Solo archivos modificados en esta tarea
- **Vecindario** (default): Archivos modificados + sus importadores directos
- **Full**: Todo el proyecto

Para determinar el vecindario: grep los archivos que importan desde los archivos modificados.

---

## INV-1: Integridad referencial

### FF-1.1: Exports resuelven imports
```
Para cada archivo JS modificado:
  1. Grep: todos los `import { X }` que referencian este archivo
  2. Read: verificar que cada X existe como export en el archivo fuente
  FAIL si: algún import no tiene export correspondiente
```

### FF-1.2: State registrations
```
  1. Grep en todo js/: `state\._\w+` (usos de state._X)
  2. Grep en js/app.js: `state\._\w+\s*=` (registros de state._X)
  FAIL si: algún state._X usado no está registrado en app.js
  NOTA: el _ prefix es obligatorio (bug histórico: state.buildDocSidebar vs state._buildDocSidebar)
```

### FF-1.3: Window globals para onclick
```
  1. Grep en todo el proyecto: `onclick="[^"]*(\w+)\(` (funciones en onclick inline)
  2. Grep en js/: `window\.\w+\s*=` (registros en window)
  FAIL si: función usada en onclick no está registrada en window
```

### FF-1.4: Re-exports en barrel
```
  1. Read js/utils.js: verificar que cada export referencia algo definido o importado
  FAIL si: export referencia variable no definida
```

---

## INV-2: Fuente única de verdad

### FF-2.1: Sin funciones duplicadas
```
  Para cada función nueva o modificada:
  1. Grep: `function NOMBRE` o `const NOMBRE =.*=>` en todo js/
  FAIL si: la misma función existe en >1 archivo
```

### FF-2.2: Supabase via api.js
```
  1. Grep en js/ (excluyendo api.js y state.js): `supabase\.from\(` o `\.select\(` o `\.insert\(` o `\.update\(` o `\.delete\(`
  FAIL si: acceso directo a Supabase fuera de api.js
  NOTA: migración gradual en curso — reportar como WARNING si es código existente, FAIL si es código nuevo
```

### FF-2.3: Un timer por sync
```
  1. Grep en js/: `setInterval|setTimeout` asociados a sync
  FAIL si: >1 timer para el mismo feature de sync
```

### FF-2.4: UserKey para localStorage
```
  1. Grep en js/: `localStorage\.(get|set)Item\(`
  2. Verificar que el key usa userKey() o es una constante global (no per-user)
  FAIL si: localStorage key hardcoded que debería ser per-user
```

---

## INV-3: Aislamiento de datos

### FF-3.1: RLS en tablas
```
  1. Read supabase_migration_full_schema.sql
  2. Para cada CREATE TABLE, verificar que existe ALTER TABLE ... ENABLE ROW LEVEL SECURITY
  3. Verificar que policies usan auth.uid() = user_id (no USING (true))
  FAIL si: tabla sin RLS o con USING (true) permisivo
```

### FF-3.2: Queries filtran por user_id
```
  1. Grep en js/api.js: cada función que hace .from().select()
  2. Verificar que incluye .eq('user_id', ...) o equivalente
  FAIL si: query sin filtro de user_id en tabla con datos de usuario
```

### FF-3.3: Tablas en backup
```
  1. Read backup-local.cjs: extraer TABLES array
  2. Read supabase_migration_full_schema.sql: listar todas las tablas
  3. Comparar
  FAIL si: tabla con datos de usuario no está en TABLES
```

### FF-3.4: Schema versioning
```
  1. Para cada migración SQL nueva: verificar INSERT INTO schema_versions
  FAIL si: migración sin registro de versión
```

---

## INV-4: Fallo visible

### FF-4.1: Sin catch vacíos
```
  1. Grep en js/: `catch\s*\([^)]*\)\s*\{` seguido de `\}` sin console.error
  FAIL si: catch sin console.error con contexto descriptivo
```

### FF-4.2: Operaciones críticas con feedback
```
  1. Grep en js/: funciones async que hacen operaciones de escritura (save, update, delete, create)
  2. Verificar que el catch incluye showToast o feedback visual
  FAIL si: operación de escritura falla silenciosamente
```

### FF-4.3: Error handlers globales
```
  1. Grep en js/app.js o js/utils.js: window.onerror y window.onunhandledrejection
  FAIL si: no existen handlers globales
```

---

## INV-5: Recuperabilidad

### FF-5.1: Backup completo
```
  1. Read backup-local.cjs: TABLES array
  2. Verificar contra lista de tablas con datos de usuario
  FAIL si: tabla falta en backup
```

### FF-5.2: Restore completo
```
  1. Grep en js/: restoreFromBackup o función equivalente
  2. Verificar que restaura las mismas tablas que respalda
  FAIL si: backup respalda tabla que restore no restaura
```

### FF-5.3: Integrity metadata
```
  1. Read backup: verificar que incluye row counts o checksums
  FAIL si: backup sin metadata de integridad
```

---

## INV-6: Accesibilidad

### FF-6.1: Keyboard navigation
```
  1. Grep en js/: elementos con onclick que no son button/a/input
  2. Verificar que tienen tabindex="0" y keydown handler
  FAIL si: div/span con onclick sin keyboard support
  NOTA: MutationObserver en utils.js debería parchear automáticamente, verificar que está activo
```

### FF-6.2: ARIA en modales
```
  1. Grep en js/ e index.html: modal o dialog
  2. Verificar role="dialog", aria-modal="true", escape handler
  FAIL si: modal sin ARIA completo
```

### FF-6.3: Labels en inputs
```
  1. Grep en index.html y JS que genera inputs dinámicamente
  2. Verificar que cada input tiene label[for] o aria-label
  FAIL si: input sin label accesible
```

---

## Dimensiones adicionales (del CLAUDE.md global)

### FF-D1: Arquitectura
```
  1. Verificar que ningún archivo JS excede 500 líneas sin justificación
     (300 es el ideal, 500 es el hard limit)
  2. Verificar que no hay dependencias circulares entre módulos
     (grep imports, construir grafo, detectar ciclos)
  FAIL si: archivo >500 líneas o dependencia circular
```

### FF-D3: Seguridad
```
  1. Grep en js/ y *.html: strings que parezcan API keys, tokens, passwords
     Patron: /Bearer [A-Za-z0-9_-]{20,}/ o /re_[A-Za-z0-9]{20,}/ o similares
  2. Grep: innerHTML con variables (XSS potencial)
  3. Verificar .gitignore incluye .env
  FAIL si: credencial en código o innerHTML con input de usuario
```

### FF-D4: Performance
```
  1. Grep en js/: forEach con async/await (potencial race condition)
  2. Grep en js/: nested loops sobre arrays (O(n²) potencial)
  3. Verificar que imágenes usan lazy loading
  FAIL si: forEach+async sin Promise.all, o O(n²) evitable
```

### FF-D7: Testing
```
  1. Glob tests/: listar tests existentes
  2. Para funciones nuevas de lógica de negocio: verificar que existe test
  FAIL si: función de lógica nueva sin test correspondiente
```

### FF-D8: Observabilidad
```
  = FF-4.1 + FF-4.2 + FF-4.3 (cubiertos en INV-4)
```

### FF-D14: Documentación
```
  1. Verificar que funciones exportadas tienen JSDoc mínimo (descripción + @param + @returns)
  2. Verificar que ARCHITECTURE.md está actualizado si la arquitectura cambió
  3. Verificar que README refleja cambios significativos
  FAIL si: función pública sin JSDoc o docs desactualizadas
```

---

## Matriz de verificación por tipo de tarea

| Fitness Function | implement | fix | refactor | audit | deploy |
|-----------------|-----------|-----|----------|-------|--------|
| FF-1.1 Exports/Imports | ✓ | ✓ | **✓✓** | ✓ | ✓ |
| FF-1.2 State regs | ✓ | ✓ | **✓✓** | ✓ | ✓ |
| FF-1.3 Window globals | ✓ | ✓ | **✓✓** | ✓ | ✓ |
| FF-2.1 Sin duplicados | ✓ | | **✓✓** | ✓ | ✓ |
| FF-2.2 Supabase via api | ✓ | | | ✓ | ✓ |
| FF-2.3 Un timer sync | si aplica | | | ✓ | ✓ |
| FF-2.4 UserKey | ✓ | | | ✓ | ✓ |
| FF-3.1 RLS | si tabla nueva | | | ✓ | ✓ |
| FF-3.2 user_id filter | si query nueva | ✓ | | ✓ | ✓ |
| FF-3.3 Backup tables | si tabla nueva | | | ✓ | ✓ |
| FF-4.1 Sin catch vacío | ✓ | ✓ | | ✓ | ✓ |
| FF-4.2 Feedback visual | ✓ | ✓ | | ✓ | ✓ |
| FF-6.1 Keyboard | si UI nueva | | | ✓ | ✓ |
| FF-6.2 ARIA modales | si modal nuevo | | | ✓ | ✓ |
| FF-D1 Arquitectura | ✓ | | ✓ | ✓ | ✓ |
| FF-D3 Seguridad | ✓ | ✓ | | ✓ | **✓✓** |
| FF-D4 Performance | ✓ | | | ✓ | ✓ |
| FF-D7 Testing | ✓ | ✓ | ✓ | ✓ | ✓ |
| FF-D14 Documentación | ✓ | | | ✓ | ✓ |

✓ = verificar en scope vecindario · **✓✓** = verificar en scope full
