#!/bin/bash

# Script de nettoyage du dépôt Git pour FloDrama
# Ce script supprime définitivement les fichiers volumineux de l'historique Git

# Couleurs pour les messages
BLUE='\033[0;34m'
FUCHSIA='\033[0;35m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Afficher le logo FloDrama avec le dégradé signature
echo -e "${BLUE}███████${FUCHSIA}██████  ${BLUE}██       ${FUCHSIA}██████  ${BLUE}██████  ${FUCHSIA}██████  ${BLUE}███    ███${FUCHSIA}  █████  ${NC}"
echo -e "${BLUE}██     ${FUCHSIA}██   ██ ${BLUE}██      ${FUCHSIA}██    ██ ${BLUE}██   ██ ${FUCHSIA}██   ██ ${BLUE}████  ████${FUCHSIA} ██   ██ ${NC}"
echo -e "${BLUE}█████  ${FUCHSIA}██   ██ ${BLUE}██      ${FUCHSIA}██    ██ ${BLUE}██████  ${FUCHSIA}██████  ${BLUE}██ ████ ██${FUCHSIA} ███████ ${NC}"
echo -e "${BLUE}██     ${FUCHSIA}██   ██ ${BLUE}██      ${FUCHSIA}██    ██ ${BLUE}██   ██ ${FUCHSIA}██   ██ ${BLUE}██  ██  ██${FUCHSIA} ██   ██ ${NC}"
echo -e "${BLUE}██     ${FUCHSIA}██████  ${BLUE}███████ ${FUCHSIA}██████  ${BLUE}██   ██ ${FUCHSIA}██   ██ ${BLUE}██      ██${FUCHSIA} ██   ██ ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━${FUCHSIA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Nettoyage du dépôt Git pour FloDrama${NC}"
echo ""

# Vérifier si l'utilisateur est sûr de vouloir continuer
echo -e "${RED}ATTENTION: Ce script va réécrire l'historique Git complet.${NC}"
echo -e "${RED}Cette opération est irréversible et peut causer des problèmes si d'autres personnes utilisent ce dépôt.${NC}"
read -p "Êtes-vous sûr de vouloir continuer? (oui/non): " confirmation

if [ "$confirmation" != "oui" ]; then
    echo -e "${YELLOW}Opération annulée.${NC}"
    exit 0
fi

# Créer une sauvegarde de l'état actuel
echo -e "${YELLOW}Création d'une sauvegarde de l'état actuel...${NC}"
current_branch=$(git rev-parse --abbrev-ref HEAD)
timestamp=$(date +"%Y%m%d_%H%M%S")
git branch "backup_avant_nettoyage_${timestamp}"
echo -e "${GREEN}Sauvegarde créée dans la branche: backup_avant_nettoyage_${timestamp}${NC}"

# Supprimer les fichiers volumineux de l'historique Git
echo -e "${YELLOW}Suppression des fichiers volumineux de l'historique Git...${NC}"
echo -e "${YELLOW}Cette opération peut prendre plusieurs minutes...${NC}"

# Utiliser git filter-branch pour supprimer les fichiers volumineux
git filter-branch --force --index-filter \
    'git rm --cached --ignore-unmatch backups/*.zip backups/*.tar.gz' \
    --prune-empty --tag-name-filter cat -- --all

# Forcer la mise à jour des références
echo -e "${YELLOW}Mise à jour des références...${NC}"
git for-each-ref --format="%(refname)" refs/original/ | xargs -n 1 git update-ref -d

# Nettoyer les objets inutilisés
echo -e "${YELLOW}Nettoyage des objets inutilisés...${NC}"
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Pousser les modifications vers GitHub
echo -e "${YELLOW}Poussée des modifications vers GitHub...${NC}"
echo -e "${YELLOW}Cette opération nécessitera un push forcé (--force).${NC}"
read -p "Voulez-vous pousser les modifications maintenant? (oui/non): " push_confirmation

if [ "$push_confirmation" = "oui" ]; then
    git push origin $current_branch --force
    echo -e "${GREEN}Modifications poussées avec succès !${NC}"
else
    echo -e "${YELLOW}Pour pousser les modifications plus tard, utilisez:${NC}"
    echo -e "${BLUE}git push origin $current_branch --force${NC}"
fi

echo -e "${GREEN}Nettoyage du dépôt terminé avec succès !${NC}"
echo -e "${YELLOW}N'oubliez pas d'informer les autres contributeurs de ce changement.${NC}"
echo -e "${YELLOW}Ils devront cloner à nouveau le dépôt ou utiliser 'git pull --rebase'.${NC}"
