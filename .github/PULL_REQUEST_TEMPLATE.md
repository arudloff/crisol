<!--
  Plantilla de PR — CRISOL (marco SINFONÍA v1.1)
-->

## Ticket

<!-- Cuando haya proyecto JIRA CSL, cierra el ticket correspondiente aquí. -->
Ticket: _pendiente JIRA project_

## Qué cambia y por qué

<!-- 1-3 frases. Enfoca en el "por qué", no en el "qué". -->

## Criterios de aceptación cumplidos

- [ ] Criterio 1
- [ ] Criterio 2

## Cómo probarlo

<!-- Pasos para verificar manualmente. Referencias a SMOKE_TEST.md si aplica. -->

1.
2.

## Revisión humana (lo que CI no verifica)

- [ ] Nombres de variables/funciones revelan intención
- [ ] Sin abstracciones prematuras
- [ ] RLS verificado si toca tablas de Supabase (ver ARCHITECTURE.md)
- [ ] Cambios al schema coordinados (si aplica)
- [ ] Decisiones no-obvias documentadas con comentario "por qué"
- [ ] `.yunque` checks siguen verdes (ver .yunque/)

<!--
  CI verifica lo automatizable cuando esté configurado.
  Este repo usa Yunque para enforcement de calidad.
-->
