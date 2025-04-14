#!/bin/bash
# Script de configuration du domaine personnalisé sur Vercel
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Configuration du domaine personnalisé sur Vercel ===${NC}"

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Installation de Vercel CLI...${NC}"
    npm install -g vercel
fi

# Domaines à configurer
DOMAINS=("flodrama.com" "www.flodrama.com" "dev.flodrama.com")

# Token Vercel et ID du projet
TOKEN="BnDQbYpIvKumAkgdt2v87oR9"
PROJECT_ID="prj_1tJXiyQeYrae8GFccevyztN63MDY"

# Exporter le token pour que Vercel CLI puisse l'utiliser
export VERCEL_TOKEN=$TOKEN

echo -e "${YELLOW}ID du projet Vercel: $PROJECT_ID${NC}"

# Ajouter les domaines au projet
for domain in "${DOMAINS[@]}"; do
    echo -e "${YELLOW}Configuration du domaine: $domain${NC}"
    vercel domains add $domain
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Domaine $domain ajouté avec succès${NC}"
    else
        echo -e "${RED}Erreur lors de l'ajout du domaine $domain${NC}"
    fi
done

echo -e "${GREEN}Configuration des domaines terminée${NC}"
echo -e "${YELLOW}Instructions pour la mise à jour DNS:${NC}"
echo -e "1. Connectez-vous à votre registrar de domaine"
echo -e "2. Mettez à jour les enregistrements DNS suivants:"
echo -e "   - Type: A, Nom: @, Valeur: 76.76.21.21"
echo -e "   - Type: CNAME, Nom: www, Valeur: cname.vercel-dns.com."
echo -e "   - Type: CNAME, Nom: dev, Valeur: cname.vercel-dns.com."
echo -e "3. Attendez la propagation DNS (peut prendre jusqu'à 48h)"

echo -e "${YELLOW}Vérification du statut des domaines...${NC}"

# Vérifier le statut des domaines
for domain in "${DOMAINS[@]}"; do
    echo -e "${YELLOW}Vérification du domaine: $domain${NC}"
    vercel domains inspect $domain
done

echo -e "${GREEN}=== Fin de la configuration des domaines ===${NC}"
