#!/bin/bash
# Script de configuration et utilisation de Vercel CLI
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Guide d'utilisation de Vercel CLI ===${NC}"

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Installation de Vercel CLI...${NC}"
    npm install -g vercel
else
    echo -e "${GREEN}Vercel CLI est déjà installé.${NC}"
    echo -e "${GREEN}Version : $(vercel --version)${NC}"
fi

# Afficher les commandes utiles
echo -e "${YELLOW}Commandes utiles de Vercel CLI :${NC}"
echo -e "${GREEN}1. Déployer le projet :${NC}"
echo -e "   vercel"
echo -e "${GREEN}2. Déployer en production :${NC}"
echo -e "   vercel --prod"
echo -e "${GREEN}3. Lister les déploiements :${NC}"
echo -e "   vercel ls"
echo -e "${GREEN}4. Lister les déploiements en production :${NC}"
echo -e "   vercel ls --prod"
echo -e "${GREEN}5. Obtenir des informations sur un déploiement :${NC}"
echo -e "   vercel inspect <url-du-deploiement>"
echo -e "${GREEN}6. Supprimer un déploiement :${NC}"
echo -e "   vercel remove <nom-du-projet>"
echo -e "${GREEN}7. Configurer les variables d'environnement :${NC}"
echo -e "   vercel env add"
echo -e "${GREEN}8. Lier le projet à Vercel :${NC}"
echo -e "   vercel link"
echo -e "${GREEN}9. Configurer un domaine personnalisé :${NC}"
echo -e "   vercel domains add <domaine>"

# Fonctions utiles
echo -e "${YELLOW}Voulez-vous effectuer une action spécifique ?${NC}"
echo -e "1. Déployer le projet en production"
echo -e "2. Lister les déploiements existants"
echo -e "3. Configurer un domaine personnalisé"
echo -e "4. Supprimer la protection par mot de passe"
echo -e "5. Quitter"

read -p "Votre choix (1-5) : " choice

case $choice in
    1)
        echo -e "${YELLOW}Déploiement du projet en production...${NC}"
        vercel --prod
        ;;
    2)
        echo -e "${YELLOW}Liste des déploiements existants :${NC}"
        vercel ls
        ;;
    3)
        echo -e "${YELLOW}Configuration d'un domaine personnalisé...${NC}"
        read -p "Entrez le nom de domaine : " domain
        vercel domains add $domain
        ;;
    4)
        echo -e "${YELLOW}Suppression de la protection par mot de passe...${NC}"
        echo -e "${YELLOW}Cette opération nécessite un token Vercel.${NC}"
        read -p "Entrez votre token Vercel (ou laissez vide pour annuler) : " token
        
        if [ -z "$token" ]; then
            echo -e "${RED}Opération annulée.${NC}"
            exit 0
        fi
        
        # ID du projet connu
        PROJECT_ID="prj_1tJXiyQeYrae8GFccevyztN63MDY"
        
        echo -e "${GREEN}ID du projet : $PROJECT_ID${NC}"
        
        # Supprimer la protection par mot de passe
        echo -e "${YELLOW}Suppression de la protection par mot de passe...${NC}"
        curl -X DELETE "https://api.vercel.com/v9/projects/$PROJECT_ID/auth" \
          -H "Authorization: Bearer $token"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Protection par mot de passe désactivée avec succès${NC}"
        else
            echo -e "${RED}❌ Erreur lors de la désactivation de la protection par mot de passe${NC}"
        fi
        
        # Configurer le projet en mode public
        echo -e "${YELLOW}Configuration du projet en mode public...${NC}"
        curl -X PATCH "https://api.vercel.com/v9/projects/$PROJECT_ID" \
          -H "Authorization: Bearer $token" \
          -H "Content-Type: application/json" \
          -d '{"public": true}'
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Projet configuré en mode public avec succès${NC}"
        else
            echo -e "${RED}❌ Erreur lors de la configuration du projet en mode public${NC}"
        fi
        
        # Redéployer le projet
        echo -e "${YELLOW}Redéploiement du projet...${NC}"
        vercel --prod --token $token
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Projet redéployé avec succès${NC}"
        else
            echo -e "${RED}❌ Erreur lors du redéploiement du projet${NC}"
        fi
        ;;
    5)
        echo -e "${GREEN}Au revoir !${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Choix invalide.${NC}"
        ;;
esac

echo -e "${GREEN}=== Fin du guide ===${NC}"
