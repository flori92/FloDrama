#!/bin/bash

# Script de nettoyage du projet FloDrama
# Ce script supprime les fichiers et dossiers obsolètes

echo "🔍 Début du nettoyage du projet..."
# Sauvegarde des fichiers importants au cas où
echo "📦 Sauvegarde des fichiers importants..."
if [ ! -d "backups" ]; then
    mkdir -p backups
fi
cp .env backups/ 2>/dev/null || true
cp .env.example backups/ 2>/dev/null || true

# Suppression des dossiers obsolètes
echo "🗑️  Suppression des dossiers obsolètes..."
rm -rf Frontend/
rm -rf Apis/
rm -rf render-service/
rm -rf src/

# Nettoyage des dossiers de développement
echo "🧹 Nettoyage des dossiers de développement..."
rm -rf node_modules/
rm -rf .cache/
rm -rf .venv/
rm -rf .cursor/

# Suppression des fichiers de migration obsolètes
echo "🧹 Nettoyage des fichiers de migration..."
rm -f finaliser_reorganisation.sh
rm -f nettoyage_complet.sh
rm -f nettoyage_obsoletes.sh
rm -f nettoyer_projet.sh
rm -f reorganiser_projet.sh
rm -f supprimer_screenshots.sh
rm -f audit-flodrama-api.js

# Vérification de la présence de fichiers sensibles avant suppression
echo "🔒 Vérification des fichiers sensibles..."
if [ -f ".env" ] || [ -f ".secrets" ]; then
    echo "⚠️  Attention: Des fichiers sensibles ont été détectés. Voulez-vous les supprimer? (o/n)"
    read -r response
    if [[ "$response" =~ ^[Oo]$ ]]; then
        rm -f .env
        rm -rf .secrets/
    fi
fi

echo "✅ Nettoyage terminé avec succès!"
echo "📌 Conseil: Exécutez 'git status' pour voir les modifications apportées."
