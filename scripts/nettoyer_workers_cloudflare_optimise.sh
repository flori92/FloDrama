#!/bin/bash
# Script optimisé pour lister et nettoyer les Workers Cloudflare
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

# Liste des Workers connus
declare -a workers=(
  "flodrama-api-prod"
  "flodrama-api-consolidated"
  "flodrama-cors-proxy"
  "flodrama-scraper"
  "flodrama-media-gateway"
  "flodrama-auth"
  "flodrama-content-api"
  "flodrama-image-processor"
)

# Vérifier l'existence des Workers sans utiliser tail
check_worker_existence() {
  local worker=$1
  local status
  
  # Tentative de récupération des métadonnées du Worker
  status=$(npx wrangler deploy --dry-run --name "$worker" 2>&1 | grep -i "worker" | grep -i "exists")
  
  if [[ -n "$status" ]]; then
    echo -e "${VERT}✅ $worker${NC} - Worker existant"
    return 0
  else
    echo -e "${ROUGE}❌ $worker${NC} - Worker non trouvé ou inactif"
    return 1
  fi
}

# Afficher les Workers et vérifier leur existence
for worker in "${workers[@]}"; do
  check_worker_existence "$worker"
done

# Partie 3: Recherche de Workers supplémentaires
section "Recherche de Workers supplémentaires"
echo -e "${CYAN}Entrez un motif de recherche pour trouver d'autres Workers (ex: flodrama) ou laissez vide pour ignorer :${NC}"
read -r search_pattern

if [[ -n "$search_pattern" ]]; then
  echo -e "${CYAN}Recherche de Workers contenant '$search_pattern'...${NC}"
  # Cette partie est simulée car il n'y a pas de commande directe pour rechercher des Workers
  echo -e "${JAUNE}Note: Cette recherche est limitée aux Workers connus.${NC}"
  for worker in $(find /Users/floriace/FLO_DRAMA/FloDrama -name "wrangler.toml" -exec grep -l "name" {} \; | xargs grep -l "$search_pattern" | xargs grep "name" | cut -d'"' -f2); do
    if [[ ! " ${workers[@]} " =~ " ${worker} " ]]; then
      echo -e "${CYAN}Worker trouvé: $worker${NC}"
      check_worker_existence "$worker"
    fi
  done
fi

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
