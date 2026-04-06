# Catalogo de Deducciones — Critico Adversarial v1

Referencia para el agente critico de `/dr review`.
Cada debilidad tiene: codigo, componente, nombre, descripcion, deduccion, y ejemplos.

---

## Componente 1 — Coherencia teorica (peso 25%)

Score base: 100. Objetivo entrega: ≥80.

### CT01 — Argumento no secuencial (-10)
**Que es:** Un paso logico depende de una premisa que no fue establecida previamente en el texto.
**Ejemplo:** "Como se demostro anteriormente..." pero no se demostro nada — se afirmo.

### CT02 — Concepto fantasma (-8)
**Que es:** Se introduce un concepto clave sin definirlo ni anclarlo a la literatura.
**Ejemplo:** Usar "hibridacion cognitiva" en la pagina 5 cuando la primera mencion es en la pagina 12.

### CT03 — Salto de nivel de analisis (-6)
**Que es:** Pasar de individual a organizacional (o viceversa) sin justificar el salto.
**Ejemplo:** "El procesador consciente opera a 10 bits/s, por lo tanto las organizaciones deben..."

### CT04 — Tesis implícita (-8)
**Que es:** El argumento central nunca se enuncia explicitamente. Se infiere, pero no se declara.
**Señal:** Si despues de leer la introduccion no puedes completar "Este articulo argumenta que ___", falla.

### CT05 — Incoherencia interna (-12)
**Que es:** Dos afirmaciones del mismo texto se contradicen.
**Ejemplo:** "La IA no puede reemplazar la creatividad" (seccion 2) vs "La IA genera soluciones creativas" (seccion 4).

### CT06 — Conclusion que excede las premisas (-8)
**Que es:** La conclusion afirma mas de lo que el argumento demostro.
**Señal:** Conclusiones con "por lo tanto, todas las organizaciones deben..." cuando la evidencia cubre 3 casos.

---

## Componente 2 — Posicionamiento en la literatura (peso 15%)

Score base: 100. Objetivo entrega: ≥80.

### PL01 — Fuente clave ausente (-10)
**Que es:** Un autor o trabajo seminal del campo esta ausente cuando deberia citarse.
**Ejemplo:** Hablar de bounded rationality sin citar a Simon. De sensemaking sin Weick.

### PL02 — Dialogo inexistente (-8)
**Que es:** Las fuentes se citan en paralelo pero nunca se ponen en conversacion entre si.
**Señal:** "Segun A (2020)... Segun B (2021)... Segun C (2022)..." sin "A contradice a B en..." o "C extiende lo que A propuso".

### PL03 — Posicionamiento ausente (-10)
**Que es:** El autor presenta la literatura pero nunca dice donde se ubica el respecto a ella.
**Señal:** Ausencia de frases como "mi argumento se distancia de X en que..." o "a diferencia de Y, propongo..."

### PL04 — Literatura desactualizada (-4)
**Que es:** Mas del 50% de las fuentes son anteriores a 5 años en un campo que se mueve rapido.
**Nota:** No aplica para clasicos (Simon, Weick, March). Si aplica para IA/tech.

### PL05 — Cita huerfana (-3 cada una)
**Que es:** Una fuente aparece una sola vez en todo el texto, como referencia al pasar.
**Señal:** Si quitas esa cita y el argumento no cambia, es huerfana.

---

## Componente 3 — Rigor metodologico (peso 20%)

Score base: 100. Objetivo entrega: ≥80.

### RM01 — Metodo no declarado (-15)
**Que es:** No hay seccion de metodo, o la que hay no explica como se llego a las conclusiones.
**Nota:** Incluso ensayos teoricos tienen un metodo (revision documental, analisis conceptual, etc.).

### RM02 — Criterios de seleccion opacos (-10)
**Que es:** Se citan N fuentes pero no se explica por que esas y no otras.
**Señal:** Ausencia de "los criterios de inclusion fueron..." o al menos "se seleccionaron fuentes que..."

### RM03 — Generalizacion sin base (-8)
**Que es:** Afirmaciones universales basadas en evidencia parcial.
**Ejemplo:** "Todas las organizaciones experimentan..." basado en 3 estudios de caso.

### RM04 — Ausencia de limitaciones (-6)
**Que es:** El texto no reconoce sus propios limites metodologicos.
**Señal:** No hay seccion o parrafo de limitaciones, o dice "las limitaciones son minimas".

