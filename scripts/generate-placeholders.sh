#!/bin/bash

# Script pour générer les images placeholder pour FloDrama
# Ce script crée les placeholders pour les dramas et autres médias

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Génération des placeholders pour FloDrama ===${NC}"

# Créer les dossiers nécessaires
mkdir -p /Users/floriace/FLO_DRAMA/FloDrama/public/assets/media/posters
mkdir -p /Users/floriace/FLO_DRAMA/FloDrama/public/assets/media/backdrops
mkdir -p /Users/floriace/FLO_DRAMA/FloDrama/public/assets/media/thumbnails

# Fonction pour créer un SVG placeholder
create_svg_placeholder() {
  local id=$1
  local type=$2
  local width=$3
  local height=$4
  local output_dir=$5

  cat > "${output_dir}/${id}.jpg" << EOF
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#d946ef" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="#1A1926" />
  <rect x="10" y="10" width="${width - 20}" height="${height - 20}" rx="5" stroke="url(#gradient)" stroke-width="2" fill="none" />
  <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="url(#gradient)">${id}</text>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="white">${type}</text>
</svg>
EOF

  echo -e "${GREEN}✓ Placeholder créé pour ${id} (${type})${NC}"
}

# Créer le fichier status.json pour les vérifications de CDN
cat > /Users/floriace/FLO_DRAMA/FloDrama/public/assets/status.json << EOF
{
  "status": "ok",
  "timestamp": $(date +%s),
  "message": "FloDrama assets are available",
  "version": "1.0.0"
}
EOF

echo -e "${GREEN}✓ Fichier status.json créé${NC}"

# Créer les placeholders pour les dramas
drama_ids=("drama001" "drama002" "drama003" "drama004" "drama005" "drama006" "drama007" "drama008")

for id in "${drama_ids[@]}"; do
  create_svg_placeholder "$id" "poster" 300 450 "/Users/floriace/FLO_DRAMA/FloDrama/public/assets/media/posters"
  create_svg_placeholder "$id" "backdrop" 1280 720 "/Users/floriace/FLO_DRAMA/FloDrama/public/assets/media/backdrops"
  create_svg_placeholder "$id" "thumbnail" 200 113 "/Users/floriace/FLO_DRAMA/FloDrama/public/assets/media/thumbnails"
done

echo -e "\n${GREEN}Génération des placeholders terminée !${NC}"
echo -e "${BLUE}=== Fin de la génération ===${NC}"
