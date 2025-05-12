#!/bin/bash
# Script d'extraction robuste avec rotation de domaines
# Développé le 2025-05-12
# Utilise l'extracteur de nouvelle génération pour contourner les protections anti-bot avancées

# Configuration des couleurs pour l'affichage
ROUGE='\033[0;31m'
VERT='\033[0;32m'
JAUNE='\033[0;33m'
BLEU='\033[0;34m'
RESET='\033[0m'

# Dossier racine du projet
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJET_DIR="$SCRIPT_DIR"
NODE_MODULES="$PROJET_DIR/node_modules"

# Configuration des dossiers de sortie
SORTIE_DIR="$PROJET_DIR/extraction-robuste"
LOGS_DIR="$PROJET_DIR/logs"

# S'assurer que les dossiers existent
mkdir -p "$SORTIE_DIR"
mkdir -p "$LOGS_DIR"

# Configuration des sources par catégorie
DRAMAS=(
  "dramacool"
  "viewasian"
  "kissasian"
  "voirdrama"
)

ANIMES=(
  "gogoanime"
  "nekosama"
  "voiranime"
)

FILMS=(
  "vostfree"
  "streamingdivx"
  "filmcomplet"
)

BOLLYWOOD=(
  "bollyplay"
  "hindilinks4u"
)

# Configuration des limites
LIMITE_DRAMAS=300
LIMITE_ANIMES=300
LIMITE_FILMS=200
LIMITE_BOLLYWOOD=150

# Configuration des tentatives
MAX_TENTATIVES=3
DELAI_TENTATIVES=10

# Configuration du délai entre sources (secondes)
DELAI_ENTRE_SOURCES=30

# Timestamp pour le rapport
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
RAPPORT="$LOGS_DIR/rapport-extraction_$TIMESTAMP.json"

# Fonction principale d'extraction
extraire_contenu() {
  local categorie=$1
  local source=$2
  local limite=$3
  local timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
  
  echo -e "${BLEU}[$(date +"%Y-%m-%d %H:%M:%S")] 📥 Début de l'extraction depuis ${source} (limite: ${limite})...${RESET}"
  
  # Créer le dossier de sortie pour la catégorie
  local sortie_categorie="$SORTIE_DIR/$categorie"
  mkdir -p "$sortie_categorie"
  
  # Créer le dossier de sortie pour la source
  local sortie_source="$sortie_categorie/$source"
  mkdir -p "$sortie_source"
  
  # Fichier log spécifique à cette exécution
  local log_file="$LOGS_DIR/${source}_${timestamp}.log"
  
  # Nombre de tentatives
  local tentative=1
  local succes=false
  
  while [ $tentative -le $MAX_TENTATIVES ] && [ "$succes" != "true" ]; do
    echo -e "${JAUNE}[$(date +"%Y-%m-%d %H:%M:%S")] 🔄 Tentative d'extraction ($tentative/$MAX_TENTATIVES)...${RESET}"
    
    # Lancer l'extraction avec le nouvel extracteur
    node "$PROJET_DIR/src/run-next-gen-extractor.js" \
      --source="$source" \
      --category="$categorie" \
      --limit="$limite" \
      --output="$sortie_source" \
      2>&1 | tee -a "$log_file"
    
    # Vérifier si l'extraction a réussi
    local exit_code=${PIPESTATUS[0]}
    
    if [ $exit_code -eq 0 ]; then
      # Compter le nombre de fichiers extraits
      local fichiers_extraits=$(find "$sortie_source" -type f -name "*.json" | wc -l | tr -d ' ')
      
      if [ "$fichiers_extraits" -gt 0 ]; then
        echo -e "${VERT}[$(date +"%Y-%m-%d %H:%M:%S")] ✅ Extraction réussie: $fichiers_extraits fichiers extraits de $source${RESET}"
        succes=true
        
        # Ajouter au rapport
        echo "{\"source\":\"$source\",\"category\":\"$categorie\",\"timestamp\":\"$(date +"%Y-%m-%dT%H:%M:%S")\",\"files_extracted\":$fichiers_extraits,\"status\":\"success\"}" >> "$RAPPORT"
        
        break
      else
        echo -e "${JAUNE}[$(date +"%Y-%m-%d %H:%M:%S")] ⚠️ Aucun fichier extrait. Nouvel essai...${RESET}"
        
        # Attendre avant le prochain essai
        echo -e "${JAUNE}[$(date +"%Y-%m-%d %H:%M:%S")] ⏳ Attente avant le prochain essai (${DELAI_TENTATIVES}s)...${RESET}"
        sleep $DELAI_TENTATIVES
      fi
    else
      echo -e "${ROUGE}[$(date +"%Y-%m-%d %H:%M:%S")] ❌ Échec de l'extraction depuis $source (code: $exit_code). Nouvel essai...${RESET}"
      
      # Attendre avant le prochain essai
      echo -e "${JAUNE}[$(date +"%Y-%m-%d %H:%M:%S")] ⏳ Attente avant le prochain essai (${DELAI_TENTATIVES}s)...${RESET}"
      sleep $DELAI_TENTATIVES
    fi
    
    tentative=$((tentative + 1))
  done
  
  if [ "$succes" != "true" ]; then
    echo -e "${ROUGE}[$(date +"%Y-%m-%d %H:%M:%S")] ❌ Échec définitif de l'extraction depuis $source après $MAX_TENTATIVES tentatives${RESET}"
    # Ajouter au rapport
    echo "{\"source\":\"$source\",\"category\":\"$categorie\",\"timestamp\":\"$(date +"%Y-%m-%dT%H:%M:%S")\",\"files_extracted\":0,\"status\":\"failed\"}" >> "$RAPPORT"
  fi
  
  # Pause entre les sources pour éviter la détection
  echo -e "${JAUNE}[$(date +"%Y-%m-%d %H:%M:%S")] ⏳ Pause de ${DELAI_ENTRE_SOURCES}s avant la prochaine source...${RESET}"
  sleep $DELAI_ENTRE_SOURCES
}