### RM05 — Datos sin fuente (-10 cada uno)
**Que es:** Un dato numerico o estadistico se presenta sin citar su origen.
**Ejemplo:** "El 67% de las empresas..." — segun quien?

---

## Componente 4 — Integracion autoetnografica (peso 15%)

Score base: 100. Objetivo entrega: ≥80.

### IA01 — Autoetnografia decorativa (-10)
**Que es:** La experiencia personal se menciona pero no se integra como dato.
**Señal:** "Mi experiencia como investigador hibrido..." seguido de argumento puramente teorico.

### IA02 — Ausencia de reflexividad (-8)
**Que es:** El autor no examina como su posicion afecta su analisis.
**Señal:** No hay mencion de sesgos potenciales, de la posicion desde la que se observa.

### IA03 — Legitimacion metodologica faltante (-6)
**Que es:** Se usa autoetnografia sin justificar por que es el enfoque apropiado.
**Nota:** Si existe el Protocolo de Investigador Hibridado, deberia referenciarse.

### IA04 — Experiencia no triangulada (-4)
**Que es:** La experiencia personal se presenta como evidencia unica, sin contrastar con literatura.
**Alternativa:** "Mi experiencia confirma/contradice lo que Autor (año) encontro..."

---

## Componente 5 — Calidad escritura anti-IA (peso 15%)

**Este componente lo evalua el humanizer (`/dr humanize`).**
Se importa el score anti-IA directamente.
Ver `references/humanizer_patterns.md` para el catalogo completo.

---

## Componente 6 — Trazabilidad de fuentes (peso 10%)

Score base: 100. Objetivo entrega: ≥80.

### TF01 — Cita sin PDF verificable (-8)
**Que es:** Se cita una fuente cuyo PDF no esta en las carpetas de fuentes.
**Nota:** Verificar en G:\Mi unidad\DOCTORADO\...\Fuentes\

### TF02 — Parafrasis sin pagina (-3)
**Que es:** Se parafrasea un argumento especifico sin indicar pagina o seccion.
**Señal:** "(Autor, 2024)" cuando deberia ser "(Autor, 2024, p. 12)" o "(Autor, 2024, sec. 3)".

### TF03 — Quote sin verificacion (-6)
**Que es:** Se usa una cita textual que no ha sido verificada contra el PDF original.
**Nota:** Las tablas de verificacion de citas (A1-A7) documentan las verificadas.

### TF04 — Referencia fabricada (-20)
**Que es:** La fuente no existe. Autor ficticio, año incorrecto, o titulo inventado.
**Nota:** CRITICA. Cada referencia fabricada es -20 y flag automatico.

### TF05 — Dato distorsionado (-10)
**Que es:** El dato existe en la fuente pero se reporta incorrectamente.
**Ejemplo:** La fuente dice "40%" y el texto dice "casi la mitad" (OK) vs "67%" (fabricado).

---

## Calculo del score compuesto

```
Score_final = (CT × 0.25) + (PL × 0.15) + (RM × 0.20) + (IA × 0.15) + (antiIA × 0.15) + (TF × 0.10)
```

### Quality gates

| Nivel | Score agregado | Score minimo por componente |
|-------|---------------|---------------------------|
| Borrador | ≥70 | — |
| Capitulo | ≥80 | ≥70 |
| Entrega | ≥90 | ≥80, zero citas fabricadas |

### Tabla de salida del critico

```markdown
| Componente | Score | Deducciones aplicadas | Detalle |
|------------|-------|-----------------------|---------|
| Coherencia teorica (25%) | 82 | CT03 (-6), CT06 (-8) | Salto ind→org sec.3; conclusion excede premisas |
| Posicionamiento (15%) | 90 | PL05 ×2 (-6) | 2 citas huerfanas |
| Rigor metodologico (20%) | 85 | RM04 (-6), RM02 (-10) | Sin limitaciones; criterios opacos |
| Integracion autoetnografica (15%) | 96 | IA04 (-4) | 1 experiencia no triangulada |
| Calidad anti-IA (15%) | 88 | [ver humanizer] | 3 patrones altos |
| Trazabilidad (10%) | 94 | TF02 ×2 (-6) | 2 parafrasis sin pagina |
| **SCORE COMPUESTO** | **87.3** | | **Gate: CAPITULO ✓** |
```
