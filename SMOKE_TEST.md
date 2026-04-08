# CRISOL — Checklist de Smoke Test Post-Deploy

Ejecutar despues de cada deploy a produccion.
Tiempo estimado: 3-5 minutos.

## 1. Carga inicial
- [ ] La landing page se muestra correctamente
- [ ] No hay errores en la consola (F12) al cargar
- [ ] El formulario de solicitud de invitacion es visible

## 2. Autenticacion
- [ ] Login con email/password funciona
- [ ] El perfil se carga correctamente
- [ ] El boton de logout funciona

## 3. Proyectos
- [ ] La lista de proyectos se carga
- [ ] Crear un proyecto nuevo funciona
- [ ] Cambiar fase de un proyecto funciona (sin falso conflicto)
- [ ] Abrir el wizard DR muestra las fases y tareas

## 4. Documentos
- [ ] Crear un documento nuevo funciona
- [ ] Escribir y guardar contenido funciona
- [ ] Los bloques se guardan en Supabase

## 5. PRISMA
- [ ] La vista PRISMA se carga
- [ ] Se pueden agregar documentos al jardin

## 6. Admin (solo admin)
- [ ] El boton de solicitudes de invitacion aparece
- [ ] Se pueden ver solicitudes pendientes
- [ ] Aprobar una solicitud genera codigo y muestra el mensaje

## 7. Backup
- [ ] El auto-backup se inicia (ver consola: "Auto-backup enabled")
- [ ] No aparece error de tabla `documents` (debe usar `sila_docs`)

## 8. Responsive
- [ ] La app es usable en tablet (sidebar se oculta)

## Resultado
- Fecha: ____
- Version: ____
- Tester: ____
- Estado: PASS / FAIL
- Notas: ____