# Fonction de traitement d'une catégorie
traiter_categorie() {
  local categorie=$1
  local sources=("${@:2:$#-2}") # Tous les arguments sauf le premier et le dernier
  local limite=${!#} # Le dernier argument
  
  echo -e "\n${VERT}========== EXTRACTION DE CONTENU: $categorie ==========${RESET}\n"
  
  local sources_reussies=0
  local sources_echec=0
  
  for source in "${sources[@]}"; do
    extraire_contenu "$categorie" "$source" "$limite"
    
    # Compter succès/échec
    local fichiers=$(find "$SORTIE_DIR/$categorie/$source" -type f -name "*.json" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$fichiers" -gt 0 ]; then
      sources_reussies=$((sources_reussies + 1))
    else
      sources_echec=$((sources_echec + 1))
    fi
  done
  
  # Bilan de la catégorie
  echo -e "${BLEU}[$(date +"%Y-%m-%d %H:%M:%S")] 📊 Bilan de l'extraction pour $categorie:${RESET}"
  echo -e "${BLEU}[$(date +"%Y-%m-%d %H:%M:%S")]   - Sources traitées avec succès: $sources_reussies${RESET}"
  echo -e "${BLEU}[$(date +"%Y-%m-%d %H:%M:%S")]   - Sources en échec: $sources_echec${RESET}"
}

# Vérification de Node.js et des dépendances
if ! command -v node &> /dev/null; then
  echo -e "${ROUGE}Node.js n'est pas installé. Veuillez l'installer avant de continuer.${RESET}"
  exit 1
fi

if [ ! -d "$NODE_MODULES" ]; then
  echo -e "${JAUNE}Installation des dépendances...${RESET}"
  cd "$PROJET_DIR" && npm install
fi

# Créer le fichier de rapport
echo "[" > "$RAPPORT"

# Affichage de l'en-tête
echo -e "\n${VERT}========== DÉMARRAGE DE L'EXTRACTION ROBUSTE ==========${RESET}\n"

# Afficher les configurations
echo -e "${BLEU}[$(date +"%Y-%m-%d %H:%M:%S")] 📝 Configurations:${RESET}"
echo -e "${BLEU}[$(date +"%Y-%m-%d %H:%M:%S")]   - Limite dramas: $LIMITE_DRAMAS${RESET}"
echo -e "${BLEU}[$(date +"%Y-%m-%d %H:%M:%S")]   - Limite animes: $LIMITE_ANIMES${RESET}"
echo -e "${BLEU}[$(date +"%Y-%m-%d %H:%M:%S")]   - Limite films: $LIMITE_FILMS${RESET}"
echo -e "${BLEU}[$(date +"%Y-%m-%d %H:%M:%S")]   - Limite bollywood: $LIMITE_BOLLYWOOD${RESET}"
echo -e "${BLEU}[$(date +"%Y-%m-%d %H:%M:%S")]   - Tentatives par source: $MAX_TENTATIVES${RESET}"
echo -e "${BLEU}[$(date +"%Y-%m-%d %H:%M:%S")]   - Délai entre sources: ${DELAI_ENTRE_SOURCES}s${RESET}"

# Traiter chaque catégorie
traiter_categorie "dramas" "${DRAMAS[@]}" "$LIMITE_DRAMAS"
traiter_categorie "animes" "${ANIMES[@]}" "$LIMITE_ANIMES"
traiter_categorie "films" "${FILMS[@]}" "$LIMITE_FILMS"
traiter_categorie "bollywood" "${BOLLYWOOD[@]}" "$LIMITE_BOLLYWOOD"

# Fermer le fichier de rapport
sed -i '' -e '$ s/,$//' "$RAPPORT"  # Supprimer la virgule finale
echo "]" >> "$RAPPORT"

# Bilan final
total_fichiers=$(find "$SORTIE_DIR" -type f -name "*.json" | wc -l | tr -d ' ')

# Affichage de la conclusion
echo -e "\n${VERT}========== BILAN DE L'EXTRACTION ROBUSTE ==========${RESET}\n"
echo -e "${VERT}[$(date +"%Y-%m-%d %H:%M:%S")] ✅ Extraction robuste terminée${RESET}"
echo -e "${VERT}[$(date +"%Y-%m-%d %H:%M:%S")] 📁 Résultats disponibles dans: $SORTIE_DIR${RESET}"
echo -e "${VERT}[$(date +"%Y-%m-%d %H:%M:%S")] 📝 Logs disponibles dans: $LOGS_DIR${RESET}"
echo -e "${VERT}[$(date +"%Y-%m-%d %H:%M:%S")] 📊 Nombre total de fichiers extraits: $total_fichiers${RESET}"
echo -e "${VERT}[$(date +"%Y-%m-%d %H:%M:%S")] 📋 Rapport complet: $RAPPORT${RESET}"
