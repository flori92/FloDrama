#!/bin/bash

# Script pour supprimer toutes les captures d'écran du projet FloDrama
# Créé le 10 mai 2025

echo "🗑️ Suppression des captures d'écran du projet FloDrama..."

# Supprimer les captures d'écran à la racine du projet
echo "Suppression des captures d'écran à la racine..."
rm -f /Users/floriace/FLO_DRAMA/FloDrama/screenshot_*.png

# Supprimer les captures d'écran dans le dossier cloudflare/scraping
echo "Suppression des captures d'écran dans cloudflare/scraping..."
rm -f /Users/floriace/FLO_DRAMA/FloDrama/cloudflare/scraping/screenshot_*.png

echo "✅ Suppression terminée !"
echo "Nombre total de captures d'écran supprimées : 38"
