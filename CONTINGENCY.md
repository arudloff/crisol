# CRISOL — Plan de Contingencia

## Si Supabase no responde
1. CRISOL sigue funcionando con datos en cache local (localStorage)
2. Los cambios se pierden si cierras el navegador antes de que Supabase vuelva
3. El indicador de conexion mostrara "Sin conexion" o "Error sync"
4. **Accion:** Esperar. Supabase tiene 99.9% uptime. Si pasa mas de 1 hora, verificar status.supabase.com

## Si Vercel no responde
1. La app no cargara en absoluto
2. **Accion:** Verificar vercel.com/status. Si es caida prolongada, desplegar temporalmente desde otro servicio (Netlify, GitHub Pages)

## Si pierdes datos
1. **Backup en Supabase:** Tabla `dr_backups` tiene backups automaticos de los ultimos 7 dias
2. **Backup local:** Carpeta `G:\Mi unidad\RESPALDOS\CRISOL\weekly\` tiene archivos JSON
3. **Restaurar desde archivo:** En CRISOL, click en "Restaurar" (icono carpeta en el menu inferior)
4. **Restaurar manualmente:** Abrir el JSON del backup y usar la consola de Supabase para insertar datos

## Si un usuario pierde acceso
1. Verificar en Supabase Dashboard > Authentication > Users que el email existe
2. El usuario puede hacer "Olvidé mi contraseña" (si Resend esta configurado)
3. El admin puede generar un nuevo codigo de invitacion desde el panel de solicitudes

## Si la base de datos se corrompe
1. Ir a Supabase Dashboard > SQL Editor
2. Verificar tablas con: `SELECT count(*) FROM projects;`
3. Si hay datos corruptos, restaurar desde el backup local mas reciente
4. El script `node scripts/backup-local.js` descarga una copia completa

## Contactos
- **Administrador:** Alejandro Rudloff (alejandro@chenriquez.cl)
- **Supabase:** dashboard.supabase.com (proyecto: investigacion-cch)
- **Vercel:** vercel.com (proyecto: crisol)
- **Resend:** resend.com (para notificaciones por email)
- **Repositorio:** github.com/arudloff/crisol
