#!/bin/bash
# Script pour lancer les tests de la fonctionnalité Watch Party

# Couleurs pour les messages
VERT='\033[0;32m'
ROUGE='\033[0;31m'
JAUNE='\033[0;33m'
BLEU='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLEU}=== Tests de la fonctionnalité Watch Party pour FloDrama ===${NC}"
echo -e "${JAUNE}Préparation de l'environnement de test...${NC}"

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo -e "${ROUGE}Node.js n'est pas installé. Veuillez l'installer avant de continuer.${NC}"
    exit 1
fi

# Se positionner dans le répertoire du projet
cd "$(dirname "$0")/.." || exit 1

# Vérifier si les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo -e "${JAUNE}Installation des dépendances...${NC}"
    npm install
fi

# Charger les variables d'environnement de test
echo -e "${JAUNE}Chargement de la configuration de test...${NC}"
export $(grep -v '^#' .env.test | xargs)

# Exécuter les tests spécifiques à la Watch Party
echo -e "${JAUNE}Exécution des tests de la Watch Party...${NC}"
npm test -- --testPathPattern=src/tests/watch-party

# Vérifier le résultat des tests
if [ $? -eq 0 ]; then
    echo -e "${VERT}✅ Tous les tests ont réussi !${NC}"
else
    echo -e "${ROUGE}❌ Certains tests ont échoué. Veuillez consulter les logs pour plus de détails.${NC}"
fi

# Lancer le serveur de développement avec la configuration de test
echo -e "${JAUNE}Voulez-vous lancer l'application en mode test ? (o/n)${NC}"
read -r reponse

if [[ "$reponse" =~ ^[Oo]$ ]]; then
    echo -e "${BLEU}Démarrage de l'application en mode test...${NC}"
    REACT_APP_ENV=test npm start
else
    echo -e "${BLEU}Fin des tests. Merci !${NC}"
fi
