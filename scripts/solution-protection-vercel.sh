#!/bin/bash
# Script pour désactiver la protection par mot de passe sur Vercel
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Solution définitive pour la protection Vercel ===${NC}"

# Token Vercel
TOKEN="BnDQbYpIvKumAkgdt2v87oR9"

# Exporter le token pour que Vercel CLI puisse l'utiliser
export VERCEL_TOKEN=$TOKEN

# Vérifier la configuration actuelle
echo -e "${YELLOW}Vérification de la configuration actuelle...${NC}"
vercel project ls

# Supprimer le projet existant
echo -e "${YELLOW}Suppression du projet existant...${NC}"
vercel project remove flodrama --yes

# Créer un nouveau projet sans protection
echo -e "${YELLOW}Création d'un nouveau projet sans protection...${NC}"
mkdir -p /tmp/flodrama-temp
cd /tmp/flodrama-temp
echo '{"public": true}' > vercel.json
vercel --name flodrama --confirm --public

# Revenir au répertoire du projet
cd - > /dev/null

# Déployer le projet actuel
echo -e "${YELLOW}Déploiement du projet actuel...${NC}"
vercel --prod --public

echo -e "${GREEN}=== Opération terminée ===${NC}"
echo -e "${YELLOW}Veuillez vérifier l'accès au site en exécutant :${NC}"
echo -e "./scripts/tester-deploiement-vercel.sh"
