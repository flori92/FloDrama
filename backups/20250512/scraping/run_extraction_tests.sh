#!/bin/bash
# Script pour tester les extracteurs de streaming FloDrama
# Exécute la passerelle média en arrière-plan et lance les tests

# Couleurs pour la sortie console
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Démarrage des tests d'extraction FloDrama${NC}"
echo -e "${YELLOW}Ce script va lancer la passerelle média en mode développement puis exécuter les tests d'extraction${NC}"

# Chemin vers les fichiers de projet
WORKER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../workers" && pwd)"
MEDIA_GATEWAY="$WORKER_DIR/media-gateway-v2.js"
TEST_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/test_extractors.py"

# Vérifier que les fichiers nécessaires existent
if [ ! -f "$MEDIA_GATEWAY" ]; then
    echo -e "${RED}❌ Erreur: Impossible de trouver le fichier de passerelle média:${NC}"
    echo -e "${RED}   $MEDIA_GATEWAY${NC}"
    exit 1
fi

if [ ! -f "$TEST_SCRIPT" ]; then
    echo -e "${RED}❌ Erreur: Impossible de trouver le script de test:${NC}"
    echo -e "${RED}   $TEST_SCRIPT${NC}"
    exit 1
fi

# Vérifier que wrangler est installé
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Erreur: wrangler n'est pas installé. Veuillez l'installer avec:${NC}"
    echo -e "${YELLOW}npm install -g wrangler${NC}"
    exit 1
fi

# Vérifier que Python et Playwright sont installés
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Erreur: python3 n'est pas installé${NC}"
    exit 1
fi

if ! python3 -c "import playwright" &> /dev/null; then
    echo -e "${YELLOW}⚠️ Playwright n'est pas installé. Installation...${NC}"
    pip install playwright
    python3 -m playwright install
fi

echo -e "${GREEN}✅ Toutes les dépendances sont installées${NC}"

# Lancer le worker en arrière-plan
echo -e "${BLUE}📡 Démarrage de la passerelle média...${NC}"
cd "$WORKER_DIR" || exit 1
nohup wrangler dev media-gateway-v2.js --port 8787 > /tmp/wrangler.log 2>&1 &
WRANGLER_PID=$!

# Attendre que le serveur démarre
echo -e "${YELLOW}⏳ Attente du démarrage du serveur...${NC}"
sleep 10

# Vérifier que le serveur a démarré correctement
if ! curl -s http://localhost:8787/status > /dev/null; then
    echo -e "${RED}❌ Erreur: Le serveur n'a pas démarré correctement${NC}"
    echo -e "${YELLOW}Log du serveur:${NC}"
    cat /tmp/wrangler.log
    kill $WRANGLER_PID
    exit 1
fi

echo -e "${GREEN}✅ Passerelle média démarrée sur http://localhost:8787${NC}"

# Exécuter les tests
echo -e "${BLUE}🧪 Exécution des tests d'extraction...${NC}"
python3 "$TEST_SCRIPT"

# Récupérer le code de retour
TEST_RESULT=$?

# Arrêter le worker
echo -e "${BLUE}🛑 Arrêt de la passerelle média...${NC}"
kill $WRANGLER_PID

# Afficher les résultats
if [ -f "extractor_test_results.json" ]; then
    echo -e "${GREEN}📊 Résultats des tests enregistrés dans extractor_test_results.json${NC}"
    
    # Compter les succès et échecs
    SUCCESS_COUNT=$(grep -o '"success": true' extractor_test_results.json | wc -l)
    TOTAL_COUNT=$(grep -o '"success":' extractor_test_results.json | wc -l)
    
    if [ "$SUCCESS_COUNT" -eq "$TOTAL_COUNT" ]; then
        echo -e "${GREEN}🎉 Tous les extracteurs ($SUCCESS_COUNT/$TOTAL_COUNT) fonctionnent correctement!${NC}"
    else
        echo -e "${YELLOW}⚠️ $SUCCESS_COUNT/$TOTAL_COUNT extracteurs fonctionnent correctement${NC}"
        
        # Afficher les extracteurs en échec
        echo -e "${YELLOW}Extracteurs en échec:${NC}"
        jq -r 'to_entries[] | select(.value.success == false) | .key' extractor_test_results.json | while read -r source; do
            echo -e "${RED}  - $source${NC}"
        done
    fi
else
    echo -e "${RED}❌ Erreur: Fichier de résultats non trouvé${NC}"
fi

echo -e "${BLUE}✨ Tests terminés${NC}"

exit $TEST_RESULT
