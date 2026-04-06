# Taxonomia de Errores en Citas — Verificador v1

Referencia para el agente verificador de `/dr verify`.
5 tipos de error, cada uno con subtipos, severidad, y protocolo de deteccion.

Basado en la experiencia real del cluster COEX-IA donde se detectaron
46 referencias fabricadas y 3 datos hallucinated en ~50 fuentes verificadas.

---

## Tipo 1 — FABRICADA (severidad: CRITICA, -20 por instancia)

La fuente no existe o el dato atribuido no aparece en ella.

### F1a — Autor/año ficticio
**Que es:** Se cita un autor que no publico nada con ese titulo/año.
**Deteccion:** Buscar DOI, Google Scholar, Semantic Scholar. Si no existe → fabricada.
**Ejemplo real (cluster):** 46 referencias fabricadas detectadas en ronda inicial.

### F1b — Dato inventado
**Que es:** Un numero, porcentaje, o estadistica que no aparece en la fuente citada.
**Deteccion:** Leer el PDF y buscar el dato exacto. Si no esta → fabricado.
**Ejemplo real:** "167% de mejora" atribuido a Wu et al. 2025 — no existe en el paper.
**Ejemplo real:** "5 componentes de DAC" y "50 dias de horizonte" atribuidos a Lu 2026 — inventados.

### F1c — Fuente fantasma
**Que es:** El DOI/URL lleva a otro paper o a una pagina 404.
**Deteccion:** Verificar DOI/URL directamente.

---

## Tipo 2 — DISTORSIONADA (severidad: ALTA, -10 por instancia)

La fuente existe y dice algo relacionado, pero el claim del texto tergiversa el sentido.

### F2a — Inversion de sentido
**Que es:** La fuente dice lo contrario de lo que el texto afirma.
**Ejemplo:** Fuente dice "no hay evidencia significativa" → texto dice "la evidencia demuestra".

### F2b — Sobreextension
**Que es:** La fuente hace un claim modesto; el texto lo amplifica.
**Ejemplo real:** Fuente dice "hasta 55% reduccion en conectividad EEG" → texto dice "55% reduccion en activacion cerebral".
**Ejemplo real:** Fuente dice "d=0.25 en calidad engaging" → texto dice "mejora significativa en creatividad".

### F2c — Generalizacion indebida
**Que es:** La fuente habla de un contexto especifico; el texto generaliza a todos los contextos.
**Ejemplo:** Estudio en N=54 estudiantes → "los humanos experimentan..."

---

## Tipo 3 — DESCONTEXTUALIZADA (severidad: MEDIA, -6 por instancia)

La cita es correcta pero se usa fuera de su contexto original, cambiando su significado.

### F3a — Cherry-picking
**Que es:** Se cita un hallazgo ignorando las limitaciones que el propio autor expresa.
**Ejemplo:** Citar el resultado positivo omitiendo que el componente colaborativo fue negativo (-0.0990).

### F3b — Cambio de dominio
**Que es:** Un hallazgo de neurociencia se aplica directamente a management sin mediar argumentacion.
**Ejemplo:** "El DMN opera en modo default, por lo tanto las organizaciones deben..."

### F3c — Cita secundaria no declarada
**Que es:** Se cita como si se hubiera leido el original, pero en realidad se tomo de otra fuente.
**Ejemplo real:** Cifra "77% empleados" atribuida a Forbes/Robinson, tomada de De Cremer & Esposito sin acceder al original.
**Deteccion:** Si el claim no aparece textual en el PDF citado, buscar si viene de una fuente secundaria.

---

## Tipo 4 — INEXACTA (severidad: BAJA, -3 por instancia)

La cita es esencialmente correcta pero tiene imprecisiones menores.

### F4a — Terminologia alterada
**Que es:** Se usa un termino cercano pero no el exacto del autor.
**Ejemplo real:** Fuente dice "behavioral throughput" → texto dice "conscious throughput".
**Ejemplo real:** Fuente dice "checks" → texto dice "controls".
**Ejemplo real:** Fuente dice "agency" → texto dice "distributed agency".

