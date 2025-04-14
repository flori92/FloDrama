#!/bin/bash

# Script de démarrage du backend FloDrama avec MongoDB Atlas
# Ce script démarre le serveur backend et initialise la base de données si nécessaire

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
echo -e "${YELLOW}Backend avec MongoDB Atlas${NC}"
echo ""

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js n'est pas installé. Veuillez l'installer avant de continuer.${NC}"
    exit 1
fi

# Vérifier si les variables d'environnement sont configurées
if [ ! -f .env ]; then
    echo -e "${YELLOW}Fichier .env non trouvé. Création d'un fichier .env par défaut...${NC}"
    
    # Créer un fichier .env par défaut
    cat > .env << EOL
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://flodrama:votre_mot_de_passe_securise@flodramacluster.mongodb.net/flodrama?retryWrites=true&w=majority
MONGODB_PASSWORD=votre_mot_de_passe_securise
JWT_SECRET=flodrama_jwt_secret_key_tres_securise_a_changer_en_production
JWT_EXPIRES_IN=7d

# API Configuration
API_URL=http://localhost:8090/api
NODE_ENV=development
EOL
    
    echo -e "${YELLOW}Fichier .env créé. Veuillez le modifier avec vos informations MongoDB Atlas.${NC}"
    echo -e "${YELLOW}Puis relancez ce script.${NC}"
    exit 1
fi

# Vérifier si les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installation des dépendances...${NC}"
    npm install
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Erreur lors de l'installation des dépendances.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Dépendances installées avec succès.${NC}"
fi

# Vérifier si le répertoire backend existe
if [ ! -d "backend" ]; then
    echo -e "${RED}Le répertoire backend n'existe pas.${NC}"
    exit 1
fi

# Initialiser la base de données si demandé
if [ "$1" == "--init-db" ]; then
    echo -e "${YELLOW}Initialisation de la base de données MongoDB Atlas...${NC}"
    node backend/scripts/seedDatabase.js
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Erreur lors de l'initialisation de la base de données.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Base de données initialisée avec succès.${NC}"
fi

# Démarrer le serveur backend
echo -e "${YELLOW}Démarrage du serveur backend...${NC}"
node backend/server.js

# Ce code ne sera jamais atteint si le serveur fonctionne correctement
echo -e "${RED}Le serveur s'est arrêté de manière inattendue.${NC}"
exit 1
