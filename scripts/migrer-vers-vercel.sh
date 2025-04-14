#!/bin/bash
# Script de migration FloDrama vers Vercel et nettoyage AWS
# Auteur: Cascade AI
# Date: 2025-04-07

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Migration de FloDrama vers Vercel et optimisation AWS ===${NC}"

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Installation de Vercel CLI...${NC}"
    npm install -g vercel
fi

# 1. Sauvegarde du projet avant migration
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)_backup_pre_vercel"
echo -e "${YELLOW}Création d'une sauvegarde dans $BACKUP_DIR...${NC}"
mkdir -p $BACKUP_DIR
cp -r src public vite.config.js package.json $BACKUP_DIR/
echo -e "${GREEN}Sauvegarde terminée${NC}"

# 2. Configuration du projet pour Vercel
echo -e "${YELLOW}Configuration du projet pour Vercel...${NC}"

# Vérifier si vercel.json existe déjà
if [ ! -f "vercel.json" ]; then
    echo -e "${YELLOW}Création du fichier vercel.json...${NC}"
    cat > vercel.json << EOF
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://api.flodrama.com/\$1"
    },
    {
      "src": "/(.*)",
      "dest": "/\$1"
    }
  ],
  "env": {
    "AWS_REGION": "us-east-1",
    "API_ENDPOINT": "https://api.flodrama.com"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, OPTIONS, PUT, DELETE"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
EOF
    echo -e "${GREEN}Fichier vercel.json créé${NC}"
fi

# 3. Optimisation du projet pour Vercel
echo -e "${YELLOW}Optimisation du projet pour Vercel...${NC}"

# Création d'un fichier .vercelignore
cat > .vercelignore << EOF
# Fichiers et dossiers à ignorer lors du déploiement Vercel
.git
node_modules
amplify.yml
scripts/migrer-vers-amplify.sh
scripts/nettoyer-et-migrer-amplify.sh
backups
*.log
.env.local
EOF

# 4. Déploiement sur Vercel
echo -e "${YELLOW}Déploiement du frontend sur Vercel...${NC}"
echo -e "${YELLOW}Vous allez être invité à vous connecter à Vercel si ce n'est pas déjà fait.${NC}"
echo -e "${YELLOW}Suivez les instructions à l'écran pour finaliser le déploiement.${NC}"

# Demander confirmation avant de déployer
read -p "Êtes-vous prêt à déployer sur Vercel ? (o/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then
    vercel --prod
else
    echo -e "${YELLOW}Déploiement annulé. Vous pouvez lancer le déploiement manuellement avec 'vercel --prod'${NC}"
    exit 0
fi

# 5. Configuration CORS sur les APIs AWS (à exécuter après déploiement réussi)
echo -e "${YELLOW}Souhaitez-vous configurer CORS sur les APIs AWS pour autoriser le domaine Vercel ?${NC}"
read -p "Configurer CORS sur AWS ? (o/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then
    echo -e "${YELLOW}Entrez le domaine Vercel de votre application (ex: flodrama.vercel.app):${NC}"
    read VERCEL_DOMAIN
    
    echo -e "${YELLOW}Configuration CORS sur les APIs AWS pour $VERCEL_DOMAIN...${NC}"
    API_ID=$(aws apigateway get-rest-apis --query "items[?name=='flodrama-rest-api'].id" --output text)
    
    if [ -z "$API_ID" ]; then
        echo -e "${RED}Impossible de trouver l'API Gateway 'flodrama-rest-api'${NC}"
    else
        aws apigateway update-rest-api \
          --rest-api-id $API_ID \
          --patch-operations op=replace,path=/corsConfiguration,value="{
            \"allowOrigins\": [\"https://$VERCEL_DOMAIN\"],
            \"allowMethods\": [\"GET\", \"POST\", \"PUT\", \"DELETE\", \"OPTIONS\"],
            \"allowHeaders\": [\"Content-Type\", \"Authorization\", \"X-Amz-Date\", \"X-Api-Key\"],
            \"exposeHeaders\": [\"Content-Length\", \"Content-Type\"],
            \"maxAge\": 86400
          }"
        
        echo -e "${GREEN}Configuration CORS terminée${NC}"
    fi
fi

# 6. Nettoyage des ressources Amplify inutiles (optionnel)
echo -e "${YELLOW}Souhaitez-vous nettoyer les ressources Amplify maintenant que le site est déployé sur Vercel ?${NC}"
echo -e "${RED}ATTENTION: Cette action est irréversible et supprimera l'application Amplify.${NC}"
read -p "Nettoyer Amplify ? (o/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then
    echo -e "${YELLOW}Suppression de l'application Amplify...${NC}"
    aws amplify delete-app --app-id d3v3iochmt8wu6 --confirmation "true"
    echo -e "${GREEN}Application Amplify supprimée${NC}"
fi

echo -e "${GREEN}Migration terminée avec succès!${NC}"
echo -e "${YELLOW}N'oubliez pas de mettre à jour la documentation et d'informer l'équipe du changement d'infrastructure.${NC}"

# Création d'un commit pour sauvegarder les modifications
git add vercel.json .vercelignore
git commit -m "✨ [FEAT] Migration vers Vercel"
git push origin main

echo -e "${GREEN}=== Fin du processus de migration ===${NC}"