### F4b — Numero aproximado
**Que es:** El dato es correcto en orden de magnitud pero impreciso.
**Ejemplo real:** Fuente dice "5-50 bits/s, remarkably concordant" → texto dice "~10 bits/s, invariant".

### F4c — Atribucion incompleta
**Que es:** Se atribuye un concepto a un autor cuando este lo tomo de otro.
**Ejemplo real:** "Asimilacion oportunista" atribuido a Kotler 2025 pero originado en Seifert et al. 1994.

---

## Tipo 5 — INVERIFICABLE (severidad: MEDIA, -5 por instancia)

No se puede confirmar ni refutar porque falta acceso.

### F5a — PDF no disponible
**Que es:** No hay PDF en las carpetas de fuentes ni acceso al DOI.
**Ejemplo real:** Cui & Yasseri 2024 — 4 citas pendientes por PDF faltante.

### F5b — Fuente no academica sin archivo
**Que es:** URL rota, blog eliminado, conferencia sin proceedings.
**Deteccion:** Verificar URL, Wayback Machine.

### F5c — Comunicacion personal o dato oral
**Que es:** El dato proviene de una conversacion, clase, o presentacion sin registro.
**Deteccion:** Si no hay forma de que un tercero lo verifique → inverificable.

---

## Protocolo de verificacion

### Paso 1 — Inventario
Listar TODAS las citas del texto con: autor, año, claim parafraseado, tipo (textual/parafrasis/dato).

### Paso 2 — Verificacion por capas

| Capa | Que verifica | Como |
|------|-------------|------|
| **Existencia** | La fuente existe | DOI, Google Scholar, carpeta de PDFs |
| **Acceso** | Tenemos el PDF | Buscar en G:\Mi unidad\DOCTORADO\...\Fuentes\ |
| **Contenido** | El claim aparece en la fuente | Leer PDF, buscar texto/dato especifico |
| **Fidelidad** | El claim respeta el sentido original | Comparar contexto completo |
| **Atribucion** | El claim se atribuye al autor correcto | Verificar si es cita primaria o secundaria |

### Paso 3 — Clasificacion
Asignar tipo (F1-F5) y subtipo (a/b/c) a cada problema detectado.

### Paso 4 — Tabla de salida

```markdown
| # | Fuente | Claim | Tipo | Subtipo | Severidad | Detalle |
|---|--------|-------|------|---------|-----------|---------|
```

### Paso 5 — Score de trazabilidad

```
Score = 100 - sum(deducciones)
```

Minimo 0. Cada F1 = -20, F2 = -10, F3 = -6, F4 = -3, F5 = -5.

---

## Integracion con trabajo previo

El cluster COEX-IA ya tiene:
- 8 tablas de verificacion (A1-A7 + Cap0) en formato `AX_tabla_verificacion_citas.md`
- `REPORTE_VERIFICACION_FUENTES.md` con hallazgos globales
- 232 citas documentadas con texto original en ingles
- 49 PDFs renombrados en formato Autor_Año_TituloCorto.pdf

**Reglas de integracion:**
- Si ya existe tabla de verificacion para el articulo, LEERLA primero y no re-verificar lo ya verificado
- Si hay citas marcadas como PENDIENTE, priorizarlas
- Si el investigador agrega nuevas fuentes, verificar solo las nuevas
- Las citas marcadas VERIFICADA en tablas previas se asumen correctas (no re-verificar salvo sospecha)

### Carpetas de PDFs
- `G:\Mi unidad\DOCTORADO\Organizaciones Hibridadas\Fuentes\` (~43 PDFs)
- `G:\Mi unidad\DOCTORADO\Hibridación Investigador IA\Fuentes\` (~3 PDFs)
- `G:\Mi unidad\DOCTORADO\Teoría Organizacional\Articulo Complejidad - Ecuador\Primera Publicación\Artículos\` (~3 PDFs)
