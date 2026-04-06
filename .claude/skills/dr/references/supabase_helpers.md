# Helpers de Supabase — Conexion Claude ↔ CRISOL

Referencia para todas las skills /dr.
Usar al INICIO y al FINAL de cada invocacion de skill.

## Credenciales

```
URL: https://cupykpcsxjihnzwyflbm.supabase.co
KEY: (leer de g:/Mi unidad/Doctorado MGT/SILA/crisol/js/state.js lineas 4-5)
```

## Al INICIO de cada skill — Leer contexto

Antes de evaluar, leer el contexto del wizard para saber:
- En que fase esta el investigador (para phase-sensitive severity)
- Que declaro en gates anteriores (para personalizar evaluacion)
- Que dialogo socratico hubo (para no repetir preguntas)

```bash
# Leer contexto del wizard
curl -s "https://cupykpcsxjihnzwyflbm.supabase.co/rest/v1/dr_wizard_context?select=*&limit=1" \
  -H "apikey: SUPABASE_KEY" | head -1

# Leer dialogo socratico previo
curl -s "https://cupykpcsxjihnzwyflbm.supabase.co/rest/v1/dr_socratic_log?select=*&order=created_at.desc&limit=5" \
  -H "apikey: SUPABASE_KEY"

# Leer alertas pendientes
curl -s "https://cupykpcsxjihnzwyflbm.supabase.co/rest/v1/dr_alerts?resolved=eq.false&select=*" \
  -H "apikey: SUPABASE_KEY"
```

## Al FINAL de cada skill — Escribir resultados

### /dr review — escribir alertas si detecta problemas

Para CADA deduccion critica detectada:
```bash
curl -s -X POST "https://cupykpcsxjihnzwyflbm.supabase.co/rest/v1/dr_alerts" \
  -H "apikey: SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{"project_id":"PROJECT_ID","phase":"PHASE","type":"TYPE","source_skill":"SKILL","code":"CODE","message":"MESSAGE"}'
```

### /dr verify — escribir bloqueos para cada F1-F5

Para CADA defecto de cita:
- F1 (fabricada): type="block", code="F1"
- F2 (distorsionada): type="block", code="F2"
- F3 (descontextualizada): type="block", code="F3"
- F4 (inexacta): type="warning", code="F4"
- F5 (inverificable): type="warning", code="F5"

### /dr mentor — escribir dialogo socratico

Al terminar la sesion de mentor:
```bash
curl -s -X POST "https://cupykpcsxjihnzwyflbm.supabase.co/rest/v1/dr_socratic_log" \
  -H "apikey: SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{"project_id":"PROJECT_ID","user_id":"USER_ID","date":"DATE","phase":"PHASE","source":"claude","skill":"/dr mentor","questions":QUESTIONS_JSON,"key_question":"KEY_Q","researcher_answer":"ANSWER","insight":"INSIGHT","context_for_next":"CONTEXT"}'
```

### /dr humanize — escribir alerta si score < 85

Si score anti-IA < 85:
```bash
curl -s -X POST "https://cupykpcsxjihnzwyflbm.supabase.co/rest/v1/dr_alerts" \
  -H "apikey: SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{"project_id":"PROJECT_ID","phase":"dr_humanize","type":"warning","source_skill":"/dr humanize","code":"anti_ia_low","message":"Score anti-IA: XX/100 (objetivo: ≥85)"}'
```

## Como obtener PROJECT_ID y USER_ID

El investigador debe proporcionar el project_id de CRISOL.
Se puede obtener de la URL del proyecto en CRISOL o preguntandole.
Si no lo proporciona, NO escribir a Supabase (degradar gracefully).

## Principio: degradar gracefully

Si no se puede conectar a Supabase (sin credenciales, sin project_id,
sin conexion), la skill DEBE funcionar normalmente — solo pierde la
comunicacion con CRISOL. Nunca fallar por no poder escribir a Supabase.
