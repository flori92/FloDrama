#!/bin/bash

# Script de déploiement direct pour Vercel
# Ce script contourne les problèmes de TypeScript en utilisant une approche manuelle
# pour le déploiement sur Vercel

echo "🚀 Déploiement direct de FloDrama sur Vercel"
echo "===================================="

# Vérifier si le répertoire dist existe et le supprimer si c'est le cas
if [ -d "dist" ]; then
  echo "🧹 Nettoyage du répertoire dist existant..."
  rm -rf dist
fi

# Créer un répertoire dist
mkdir -p dist

# Copier les fichiers statiques
echo "📦 Préparation des fichiers statiques..."
cp -r public/* dist/ 2>/dev/null || true

# Créer un fichier index.html minimal
echo "📝 Création d'une page de maintenance..."
cat > dist/index.html << 'EOL'
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FloDrama - Site en cours de déploiement</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background-color: #121212;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      padding: 20px;
      text-align: center;
    }
    .logo {
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 20px;
      color: #ff4081;
    }
    .message {
      font-size: 1.2rem;
      max-width: 600px;
      line-height: 1.6;
    }
    .spinner {
      margin: 40px auto;
      width: 50px;
      height: 50px;
      border: 5px solid rgba(255, 64, 129, 0.2);
      border-radius: 50%;
      border-top-color: #ff4081;
      animation: spin 1s ease-in-out infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="logo">FloDrama</div>
  <div class="spinner"></div>
  <div class="message">
    <p>Notre site est en cours de déploiement. Nous serons bientôt de retour avec une expérience cinématographique exceptionnelle.</p>
    <p>Merci de votre patience !</p>
  </div>
</body>
</html>
EOL

# Déployer sur Vercel
echo "🚀 Déploiement sur Vercel..."
echo "🌐 Déploiement en PRODUCTION"

# Utiliser vercel pour déployer le répertoire dist
vercel dist --prod --yes

echo "===================================="
echo "✅ Déploiement terminé !"
echo "===================================="
echo "📝 N'oubliez pas de configurer les variables d'environnement dans le tableau de bord Vercel :"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_ANON_KEY"
echo "===================================="
