#!/bin/bash

# Script de nettoyage pour supprimer l'ancienne architecture AWS/Supabase
# Créé le: 7 mai 2025

echo "🧹 Début du nettoyage de l'ancienne architecture..."

# 1. Suppression des anciens dossiers principaux
echo "📁 Suppression des anciens dossiers principaux..."
rm -rf Frontend Backend cors-proxy

# 2. Suppression des scripts liés à AWS
echo "📜 Suppression des scripts liés à AWS..."
rm -f scripts/configure-dns-ssl.sh
rm -f scripts/fetch_lynx_documentation.sh
rm -f scripts/install_cron.sh
rm -f scripts/installer-lynx.sh
rm -f scripts/update_lynx_docs.sh

# 3. Suppression des fichiers de configuration AWS
echo "🔧 Suppression des fichiers de configuration AWS..."
rm -f .aws*
rm -f aws-config*.js
rm -f .env.aws

# 4. Suppression des fichiers de configuration Supabase
echo "🔧 Suppression des fichiers de configuration Supabase..."
rm -f .env.supabase
rm -f supabase*.js

# 5. Nettoyage des dossiers temporaires
echo "🗑️ Nettoyage des dossiers temporaires..."
rm -rf scraping-results
rm -rf exported_data

echo "✅ Nettoyage terminé ! L'architecture est maintenant entièrement basée sur Cloudflare."
echo "📝 Note: Si vous avez besoin de récupérer des fichiers supprimés, ils sont toujours disponibles dans l'historique Git."
