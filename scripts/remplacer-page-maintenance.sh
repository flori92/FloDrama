#!/bin/bash
# Script pour remplacer la page de maintenance par le contenu réel de l'application
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Remplacement de la page de maintenance par le contenu réel ===${NC}"

# Vérifier si le fichier public/index.html existe
if [ ! -f "public/index.html" ]; then
    echo -e "${RED}Erreur: Le fichier public/index.html n'existe pas${NC}"
    exit 1
fi

# Créer une sauvegarde du fichier index.html actuel
echo -e "${YELLOW}Création d'une sauvegarde du fichier index.html actuel...${NC}"
cp index.html index.html.maintenance.bak
echo -e "${GREEN}Sauvegarde créée: index.html.maintenance.bak${NC}"

# Copier le fichier public/index.html vers index.html
echo -e "${YELLOW}Copie du fichier public/index.html vers index.html...${NC}"
cp public/index.html index.html
echo -e "${GREEN}Fichier copié avec succès${NC}"

# Mettre à jour le déploiement sur Vercel
echo -e "${YELLOW}Mise à jour du déploiement sur Vercel...${NC}"
vercel --prod
echo -e "${GREEN}Déploiement mis à jour avec succès${NC}"

# Attendre quelques secondes pour que le déploiement soit effectif
echo -e "${YELLOW}Attente de la propagation du déploiement...${NC}"
sleep 10

# Tester l'accessibilité du site
echo -e "${YELLOW}Test de l'accessibilité du site...${NC}"
./scripts/tester-deploiement-vercel.sh

echo -e "${GREEN}=== Remplacement de la page de maintenance terminé ===${NC}"
echo -e "${YELLOW}L'application FloDrama est maintenant accessible avec son contenu complet à l'adresse: https://flodrama.vercel.app${NC}"
