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

# Créer le fichier status.json pour les vérifications de CDN
cat > /Users/floriace/FLO_DRAMA/FloDrama/public/status.json << EOF
{
  "status": "ok",
  "timestamp": $(date +%s),
  "message": "FloDrama assets are available",
  "version": "1.0.0"
}
EOF

echo -e "${GREEN}✓ Fichier status.json créé${NC}"

# Créer des placeholders simples pour les dramas
drama_ids=("drama001" "drama002" "drama003" "drama004" "drama005" "drama006" "drama007" "drama008")

for id in "${drama_ids[@]}"; do
  # Créer un fichier texte simple comme placeholder pour les posters
  echo "Placeholder pour ${id}" > "/Users/floriace/FLO_DRAMA/FloDrama/public/assets/media/posters/${id}.jpg"
  echo -e "${GREEN}✓ Placeholder créé pour ${id} (poster)${NC}"
  
  # Créer un fichier texte simple comme placeholder pour les backdrops
  echo "Placeholder pour ${id}" > "/Users/floriace/FLO_DRAMA/FloDrama/public/assets/media/backdrops/${id}.jpg"
  echo -e "${GREEN}✓ Placeholder créé pour ${id} (backdrop)${NC}"
  
  # Créer un fichier texte simple comme placeholder pour les thumbnails
  echo "Placeholder pour ${id}" > "/Users/floriace/FLO_DRAMA/FloDrama/public/assets/media/thumbnails/${id}.jpg"
  echo -e "${GREEN}✓ Placeholder créé pour ${id} (thumbnail)${NC}"
done

# Créer un placeholder pour le logo
cat > /Users/floriace/FLO_DRAMA/FloDrama/public/assets/logo.svg << EOF
<svg width="200" height="60" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#d946ef" />
    </linearGradient>
  </defs>
  <rect width="200" height="60" fill="#1A1926" />
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="url(#gradient)">FloDrama</text>
</svg>
EOF

echo -e "${GREEN}✓ Logo créé${NC}"

echo -e "\n${GREEN}Génération des placeholders terminée !${NC}"
echo -e "${BLUE}=== Fin de la génération ===${NC}"
