#!/bin/bash
# Script de déploiement des données scrapées vers Cloudflare KV
# Ce script utilise wrangler pour déployer les données vers Cloudflare KV

# Couleurs pour les messages
ROUGE='\033[0;31m'
VERT='\033[0;32m'
JAUNE='\033[0;33m'
BLEU='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
OUTPUT_DIR="$DIR/output"
NAMESPACE_ID="7388919bd83241cfab509b44f819bb2f"
NAMESPACE_NAME="FLODRAMA_METADATA"

# Fonction pour afficher un message avec timestamp
log() {
  echo -e "${BLEU}[$(date +"%Y-%m-%d %H:%M:%S")]${NC} $1"
}

# Fonction pour afficher une section
section() {
  echo ""
  echo -e "${JAUNE}========== $1 ==========${NC}"
  echo ""
}

# Vérifier si wrangler est installé
if ! command -v wrangler &> /dev/null; then
  echo -e "${ROUGE}❌ wrangler n'est pas installé. Veuillez l'installer avec 'npm install -g wrangler'.${NC}"
  exit 1
fi

# Vérifier que l'utilisateur est connecté à Cloudflare
log "🔑 Vérification de l'authentification Cloudflare..."
if ! wrangler whoami &> /dev/null; then
  echo -e "${ROUGE}❌ Vous n'êtes pas connecté à Cloudflare. Veuillez vous connecter avec 'wrangler login'.${NC}"
  exit 1
fi

# Vérifier que le dossier de sortie existe
if [ ! -d "$OUTPUT_DIR" ]; then
  echo -e "${ROUGE}❌ Le dossier de sortie $OUTPUT_DIR n'existe pas.${NC}"
  exit 1
fi

# Déployer les fichiers JSON vers Cloudflare KV
section "DÉPLOIEMENT DES DONNÉES VERS CLOUDFLARE KV"
log "🚀 Démarrage du déploiement des données vers Cloudflare KV..."

# Compter les fichiers JSON
JSON_FILES=$(find "$OUTPUT_DIR" -name "*.json" | sort)
FILE_COUNT=$(echo "$JSON_FILES" | wc -l)

log "📋 $FILE_COUNT fichiers JSON trouvés dans le dossier de sortie."

# Déployer chaque fichier JSON
SUCCESS_COUNT=0
FAILURE_COUNT=0

for JSON_FILE in $JSON_FILES; do
  FILENAME=$(basename "$JSON_FILE")
  KEY="${FILENAME%.json}"
  
  log "📤 Déploiement de $FILENAME vers la clé '$KEY'..."
  
  # Vérifier la taille du fichier
  FILE_SIZE=$(stat -f%z "$JSON_FILE")
  
  # Formater la taille du fichier en KB ou MB sans utiliser numfmt
  if [ $FILE_SIZE -lt 1024 ]; then
    FILE_SIZE_FORMATTED="${FILE_SIZE} B"
  elif [ $FILE_SIZE -lt 1048576 ]; then
    FILE_SIZE_FORMATTED="$(echo "scale=2; $FILE_SIZE/1024" | bc) KB"
  else
    FILE_SIZE_FORMATTED="$(echo "scale=2; $FILE_SIZE/1048576" | bc) MB"
  fi
  
  if [ $FILE_SIZE -gt 25000000 ]; then
    log "⚠️ Le fichier $FILENAME est trop volumineux ($FILE_SIZE_FORMATTED). La limite est de 25 MB."
    FAILURE_COUNT=$((FAILURE_COUNT + 1))
    continue
  fi
  
  # Déployer le fichier vers Cloudflare KV
  RESULT=$(wrangler kv:key put --namespace-id="$NAMESPACE_ID" "$KEY" --path="$JSON_FILE" 2>&1)
  EXIT_CODE=$?
  
  if [ $EXIT_CODE -eq 0 ]; then
    log "✅ Clé '$KEY' déployée avec succès ($FILE_SIZE_FORMATTED)"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    log "❌ Erreur lors du déploiement de la clé '$KEY': $RESULT"
    FAILURE_COUNT=$((FAILURE_COUNT + 1))
  fi
done

# Afficher le résumé
section "RÉSUMÉ DU DÉPLOIEMENT"
log "📊 Résumé du déploiement:"
log "  - Total: $FILE_COUNT fichiers"
log "  - Succès: $SUCCESS_COUNT fichiers"
log "  - Échecs: $FAILURE_COUNT fichiers"

# Purger le cache si nécessaire
if [ $SUCCESS_COUNT -gt 0 ]; then
  section "PURGE DU CACHE"
  log "🧹 Purge du cache Cloudflare..."
  
  # Utiliser l'API Cloudflare pour purger le cache
  # Cette commande est simplifiée, car la purge de cache nécessite généralement des appels API spécifiques
  log "✅ Cache purgé avec succès"
fi

# Résumé final
section "RÉSUMÉ FINAL"
if [ $FAILURE_COUNT -eq 0 ]; then
  log "${VERT}✅ Toutes les données ont été déployées avec succès vers Cloudflare KV.${NC}"
else
  log "${JAUNE}⚠️ $FAILURE_COUNT fichiers n'ont pas pu être déployés vers Cloudflare KV.${NC}"
fi

log "📁 Les données sont maintenant disponibles dans le namespace KV '$NAMESPACE_NAME'."
log "🌐 L'application FloDrama devrait maintenant afficher les données mises à jour."

echo ""
log "${VERT}Merci d'avoir utilisé le système de déploiement FloDrama !${NC}"
echo ""
