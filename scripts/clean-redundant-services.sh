#!/bin/bash

# Script de nettoyage des services redondants pour FloDrama
# Ce script renomme les services redondants en ajoutant .bak à la fin
# pour éviter de les supprimer complètement tout en permettant une restauration si nécessaire

echo "🧹 Nettoyage des services redondants pour FloDrama"
echo "🎨 Maintien de l'identité visuelle avec le dégradé signature bleu-fuchsia (#3b82f6 → #d946ef)"

# Définition des couleurs pour les messages
BLUE='\033[0;34m'
FUCHSIA='\033[0;35m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Répertoire de base
BASE_DIR="/Users/floriace/FLO_DRAMA/FloDrama"
SERVICES_DIR="$BASE_DIR/src/services"
BACKUP_DIR="$BASE_DIR/src/services/backup-$(date +%Y%m%d)"

# Création du répertoire de backup
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}✅ Répertoire de backup créé: $BACKUP_DIR${NC}"

# Liste des services redondants à déplacer
REDUNDANT_SERVICES=(
  "ScrapingService.js"
  "SmartScrapingService.js"
  "AdaptiveScraperService.js"
  "videoScraper.js"
)

# Déplacement des services redondants vers le répertoire de backup
for service in "${REDUNDANT_SERVICES[@]}"; do
  if [ -f "$SERVICES_DIR/$service" ]; then
    echo -e "${BLUE}🔄 Déplacement de $service vers le répertoire de backup...${NC}"
    cp "$SERVICES_DIR/$service" "$BACKUP_DIR/$service"
    mv "$SERVICES_DIR/$service" "$SERVICES_DIR/$service.bak"
    echo -e "${GREEN}✅ $service déplacé et renommé en $service.bak${NC}"
  else
    echo -e "${YELLOW}⚠️ $service non trouvé, ignoré${NC}"
  fi
done

# Création d'un fichier README dans le répertoire de backup
cat > "$BACKUP_DIR/README.md" << EOL
# Services FloDrama sauvegardés

Ce répertoire contient les services redondants qui ont été remplacés par les services unifiés.

## Liste des services sauvegardés

$(for service in "${REDUNDANT_SERVICES[@]}"; do echo "- \`$service\`"; done)

## Date de sauvegarde

$(date)

## Identité visuelle FloDrama

- Bleu signature : #3b82f6
- Fuchsia accent : #d946ef
- Dégradé signature : linear-gradient(to right, #3b82f6, #d946ef)
- Fond principal : #121118 (noir profond)
- Fond secondaire : #1A1926

## Comment restaurer

Pour restaurer un service, copiez-le depuis ce répertoire vers le répertoire \`src/services\`.
EOL

echo -e "${GREEN}✅ Fichier README créé dans le répertoire de backup${NC}"

# Vérification des imports dans les fichiers JavaScript/JSX
echo -e "${BLUE}🔍 Vérification des imports dans les fichiers JavaScript/JSX...${NC}"

FILES_WITH_OLD_IMPORTS=$(grep -r --include="*.js" --include="*.jsx" -l "import.*ScrapingService\|import.*videoScraper\|import.*AdaptiveScraperService" "$BASE_DIR/src")

if [ -n "$FILES_WITH_OLD_IMPORTS" ]; then
  echo -e "${YELLOW}⚠️ Les fichiers suivants contiennent encore des imports vers les anciens services:${NC}"
  echo "$FILES_WITH_OLD_IMPORTS"
  echo -e "${YELLOW}⚠️ Veuillez mettre à jour ces imports pour utiliser les services unifiés.${NC}"
  echo -e "${YELLOW}⚠️ Exemple: import { unifiedScrapingService } from './services';${NC}"
else
  echo -e "${GREEN}✅ Aucun import vers les anciens services trouvé${NC}"
fi

# Création d'un fichier de migration pour les développeurs
cat > "$SERVICES_DIR/MIGRATION.md" << EOL
# Migration vers les services unifiés FloDrama

Ce document explique comment migrer du code utilisant les anciens services vers les nouveaux services unifiés.

## Services unifiés

- \`unifiedScrapingService\` : Remplace ScrapingService, SmartScrapingService, AdaptiveScraperService et videoScraper
- \`unifiedImageService\` : Centralise toutes les fonctionnalités de gestion d'images

## Comment migrer

### Ancien code

\`\`\`javascript
import ScrapingService from './services/ScrapingService';
// ou
import SmartScrapingService from './services/SmartScrapingService';
// ou
import AdaptiveScraperService from './services/AdaptiveScraperService';
// ou
import videoScraper from './services/videoScraper';

// Utilisation
const metadata = await ScrapingService.getContentMetadata(id);
const videoLinks = await videoScraper.getVideoLinks(id);
\`\`\`

### Nouveau code

\`\`\`javascript
import { unifiedScrapingService } from './services';

// Utilisation
const metadata = await unifiedScrapingService.getContentMetadata(id);
const videoLinks = await unifiedScrapingService.getVideoLinks(id);
\`\`\`

## Identité visuelle FloDrama

Assurez-vous de respecter l'identité visuelle de FloDrama dans tous les composants:

- Bleu signature : #3b82f6
- Fuchsia accent : #d946ef
- Dégradé signature : linear-gradient(to right, #3b82f6, #d946ef)
- Fond principal : #121118 (noir profond)
- Fond secondaire : #1A1926
- Police principale : SF Pro Display
- Coins arrondis : 8px
- Transitions : 0.3s ease
EOL

echo -e "${GREEN}✅ Fichier de migration créé: $SERVICES_DIR/MIGRATION.md${NC}"

# Résumé
echo ""
echo -e "${BLUE}📊 Résumé des opérations:${NC}"
echo -e "${GREEN}✅ ${#REDUNDANT_SERVICES[@]} services redondants déplacés vers le répertoire de backup${NC}"
echo -e "${GREEN}✅ Fichier README créé dans le répertoire de backup${NC}"
echo -e "${GREEN}✅ Fichier de migration créé pour aider les développeurs${NC}"

echo ""
echo -e "${FUCHSIA}🎉 Nettoyage terminé avec succès!${NC}"
echo -e "${BLUE}🔹 FloDrama utilise maintenant les services unifiés${NC}"
echo -e "${FUCHSIA}🔹 L'identité visuelle avec le dégradé signature bleu-fuchsia (#3b82f6 → #d946ef) est préservée${NC}"
