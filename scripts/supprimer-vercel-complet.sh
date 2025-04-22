#!/bin/bash

# Script complet pour supprimer Vercel de FloDrama
# Créé le 22 avril 2025

echo "🧹 Suppression complète de Vercel dans FloDrama..."

# 1. Supprimer les fichiers de configuration Vercel
echo "📁 Suppression des fichiers de configuration Vercel..."
find . -name "vercel.json" -type f -delete
find . -name ".vercel" -type d -exec rm -rf {} +
find . -name ".vercelignore" -type f -delete

# 2. Nettoyer les dépendances Vercel dans package.json
if [ -f package.json ]; then
  echo "📦 Nettoyage des dépendances Vercel dans package.json..."
  # Utiliser sed pour supprimer les lignes contenant vercel
  sed -i '' '/"@vercel/d' package.json
  sed -i '' '/"vercel"/d' package.json
fi

# 3. Nettoyer les dépendances Vercel dans Frontend/package.json
if [ -f Frontend/package.json ]; then
  echo "📦 Nettoyage des dépendances Vercel dans Frontend/package.json..."
  sed -i '' '/"@vercel/d' Frontend/package.json
  sed -i '' '/"vercel"/d' Frontend/package.json
fi

# 4. Supprimer les variables d'environnement Vercel
echo "🔑 Suppression des variables d'environnement Vercel..."
find . -name ".env*" -type f -exec sed -i '' '/VERCEL_/d' {} \;

# 5. Supprimer les scripts Vercel restants
echo "📜 Suppression des scripts Vercel restants..."
find scripts -name "*vercel*" -type f -not -name "supprimer-vercel-complet.sh" -delete

# 6. Supprimer les références à Vercel dans la documentation
echo "📚 Nettoyage des références à Vercel dans la documentation..."
find . -name "*.md" -type f -exec sed -i '' 's/[Vv]ercel/GitHub Pages/g' {} \;

# 7. Supprimer les déploiements Vercel dans le workflow GitHub Actions
if [ -f .github/workflows/deploy.yml ]; then
  echo "🔄 Mise à jour du workflow GitHub Actions..."
  # Remplacer toute mention de Vercel par GitHub Pages
  sed -i '' 's/[Vv]ercel/GitHub Pages/g' .github/workflows/deploy.yml
fi

# 8. Nettoyer les caches locaux
echo "🗑️ Nettoyage des caches locaux..."
rm -rf .vercel
rm -rf node_modules/.cache/vercel
rm -rf Frontend/node_modules/.cache/vercel

# 9. Supprimer les URL Vercel des configurations
echo "🌐 Suppression des URL Vercel des configurations..."
find . -type f -name "*.js" -o -name "*.ts" -o -name "*.json" | xargs grep -l "vercel.app" | xargs sed -i '' 's/https:\/\/.*vercel.app/https:\/\/flori92.github.io\/FloDrama/g'

# 10. Commit des changements
echo "💾 Préparation du commit des changements..."
git add .
git status

echo "✅ Nettoyage terminé !"
echo ""
echo "🔴 IMPORTANT : Pour supprimer complètement l'intégration Vercel, tu dois :"
echo "1. Aller sur https://github.com/flori92/FloDrama/settings/installations"
echo "2. Trouver Vercel dans la liste et cliquer sur 'Configure'"
echo "3. Cliquer sur 'Uninstall'"
echo ""
echo "🔴 IMPORTANT : Pour supprimer le déploiement sur Vercel :"
echo "1. Aller sur https://vercel.com/dashboard"
echo "2. Sélectionner le projet FloDrama"
echo "3. Aller dans Settings > General > Delete Project"
echo ""
echo "Pour finaliser les changements, exécute :"
echo "git commit -m \"🧹 [CLEAN] Suppression complète de Vercel et migration vers GitHub Pages\""
echo "git push origin main"
