#!/bin/bash

# Script de vérification post-déploiement pour FloDrama
# Ce script vérifie que le déploiement sur AWS Amplify fonctionne correctement

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Vérification du déploiement FloDrama ===${NC}"

# Domaines à vérifier - pour l'instant, on se concentre sur l'URL Amplify
DOMAINS=(
  "dev.d3v3iochmt8wu6.amplifyapp.com"
)

# Vérification des domaines
echo -e "${YELLOW}Vérification de l'accessibilité des domaines...${NC}"
for domain in "${DOMAINS[@]}"; do
  echo -n "Vérification de $domain... "
  if curl -s -o /dev/null -w "%{http_code}" "https://$domain" | grep -q "200"; then
    echo -e "${GREEN}OK${NC}"
  else
    echo -e "${RED}ÉCHEC${NC}"
    echo "Le domaine $domain n'est pas accessible ou ne renvoie pas un code 200."
  fi
done

# Vérification des en-têtes CORS
echo -e "\n${YELLOW}Vérification des en-têtes CORS...${NC}"
for domain in "${DOMAINS[@]}"; do
  echo -n "Vérification des en-têtes CORS pour $domain... "
  HEADERS=$(curl -s -I "https://$domain")
  if echo "$HEADERS" | grep -i "Access-Control-Allow-Origin" > /dev/null; then
    echo -e "${GREEN}OK${NC}"
  else
    echo -e "${YELLOW}Non détecté${NC}"
    echo "Les en-têtes CORS ne sont pas détectés dans la réponse HTTP directe."
    echo "Cela peut être normal si les en-têtes sont ajoutés dynamiquement par CloudFront."
  fi
done

# Vérification des performances
echo -e "\n${YELLOW}Vérification des performances...${NC}"
for domain in "${DOMAINS[@]}"; do
  echo -n "Temps de réponse pour $domain... "
  RESPONSE_TIME=$(curl -s -w "%{time_total}\n" -o /dev/null "https://$domain")
  echo -e "${GREEN}${RESPONSE_TIME}s${NC}"
  
  if (( $(echo "$RESPONSE_TIME > 2.0" | bc -l) )); then
    echo -e "${YELLOW}⚠️ Le temps de réponse est supérieur à 2 secondes.${NC}"
  fi
done

# Vérification du contenu de la page
echo -e "\n${YELLOW}Vérification du contenu de la page...${NC}"
for domain in "${DOMAINS[@]}"; do
  echo -n "Vérification du contenu HTML pour $domain... "
  if curl -s "https://$domain" | grep -q "FloDrama"; then
    echo -e "${GREEN}OK${NC}"
    echo "La page contient bien le titre FloDrama."
  else
    echo -e "${RED}ÉCHEC${NC}"
    echo "La page ne contient pas le titre FloDrama."
  fi
done

# Génération d'un rapport
echo -e "\n${YELLOW}Génération du rapport de vérification...${NC}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="./logs/verification-deploiement-$TIMESTAMP.log"

mkdir -p ./logs

{
  echo "=== Rapport de vérification du déploiement FloDrama ==="
  echo "Date: $(date)"
  echo ""
  echo "Domaines vérifiés:"
  for domain in "${DOMAINS[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain")
    echo "- $domain: $STATUS"
  done
  
  echo ""
  echo "Performances:"
  for domain in "${DOMAINS[@]}"; do
    RESPONSE_TIME=$(curl -s -w "%{time_total}\n" -o /dev/null "https://$domain")
    echo "- $domain: ${RESPONSE_TIME}s"
  done
  
  echo ""
  echo "Statut Amplify:"
  aws amplify get-app --app-id d3v3iochmt8wu6 | grep -E "appId|name|defaultDomain|createTime"
  
  echo ""
  echo "Statut du domaine personnalisé:"
  aws amplify get-domain-association --app-id d3v3iochmt8wu6 --domain-name flodrama.com | grep -E "domainName|domainStatus|verified"
  
  echo ""
  echo "=== Fin du rapport ==="
} > "$REPORT_FILE"

echo -e "${GREEN}Rapport généré: $REPORT_FILE${NC}"
echo -e "${BLUE}=== Fin de la vérification ===${NC}"
