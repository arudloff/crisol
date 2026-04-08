@echo off
REM CRISOL — Run local backup
REM Schedule this in Windows Task Scheduler (every 30 min or daily)
cd /d "G:\Mi unidad\Doctorado MGT\SILA\crisol"
node scripts\backup-local.cjs
