#!/bin/bash
# Script pour lister et nettoyer les Workers Cloudflare
# Auteur: Cascade pour FloDrama
# Date: 16 mai 2025

# Couleurs pour une meilleure lisibilité
VERT='\033[0;32m'
BLEU='\033[0;34m'
ROUGE='\033[0;31m'
JAUNE='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLEU}=== Nettoyage des Workers Cloudflare pour FloDrama ===${NC}\n"

# Fonction pour afficher un titre de section
section() {
  echo -e "\n${JAUNE}=== $1 ===${NC}"
}

# Vérifier si wrangler est disponible
if ! command -v npx &> /dev/null; then
    echo -e "${ROUGE}Le programme 'npx' n'est pas installé. Il est nécessaire pour exécuter wrangler.${NC}"
    exit 1
fi

# Partie 1: Lister les projets Pages (qui utilisent des Workers)
section "Projets Pages Cloudflare"
echo -e "${CYAN}Ces projets utilisent des Workers en arrière-plan${NC}"
npx wrangler pages project list

# Partie 2: Lister les Workers déployés récemment
section "Workers déployés récemment"
echo -e "${CYAN}Voici les Workers connus dans ce projet :${NC}"
echo -e "${VERT}1. flodrama-api-prod${NC} - API principale consolidée"
echo -e "${VERT}2. flodrama-cors-proxy${NC} - Proxy CORS pour l'API"
echo -e "${VERT}3. flodrama-scraper${NC} - Worker de scraping automatisé"
echo -e "${VERT}4. flodrama-media-gateway${NC} - Passerelle média"
echo -e "${VERT}5. flodrama-auth${NC} - Service d'authentification"

# Partie 3: Vérifier les Workers actifs
section "Vérification des Workers actifs"
echo -e "${CYAN}Tentative de récupération des informations de déploiement...${NC}"

check_worker() {
  local worker=$1
  echo -e "\n${CYAN}Vérification de ${worker}...${NC}"
  npx wrangler tail $worker --format=json 2>&1 | grep -q "not found" && echo -e "${ROUGE}Worker non trouvé ou inactif${NC}" || echo -e "${VERT}Worker actif${NC}"
}

check_worker "flodrama-api-prod"
check_worker "flodrama-cors-proxy"
check_worker "flodrama-scraper"
check_worker "flodrama-media-gateway"
check_worker "flodrama-auth"

# Partie 4: Instructions pour le nettoyage
section "Instructions pour le nettoyage"
echo -e "Pour supprimer un Worker, utilisez: ${JAUNE}npx wrangler delete <nom-du-worker>${NC}"
echo -e "Pour supprimer un projet Pages, utilisez: ${JAUNE}npx wrangler pages project delete <nom-du-projet>${NC}"
echo -e "\n${ROUGE}ATTENTION: La suppression est définitive. Assurez-vous de ne pas supprimer des Workers en production.${NC}"

# Partie 5: Menu interactif pour le nettoyage
section "Menu de nettoyage interactif"
echo -e "${CYAN}Voulez-vous supprimer un Worker ? (o/n)${NC}"
read -r reponse

if [[ "$reponse" =~ ^[Oo]$ ]]; then
  echo -e "\n${CYAN}Entrez le nom du Worker à supprimer :${NC}"
  read -r worker_name
  
  echo -e "${ROUGE}Êtes-vous sûr de vouloir supprimer $worker_name ? Cette action est irréversible. (o/n)${NC}"
  read -r confirmation
  
  if [[ "$confirmation" =~ ^[Oo]$ ]]; then
    echo -e "${CYAN}Suppression de $worker_name...${NC}"
    npx wrangler delete "$worker_name"
    echo -e "${VERT}Opération terminée.${NC}"
  else
    echo -e "${VERT}Suppression annulée.${NC}"
  fi
else
  echo -e "${VERT}Aucun Worker ne sera supprimé.${NC}"
fi

echo -e "\n${BLEU}=== Fin du nettoyage ===${NC}"
