# CRISOL — Setup Guide

Guia completa para montar el stack de produccion doctoral CRISOL + /dr + clo-author.

---

## Requisitos previos

| Herramienta | Version | Para que |
|-------------|---------|----------|
| Node.js | 18+ | Ejecutar generadores de .docx y verificaciones |
| Claude Code | Latest | Ejecutar skills /dr y clo-author |
| Cuenta Supabase | Free tier OK | Backend: auth, sync, alertas |
| Cuenta Vercel | Free tier OK | Hosting de CRISOL |
| Google Drive | Con Desktop app | Archivos locales sincronizados |

---

## Paso 1 — Clonar/copiar el proyecto

```bash
# Opcion A: Git (si se configuro repo)
git clone [URL_DEL_REPO] crisol
cd crisol

# Opcion B: Copiar carpeta
# Copiar toda la carpeta crisol/ a tu Google Drive
```

Estructura esperada:

```
crisol/
├── index.html              # App principal (SPA)
├── vercel.json              # Config de deploy
├── css/
│   └── main.css             # Estilos (65 KB)
├── js/
│   ├── app.js               # Entry point + router
│   ├── state.js             # Estado central + constantes
│   ├── utils.js              # Utilidades + barrel exports
│   ├── storage.js           # LocalStorage
│   ├── db.js                # Supabase client init
│   ├── auth.js              # Login, register, profile
│   ├── articles.js          # Lectura de articulos + ayuda
│   ├── editor.js            # Editor de documentos
│   ├── projects.js          # Proyectos + wizard DR + clo-author
│   ├── dashboard.js         # Dashboard global
│   ├── kanban.js            # Tablero Kanban
│   ├── prisma.js            # PRISMA review tool
│   ├── sync.js              # Supabase sync + DR sync
│   ├── tabs.js              # Multi-tab workspace
│   ├── notifications.js     # Toast notifications
│   ├── search.js            # Busqueda global
│   ├── tts.js               # Text-to-speech
│   ├── dictation.js         # Voice-to-text
│   └── flashcards.js        # Spaced repetition
├── data/
│   ├── manifest.js          # Indice de articulos
│   ├── wizard_config.js     # Wizard tasks + DR + CLO config
│   └── prisma_data.js       # PRISMA initial state
├── .claude/
│   └── skills/
│       └── dr/              # Skills /dr (ver Paso 3)
├── supabase_migration_dr_tables.sql  # Tablas para Claude<->CRISOL
└── docs/
    ├── SETUP.md             # Este archivo
    └── ARCHITECTURE.md      # Arquitectura del sistema
```

---

## Paso 2 — Configurar Supabase

### 2.1 Crear proyecto en Supabase

1. Ir a https://supabase.com/dashboard
2. Click "New project"
3. Nombre: "crisol" (o el que quieras)
4. Password: guardar en lugar seguro
5. Region: la mas cercana a ti

### 2.2 Obtener credenciales

En Supabase Dashboard → Settings → API:
- **URL**: algo como `https://xxxxx.supabase.co`
- **anon key**: el JWT publico

### 2.3 Configurar en CRISOL

Editar `js/state.js` lineas 4-5:

```javascript
export const SUPABASE_URL = 'https://TU_URL.supabase.co';
export const SUPABASE_KEY = 'TU_ANON_KEY';
```

### 2.4 Crear tablas base

En Supabase Dashboard → SQL Editor, ejecutar:

**Tabla profiles:**
```sql
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  display_name text,
  institution text,
  research_area text
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR ALL USING (auth.uid() = id);
```

**Tabla projects:**
```sql
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  description text,
  owner_id uuid REFERENCES auth.users(id),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own projects" ON projects FOR ALL USING (auth.uid() = owner_id);
```

**Tabla project_members:**
```sql
CREATE TABLE IF NOT EXISTS project_members (
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'editor',
  PRIMARY KEY (project_id, user_id)
);
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read" ON project_members FOR SELECT USING (true);
```

**Tabla sila_userdata:**
```sql
CREATE TABLE IF NOT EXISTS sila_userdata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  article_key text,
  data jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, article_key)
);
ALTER TABLE sila_userdata ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own data" ON sila_userdata FOR ALL USING (auth.uid() = user_id);
```

**Tabla documents:**
```sql
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  title text,
  content jsonb DEFAULT '[]',
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own docs" ON documents FOR ALL USING (auth.uid() = user_id);
```

### 2.5 Crear tablas DR (Claude <-> CRISOL)

Copiar y ejecutar el contenido de `supabase_migration_dr_tables.sql`.
Esto crea: `dr_socratic_log`, `dr_alerts`, `dr_wizard_context`.

---

## Paso 3 — Instalar skills /dr en Claude Code

### 3.1 Copiar la carpeta de skills

