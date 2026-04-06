#!/bin/bash
# CRISOL — Deploy script
# Copia los archivos web a /tmp y deploya desde ahí
# (Vercel tiene problemas con paths de Google Drive)

echo "📦 Preparando deploy..."
rm -rf /tmp/crisol-deploy
mkdir -p /tmp/crisol-deploy

# Copiar solo archivos web (no skills, docs, SQL, etc.)
cp -r index.html css js data downloads vercel.json /tmp/crisol-deploy/

cd /tmp/crisol-deploy

# Link al proyecto existente
npx vercel link --project crisol --scope alejandro-9408s-projects --yes 2>/dev/null

# Deploy
echo "🚀 Desplegando..."
npx vercel deploy --prod --yes

echo "✅ Deploy completado"
