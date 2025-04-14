#!/bin/bash
# Script pour redéployer l'application sur Vercel avec accès public
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Redéploiement de l'application sur Vercel avec accès public ===${NC}"

# Token Vercel
TOKEN="BnDQbYpIvKumAkgdt2v87oR9"

# Exporter le token pour que Vercel CLI puisse l'utiliser
export VERCEL_TOKEN=$TOKEN

# Vérifier si git est propre
echo -e "${YELLOW}Vérification des modifications en cours...${NC}"
if [[ -n $(git status -s) ]]; then
  echo -e "${YELLOW}Commit des modifications en cours...${NC}"
  git add .
  git commit -m "🔧 [CONFIG] Mise à jour de la configuration Vercel pour accès public"
  git push origin main
fi

# Redéployer le projet avec les paramètres explicites
echo -e "${YELLOW}Redéploiement du projet avec accès public...${NC}"
vercel --prod --public --yes

# Récupérer l'URL du déploiement
DEPLOY_URL=$(vercel ls --prod | grep flodrama | awk '{print $2}')
echo -e "${GREEN}URL de déploiement : ${DEPLOY_URL}${NC}"

# Mettre à jour le script de test
echo -e "${YELLOW}Mise à jour du script de test avec la nouvelle URL...${NC}"
sed -i '' "s|VERCEL_URL=\"https://.*\"|VERCEL_URL=\"${DEPLOY_URL}\"|g" ./scripts/tester-deploiement-vercel.sh

# Tester l'accessibilité
echo -e "${YELLOW}Test de l'accessibilité du site...${NC}"
./scripts/tester-deploiement-vercel.sh

echo -e "${GREEN}=== Opération terminée ===${NC}"