```bash
# Desde el proyecto clonado
cp -r .claude/skills/dr ~/.claude/skills/dr

# O manualmente, crear la estructura:
mkdir -p ~/.claude/skills/dr/references
```

### 3.2 Verificar estructura

```
~/.claude/skills/dr/
├── SKILL.md                              # Skill principal (12 comandos)
└── references/
    ├── humanizer_patterns.md             # 15 patrones anti-IA
    ├── critic_deductions.md              # 25 deducciones, 6 componentes
    ├── citation_taxonomy.md              # 5 tipos error F1-F5
    ├── deep_reader_protocol.md           # Ficha de explotacion
    ├── writer_protocol.md                # Worker-critic + schema ficha
    ├── socratic_mentor_protocol.md       # 6 tipos pregunta
    ├── devils_advocate_protocol.md       # 7 tipos ataque
    ├── traceability_report_protocol.md   # 6 secciones reporte
    ├── impact_assessment_protocol.md     # 4 agentes + benchmarking
    └── writing_principles_30.md          # 30 principios escritura doctoral
```

### 3.3 Reiniciar Claude Code

Cerrar y reabrir Claude Code. Las skills aparecen como comandos /dr.

### 3.4 Verificar

Escribir `/dr` en Claude Code. Deberia aparecer la skill con sus 12 comandos.

---

## Paso 4 — Instalar skills adicionales

### /sila (procesar articulos)

```bash
cp -r .claude/skills/sila ~/.claude/skills/sila
```

### /prisma (metarrelato investigativo)

```bash
cp -r .claude/skills/prisma ~/.claude/skills/prisma
```

### /sync (sincronizar con Obsidian)

```bash
cp -r .claude/skills/sync ~/.claude/skills/sync
```

---

## Paso 5 — Desplegar en Vercel

### 5.1 Instalar Vercel CLI

```bash
npm i -g vercel
```

### 5.2 Primer deploy

```bash
cd crisol
vercel --yes --prod
```

### 5.3 Configurar dominio (opcional)

En Vercel Dashboard → Settings → Domains.

---

## Paso 6 — Verificar que todo funciona

1. Abrir CRISOL en el navegador (URL de Vercel)
2. Registrar usuario (email + password)
3. Completar perfil (nombre, institucion, area)
4. Crear proyecto → activar modo /dr
5. Verificar que las 10 fases aparecen
6. En Claude Code: ejecutar `/dr journal show` — deberia funcionar
7. Verificar que la seccion "?" muestra todas las skills

---

## Estructura de datos

### Proyectos (Supabase → projects.metadata)

```javascript
{
  nombre: "Mi proyecto",
  descripcion: "...",
  workflowMode: "dr" | "clo" | "mixed",
  drFases: [...],           // 10 fases del wizard
  drWizardProgress: {...},  // progreso por fase/tarea
  drOutputs: {...},         // outputs pegados por fase/tarea
  drGateRecords: [...],     // respuestas de gates + socraticas
  drArtifacts: [...],       // artefactos registrados (pendiente)
  cloFases: [...],          // fases clo-author (si modo clo/mixed)
  cloProjectPath: "...",    // ruta local del proyecto clo-author
}
```

### Comunicacion Claude <-> CRISOL (Supabase)

```
dr_socratic_log  — Dialogo socratico (preguntas, respuestas, insights)
dr_alerts        — Alertas y bloqueos (F1 detectada, score bajo, etc.)
dr_wizard_context — Fase activa, scores, respuestas de gates
```

---

## Comandos /dr disponibles

| Comando | Que hace | Agentes |
|---------|----------|---------|
| /dr read | Lectura con lente de tesis | 1 |
| /dr write | Escritor con esqueleto | 1 |
| /dr review | Evaluacion 6 componentes + 30 principios | 4 paralelos |
| /dr humanize | Deteccion patrones IA | 1 |
| /dr verify | Verificacion citas vs PDFs | 1 |
| /dr mentor | Preguntas socraticas | 1 |
| /dr devil | Ataques adversariales | 1 |
| /dr report | Reporte de trazabilidad | 1 |
| /dr impact | Evaluacion de vacios | 4 paralelos |
| /dr benchmark | Comparacion vs anclas | 1 |
| /dr journal | Registro de acciones | — |

---

## Troubleshooting

| Problema | Solucion |
|----------|---------|
| Skills no aparecen en Claude Code | Reiniciar Claude Code. Verificar que SKILL.md esta en ~/.claude/skills/dr/ |
| "DR_FASES no disponible" | Cache del navegador. Ctrl+Shift+R o incognito |
| Gates no se muestran | Las fases se guardaron con version anterior. Desactivar y reactivar /dr |
| Alertas no aparecen | Verificar que las tablas dr_alerts existen en Supabase |
| Sync no funciona | Verificar SUPABASE_URL y SUPABASE_KEY en state.js |
