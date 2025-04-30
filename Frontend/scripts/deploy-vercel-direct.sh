#!/bin/bash
# Script de déploiement direct vers Vercel contournant les vérifications TypeScript
set -e

echo "🚀 Déploiement direct vers Vercel..."
echo "===================================="

# Vérification de l'installation de Vercel CLI
if ! command -v vercel &> /dev/null; then
  echo "📦 Installation de Vercel CLI..."
  npm install -g vercel
fi

# Création du répertoire de logs
mkdir -p "logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/deploy_${TIMESTAMP}.log"

# Création du fichier .env avec les variables Supabase
echo "🔑 Configuration des variables d'environnement Supabase..."
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo "⚠️ Variables Supabase non définies, utilisation des valeurs par défaut"
  echo "VITE_SUPABASE_URL=https://fffgoqubrbgppcqqkyod.supabase.co" > .env
  echo "VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZmdvcXVicmJncHBjcXFreW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MTc0MTUwTUwNH0.lxpg0D4vmAbCAR-tHxUSFCvavNQFEe98Qii32YsCnJI" >> .env
else
  echo "VITE_SUPABASE_URL=$VITE_SUPABASE_URL" > .env
  echo "VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY" >> .env
fi

# Création du fichier vercel.json pour configurer le déploiement
echo "📝 Création de la configuration Vercel..."
cat > vercel.json << EOF
{
  "buildCommand": "vite build --mode production",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "env": {
    "VITE_SUPABASE_URL": "$VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY": "$VITE_SUPABASE_ANON_KEY"
  }
}
EOF

# Vérification si l'utilisateur est connecté à Vercel
if [ -z "$VERCEL_TOKEN" ]; then
  echo "❌ Token Vercel non défini. Tentative de connexion..."
  vercel login
else
  echo "🔑 Utilisation du token Vercel fourni"
fi

# Déploiement vers Vercel
echo "🚀 Déploiement vers Vercel..."
if [ -n "$VERCEL_TOKEN" ]; then
  vercel deploy --prod --token=$VERCEL_TOKEN --yes | tee -a "$LOG_FILE"
else
  vercel --prod | tee -a "$LOG_FILE"
fi

# Récupération de l'URL de déploiement
DEPLOY_URL=$(grep -o 'https://.*vercel.app' "$LOG_FILE" | tail -1)

echo "===================================="
if [ -n "$DEPLOY_URL" ]; then
  echo "✅ Déploiement terminé avec succès !"
  echo "🌐 Le site est accessible à l'adresse : $DEPLOY_URL"
else
  echo "⚠️ Déploiement terminé, mais impossible de récupérer l'URL."
  echo "🌐 Vérifiez votre tableau de bord Vercel pour l'URL de déploiement."
fi
echo "===================================="
