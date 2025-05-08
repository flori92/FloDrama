#!/bin/bash
# Script pour finaliser la migration de Firebase vers Cloudflare
# Ce script supprime les fichiers Firebase inutilisés et vérifie l'intégrité de la migration

echo "🚀 Début de la finalisation de la migration vers Cloudflare..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "./src/Cloudflare" ]; then
  echo "❌ Erreur: Le répertoire Cloudflare n'existe pas. Exécutez ce script depuis le répertoire racine du projet."
  exit 1
fi

# Vérifier que tous les fichiers Cloudflare nécessaires existent
CLOUDFLARE_FILES=(
  "./src/Cloudflare/CloudflareApp.js"
  "./src/Cloudflare/CloudflareAuth.js"
  "./src/Cloudflare/CloudflareConfig.js"
  "./src/Cloudflare/CloudflareDB.js"
  "./src/Cloudflare/CloudflareStorage.js"
)

for file in "${CLOUDFLARE_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Erreur: Le fichier $file n'existe pas."
    exit 1
  fi
done

echo "✅ Tous les fichiers Cloudflare nécessaires sont présents."

# Vérifier s'il reste des imports Firebase dans le code
echo "🔍 Recherche d'imports Firebase résiduels..."
FIREBASE_IMPORTS=$(grep -r "import.*firebase" --include="*.js" --include="*.jsx" ./src)

if [ -n "$FIREBASE_IMPORTS" ]; then
  echo "⚠️ Attention: Des imports Firebase sont encore présents dans le code:"
  echo "$FIREBASE_IMPORTS"
  echo "Veuillez les remplacer par des imports Cloudflare avant de continuer."
  exit 1
fi

echo "✅ Aucun import Firebase résiduel trouvé."

# Supprimer le répertoire Firebase
if [ -d "./src/Firebase" ]; then
  echo "🗑️ Suppression du répertoire Firebase..."
  rm -rf ./src/Firebase
  echo "✅ Répertoire Firebase supprimé avec succès."
else
  echo "ℹ️ Le répertoire Firebase n'existe pas ou a déjà été supprimé."
fi

# Vérifier si firebase est toujours dans package.json
if grep -q '"firebase":' ./package.json; then
  echo "⚠️ La dépendance firebase est toujours présente dans package.json."
  echo "Veuillez la supprimer manuellement et exécuter npm install."
else
  echo "✅ La dépendance firebase a été correctement supprimée de package.json."
fi

# Mettre à jour la documentation
echo "📝 Mise à jour de la documentation..."

# Créer un fichier de documentation sur la migration
cat > ./MIGRATION_CLOUDFLARE.md << EOL
# Migration de Firebase vers Cloudflare

## Architecture actuelle

L'application FloDrama a été entièrement migrée de Firebase vers Cloudflare:

- **API**: Cloudflare Workers (https://flodrama-api-prod.florifavi.workers.dev)
- **Base de données**: Cloudflare D1 (ID: 39a4a8fd-f1fd-49ab-abcc-290fd473a311)
- **Stockage**: Cloudflare R2 (bucket: flodrama-storage)
- **Métadonnées**: Cloudflare KV (FLODRAMA_METADATA)

## Services migrés

- **Authentification**: Système complet d'authentification basé sur Cloudflare Workers
- **Base de données**: Stockage des données utilisateur dans Cloudflare D1
- **Stockage**: Gestion des fichiers utilisateur dans Cloudflare R2
- **API**: Tous les endpoints sont maintenant gérés par Cloudflare Workers

## Structure des fichiers

Les services Firebase ont été remplacés par des équivalents Cloudflare:

- \`src/Cloudflare/CloudflareApp.js\`: Point d'entrée principal
- \`src/Cloudflare/CloudflareAuth.js\`: Service d'authentification
- \`src/Cloudflare/CloudflareDB.js\`: Service de base de données
- \`src/Cloudflare/CloudflareStorage.js\`: Service de stockage
- \`src/Cloudflare/CloudflareConfig.js\`: Configuration et constantes

## Changements dans le code

- Tous les imports Firebase ont été remplacés par des imports Cloudflare
- Les hooks personnalisés ont été adaptés pour utiliser l'API Cloudflare
- Les composants utilisateur ont été mis à jour pour utiliser les nouveaux services

## Prochaines étapes

- Configurer un système de monitoring pour les services Cloudflare
- Optimiser les performances des requêtes API
- Mettre en place un système de cache pour améliorer les temps de réponse
EOL

echo "✅ Documentation mise à jour avec succès."

# Exécuter npm install pour mettre à jour les dépendances
echo "📦 Mise à jour des dépendances..."
npm install --legacy-peer-deps

echo "🎉 Migration vers Cloudflare finalisée avec succès!"
echo "📚 Consultez le fichier MIGRATION_CLOUDFLARE.md pour plus d'informations sur la nouvelle architecture."
