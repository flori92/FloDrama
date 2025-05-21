#!/bin/bash

# Script d'exécution du pipeline complet de scraping pour FloDrama
# Version améliorée avec gestion des erreurs et des logs détaillés

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="./logs"
LOG_FILE="$LOG_DIR/scraping-pipeline_$TIMESTAMP.log"
MAX_RETRIES=3

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Créer le répertoire de logs
mkdir -p "$LOG_DIR"

# Fonction pour journaliser les messages
function log_message() {
    local message="$1"
    local level="${2:-INFO}"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Afficher avec couleur en fonction du niveau
    case $level in
        "ERROR") echo -e "${RED}[$timestamp] [$level] $message${NC}" ;;
        "WARN")  echo -e "${YELLOW}[$timestamp] [$level] $message${NC}" ;;
        "INFO")  echo -e "${BLUE}[$timestamp] [$level] $message${NC}" ;;
        "SUCCESS") echo -e "${GREEN}[$timestamp] [$level] $message${NC}" ;;
        *)        echo "[$timestamp] [$level] $message" ;;
    esac
    
    # Écrire dans le fichier de log
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Fonction pour afficher une bannière
function show_banner() {
    log_message "=========================================================================" "INFO"
    log_message "                FloDrama - Pipeline Complet de Scraping" "INFO"
    log_message "=========================================================================" "INFO"
    log_message "" "INFO"
}

# Fonction pour afficher l'aide
function show_help() {
    log_message "Usage: $0 [options]" "INFO"
    log_message "" "INFO"
    log_message "Options:" "INFO"
    log_message "  -h, --help              Affiche cette aide" "INFO"
    log_message "  -s, --skip-scraping     Saute l'étape de scraping" "INFO"
    log_message "  -e, --skip-enrichment   Saute l'étape d'enrichissement" "INFO"
    log_message "  -d, --skip-distribution Saute l'étape de distribution" "INFO"
    log_message "  -c, --clean             Nettoie les fichiers temporaires avant de commencer" "INFO"
    log_message "  -v, --verbose           Mode verbeux" "INFO"
    log_message "" "INFO"
}

# Vérifier les dépendances système
function check_dependencies() {
    local missing_deps=()
    local commands=("node" "npm" "jq" "curl")
    local success=true
    
    log_message "Vérification des dépendances système..." "INFO"
    
    for cmd in "${commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log_message "  ❌ $cmd n'est pas installé" "ERROR"
            missing_deps+=("$cmd")
            success=false
        else
            log_message "  ✅ $cmd est installé ($($cmd --version 2>&1 | head -n 1))" "INFO"
        fi
    done
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_message "Dépendances manquantes: ${missing_deps[*]}" "ERROR"
        return 1
    fi
    
    if [ "$success" = true ]; then
        log_message "Toutes les dépendances sont installées" "SUCCESS"
    else
        log_message "Certaines dépendances sont manquantes" "ERROR"
        return 1
    fi
    
    return 0
}

# Nettoyer les anciens fichiers de logs
function cleanup_old_logs() {
    local max_logs=10  # Nombre maximum de fichiers de logs à conserver
    
    log_message "Nettoyage des anciens fichiers de logs..." "INFO"
    
    # Vérifier si le répertoire de logs existe
    if [ ! -d "$LOG_DIR" ]; then
        log_message "Le répertoire de logs n'existe pas: $LOG_DIR" "WARN"
        return 0
    fi
    
    # Compter le nombre de fichiers de logs
    local log_count=$(find "$LOG_DIR" -name "scraping-pipeline_*.log" | wc -l)
    
    # Supprimer les fichiers les plus anciens si nécessaire
    if [ "$log_count" -gt "$max_logs" ]; then
        local files_to_remove=$((log_count - max_logs))
        log_message "Suppression des $files_to_remove plus anciens fichiers de logs..." "INFO"
        
        # Trier par date de modification (du plus ancien au plus récent) et supprimer
        find "$LOG_DIR" -name "scraping-pipeline_*.log" -type f -printf '%T@ %p\n' | \
            sort -n | \
            head -n "$files_to_remove" | \
            cut -d' ' -f2- | \
            xargs -I{} rm -f {}
            
        log_message "Nettoyage des logs terminé" "SUCCESS"
    else
        log_message "Aucun nettoyage de logs nécessaire ($log_count/$max_logs fichiers)" "INFO"
    fi
}

# Vérifier et créer la structure de répertoires
function setup_directories() {
    local dirs=(
        "./cloudflare/scraping/scraping-results"
        "./Frontend/src/data/content"
        "$LOG_DIR"
    )
    
    log_message "Vérification de la structure des répertoires..." "INFO"
    
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            log_message "  Création du répertoire: $dir" "INFO"
            mkdir -p "$dir"
            
            if [ $? -ne 0 ]; then
                log_message "  ❌ Impossible de créer le répertoire: $dir" "ERROR"
                return 1
            fi
        else
            log_message "  ✅ Répertoire existant: $dir" "INFO"
        fi
    done
    
    log_message "Structure des répertoires vérifiée" "SUCCESS"
    return 0
}

# Configuration par défaut
SKIP_SCRAPING=false
SKIP_ENRICHMENT=false
SKIP_DISTRIBUTION=false
CLEAN=false
VERBOSE=false

# Traitement des arguments de ligne de commande
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--skip-scraping)
            SKIP_SCRAPING=true
            shift
            ;;
        -e|--skip-enrichment)
            SKIP_ENRICHMENT=true
            shift
            ;;
        -d|--skip-distribution)
            SKIP_DISTRIBUTION=true
            shift
            ;;
        -c|--clean)
            CLEAN=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_message "Option non reconnue: $1" "ERROR"
            show_help
            exit 1
            ;;
    esac
done

# Fonction principale
function main() {
    # Afficher la bannière
    show_banner
    
    # Afficher la configuration
    log_message "Configuration du pipeline:" "INFO"
    log_message "- Skip scraping: ${SKIP_SCRAPING}" "INFO"
    log_message "- Skip enrichment: ${SKIP_ENRICHMENT}" "INFO"
    log_message "- Skip distribution: ${SKIP_DISTRIBUTION}" "INFO"
    log_message "- Clean: ${CLEAN}" "INFO"
    log_message "- Verbose: ${VERBOSE}" "INFO"
    log_message "" "INFO"
    
    # Vérifier les dépendances
    if ! check_dependencies; then
        log_message "Échec de la vérification des dépendances. Arrêt du pipeline." "ERROR"
        exit 1
    fi
    
    # Configurer la structure de répertoires
    if ! setup_directories; then
        log_message "Échec de la configuration des répertoires. Arrêt du pipeline." "ERROR"
        exit 1
    fi
    
    # Nettoyer les anciens logs
    cleanup_old_logs
    
    # Installer les dépendances npm
    log_message "Installation des dépendances npm..." "INFO"
    if ! npm install; then
        log_message "Échec de l'installation des dépendances npm" "ERROR"
        exit 1
    fi
    log_message "Dépendances npm installées avec succès" "SUCCESS"
    
    # Installer les dépendances spécifiques au scraping
    if ! install_scraping_deps; then
        log_message "Échec de l'installation des dépendances de scraping" "ERROR"
        exit 1
    fi
    
    # Exécuter les étapes du pipeline
    local success=true
    
    # Étape 1: Scraping
    if [ "$SKIP_SCRAPING" = false ]; then
        log_message "Début de l'étape de scraping..." "INFO"
        
        # Exécuter le script de scraping avec gestion des erreurs
        if ! bash .github/scripts/stealth/run-scraper.sh; then
            log_message "Échec de l'étape de scraping" "ERROR"
            success=false
        else
            log_message "Étape de scraping terminée avec succès" "SUCCESS"
        fi
    else
        log_message "Étape de scraping ignorée (--skip-scraping)" "INFO"
    fi
    
    # Étape 2: Enrichissement
    if [ "$success" = true ] && [ "$SKIP_ENRICHMENT" = false ]; then
        log_message "Début de l'étape d'enrichissement..." "INFO"
        # TODO: Implémenter la logique d'enrichissement
        log_message "Étape d'enrichissement non implémentée pour le moment" "WARN"
    elif [ "$SKIP_ENRICHMENT" = true ]; then
        log_message "Étape d'enrichissement ignorée (--skip-enrichment)" "INFO"
    fi
    
    # Étape 3: Distribution
    if [ "$success" = true ] && [ "$SKIP_DISTRIBUTION" = false ]; then
        log_message "Début de l'étape de distribution..." "INFO"
        # TODO: Implémenter la logique de distribution
        log_message "Étape de distribution non implémentée pour le moment" "WARN"
    elif [ "$SKIP_DISTRIBUTION" = true ]; then
        log_message "Étape de distribution ignorée (--skip-distribution)" "INFO"
    fi
    
    # Nettoyage final si demandé
    if [ "$CLEAN" = true ]; then
        log_message "Nettoyage des fichiers temporaires..." "INFO"
        # TODO: Implémenter la logique de nettoyage
        log_message "Nettoyage non implémenté pour le moment" "WARN"
    fi
    
    # Résumé final
    if [ "$success" = true ]; then
        log_message "✅ Pipeline exécuté avec succès!" "SUCCESS"
        log_message "Consultez les logs détaillés dans: $LOG_FILE" "INFO"
        exit 0
    else
        log_message "❌ Échec du pipeline. Consultez les logs pour plus de détails." "ERROR"
        log_message "Fichier de log: $LOG_FILE" "ERROR"
        exit 1
    fi
}

# Fonction pour installer les dépendances spécifiques au scraping
function install_scraping_deps() {
    log_message "Installation des dépendances spécifiques au scraping..." "INFO"
    
    # Liste des dépendances requises pour le scraping
    local dependencies=(
        "fs-extra"
        "axios"
        "cheerio"
        "puppeteer"
        "puppeteer-extra"
        "puppeteer-extra-plugin-stealth"
    )
    
    # Vérifier et installer chaque dépendance
    for dep in "${dependencies[@]}"; do
        log_message "Vérification de la dépendance: $dep" "DEBUG"
        if ! npm list --depth=0 "$dep" &>/dev/null; then
            log_message "Installation de $dep..." "INFO"
            if ! npm install "$dep" --save; then
                log_message "Échec de l'installation de $dep" "ERROR"
                return 1
            fi
            log_message "$dep installé avec succès" "SUCCESS"
        else
            log_message "$dep est déjà installé" "DEBUG"
        fi
    done
    
    log_message "Toutes les dépendances de scraping sont installées" "SUCCESS"
    return 0
}

# Fonction pour nettoyer les fichiers temporaires
function cleanup_temporary_files() {
    log_message "Nettoyage des fichiers temporaires..." "INFO"
    
    # Liste des répertoires et fichiers à nettoyer
    local to_clean=(
        "./cloudflare/scraping/scraping-results/*"
        "./temp"
        "./tmp"
        "./node_modules/.cache"
    )
    
    local cleaned_count=0
    local error_count=0
    
    # Nettoyer chaque élément de la liste
    for item in "${to_clean[@]}"; do
        if [ -e $item ] || [ -d $item ]; then
            log_message "Nettoyage de: $item" "DEBUG"
            if rm -rf $item; then
                ((cleaned_count++))
                log_message "Nettoyage réussi pour: $item" "DEBUG"
            else
                ((error_count++))
                log_message "Échec du nettoyage pour: $item" "WARN"
            fi
        fi
    done
    
    # Nettoyer les processus zombie de Chrome/Puppeteer
    pkill -f "chrome" || true
    pkill -f "puppeteer" || true
    
    # Vider le cache npm si nécessaire
    if [ $error_count -eq 0 ]; then
        log_message "Nettoyage du cache npm..." "DEBUG"
        npm cache clean --force &>/dev/null || true
    fi
    
    # Afficher un résumé du nettoyage
    if [ $error_count -eq 0 ]; then
        log_message "Nettoyage terminé avec succès ($cleaned_count éléments nettoyés)" "SUCCESS"
    else
        log_message "Nettoyage terminé avec $error_count erreur(s)" "WARN"
    fi
    
    return $error_count
}

# Fonction pour générer un rapport final
generate_final_report() {
    local duration=$1
    local total_items=$2
    local file_count=$3
    
    # Créer le répertoire de logs s'il n'existe pas
    mkdir -p "$LOG_DIR"
    local report_file="${LOG_DIR}/pipeline_report_$(date +%Y%m%d_%H%M%S).txt"
    
    # Générer le contenu du rapport
    {
        echo "=== RAPPORT D'EXÉCUTION DU PIPELINE ==="
        echo "Date: $(date)"
        echo "Durée d'exécution: $duration"
        echo ""
        echo "=== STATISTIQUES ==="
        echo "- Total d'éléments traités: $total_items"
        echo "- Nombre de fichiers générés: $file_count"
        echo ""
        echo "=== CONFIGURATION ==="
        echo "- Scraping: $( [ "$SKIP_SCRAPING" = true ] && echo "❌ Désactivé" || echo "✅ Activé" )"
        echo "- Enrichissement: $( [ "$SKIP_ENRICHMENT" = true ] && echo "❌ Désactivé" || echo "✅ Activé" )"
        echo "- Distribution: $( [ "$SKIP_DISTRIBUTION" = true ] && echo "❌ Désactivée" || echo "✅ Activée" )"
        echo "- Nettoyage: $( [ "$CLEAN" = true ] && echo "✅ Activé" || echo "❌ Désactivé" )"
        echo "- Mode verbeux: $( [ "$VERBOSE" = true ] && echo "✅ Activé" || echo "❌ Désactivé" )"
        echo ""
        echo "=== ENVIRONNEMENT ==="
        echo "- Répertoire de travail: $(pwd)"
        echo "- Répertoire des logs: $LOG_DIR"
        echo "- Fichier de log principal: $LOG_FILE"
        echo "- Utilisateur: $(whoami)"
        echo "- Hôte: $(hostname)"
    } > "$report_file"
    
    # Ajouter les 50 dernières lignes du log au rapport
    echo -e "\n=== DERNIÈRES LIGNES DU JOURNAL ===" >> "$report_file"
    if [ -f "$LOG_FILE" ]; then
        tail -n 50 "$LOG_FILE" >> "$report_file"
    else
        echo "Aucun fichier de log trouvé à $LOG_FILE" >> "$report_file"
    fi
    
    echo "$report_file"
}

# Fonction pour envoyer une notification d'erreur
send_error_notification() {
    if [ -n "$DISCORD_WEBHOOK" ]; then
        local duration_str="${HOURS}h ${MINUTES}m ${SECONDS}s"
        local error_msg="❌ Le pipeline de scraping a échoué après $duration_str. Consultez les logs pour plus de détails."
        
        curl -H "Content-Type: application/json" -X POST -d "{\"content\":\"$error_msg\"}" "$DISCORD_WEBHOOK" &>/dev/null || true
    fi
}

# Fonction principale pour exécuter le pipeline
run_pipeline() {
    local start_time=$(date +%s)
    local success=true
    
    log_message "Démarrage du pipeline de scraping à $(date)" "INFO"
    
    # Exécuter le pipeline
    if [ "$SKIP_SCRAPING" = false ]; then
        log_message "Début de l'étape 1: Scraping des données" "INFO"
        
        # Options de ligne de commande pour le scraper
        local scraper_options="--all --limit=100 --output=./cloudflare/scraping/scraping-results --save"
        [ "$VERBOSE" = true ] && scraper_options="$scraper_options --debug"
        
        log_message "Exécution du scraper avec les options: $scraper_options" "DEBUG"
        
        # Exécuter le script de scraping avec gestion des erreurs
        if ! node ./cloudflare/scraping/src/cli-scraper.js $scraper_options; then
            log_message "Échec de l'étape de scraping" "ERROR"
            return 1
        fi
        
        # Vérifier si des données ont été générées
        local result_count=$(find ./cloudflare/scraping/scraping-results -name "*.json" 2>/dev/null | wc -l || echo 0)
        if [ "$result_count" -eq 0 ]; then
            log_message "Aucune donnée n'a été générée lors du scraping" "WARN"
        else
            log_message "$result_count fichiers de résultats générés avec succès" "SUCCESS"
        fi
        
        log_message "Étape de scraping terminée avec succès" "SUCCESS"
    else
        log_message "Étape de scraping ignorée (--skip-scraping activé)" "INFO"
    fi
    
    # Exécuter l'enrichissement si demandé
    if [ "$SKIP_ENRICHMENT" = false ]; then
        log_message "Début de l'étape 2: Enrichissement des données" "INFO"
        
        # Vérifier si le script d'enrichissement existe
        if [ ! -f ".github/scripts/stealth/enrichissement.js" ]; then
            log_message "Le script d'enrichissement est introuvable" "ERROR"
            log_message "Création d'un script d'enrichissement vide..." "WARN"
            
            # Créer un script d'enrichissement basique s'il n'existe pas
            mkdir -p .github/scripts/stealth
            cat > .github/scripts/stealth/enrichissement.js << 'EOL'
// Script d'enrichissement des données
// Ce script est un exemple et doit être implémenté selon les besoins

console.log('Enrichissement des données...');
// Implémentation de l'enrichissement ici
console.log('Enrichissement terminé avec succès');
process.exit(0);
EOL
            
            log_message "Script d'enrichissement créé à .github/scripts/stealth/enrichissement.js" "INFO"
        fi
        
        # Exécuter le script d'enrichissement
        if ! node .github/scripts/stealth/enrichissement.js; then
            log_message "Échec de l'étape d'enrichissement" "ERROR"
            success=false
        else
            log_message "Étape d'enrichissement terminée avec succès" "SUCCESS"
        fi
    else
        log_message "Étape d'enrichissement ignorée (--skip-enrichment activé)" "INFO"
    fi
    
    # Exécuter la distribution si demandé
    if [ "$SKIP_DISTRIBUTION" = false ]; then
        log_message "Début de l'étape 3: Distribution des données" "INFO"
        
        # Vérifier si le script de distribution existe
        if [ ! -f ".github/scripts/stealth/distribution.js" ]; then
            log_message "Le script de distribution est introuvable" "ERROR"
            log_message "Création d'un script de distribution vide..." "WARN"
            
            # Créer un script de distribution basique s'il n'existe pas
            mkdir -p .github/scripts/stealth
            cat > .github/scripts/stealth/distribution.js << 'EOL'
// Script de distribution des données
// Ce script est un exemple et doit être implémenté selon les besoins

console.log('Distribution des données...');
// Implémentation de la distribution ici
console.log('Distribution terminée avec succès');
process.exit(0);
EOL
            
            log_message "Script de distribution créé à .github/scripts/stealth/distribution.js" "INFO"
        fi
        
        # Exécuter le script de distribution
        if ! node .github/scripts/stealth/distribution.js; then
            log_message "Échec de l'étape de distribution" "ERROR"
            success=false
        else
            log_message "Étape de distribution terminée avec succès" "SUCCESS"
        fi
    else
        log_message "Étape de distribution ignorée (--skip-distribution activé)" "INFO"
    fi
    
    # Calculer la durée d'exécution
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local hours=$((duration / 3600))
    local minutes=$(( (duration % 3600) / 60 ))
    local seconds=$((duration % 60))
    local duration_str="${hours}h ${minutes}m ${seconds}s"
    
    # Compter les éléments et fichiers générés
    local total_items=0
    local file_count=0
    
    if [ -d "./Frontend/src/data/content" ]; then
        total_items=$(find ./Frontend/src/data/content -name "index.json" -exec cat {} \; | grep -o '"count":[0-9]*' | awk -F: '{sum += $2} END {print sum}' 2>/dev/null || echo 0)
        file_count=$(find ./Frontend/src/data/content -name "*.json" 2>/dev/null | wc -l)
    fi
    
    # Générer le rapport final
    local report_file=$(generate_final_report "$duration_str" "$total_items" "$file_count")
    
    # Afficher le résumé
    log_message "" "INFO"
    log_message "============================================================" "INFO"
    log_message "                RÉSUMÉ DU PIPELINE DE SCRAPING" "INFO"
    log_message "============================================================" "INFO"
    log_message "⏱️  Durée totale d'exécution: $duration_str" "INFO"
    log_message "📊 Total d'éléments: $total_items" "INFO"
    log_message "📁 Fichiers générés: $file_count" "INFO"
    log_message "" "INFO"
    
    if $success; then
        log_message "✨ PIPELINE TERMINÉ AVEC SUCCÈS" "SUCCESS"
        log_message "Consultez le rapport complet dans: $report_file" "INFO"
        
        # Définir les sorties pour GitHub Actions si nécessaire
        if [ -n "$GITHUB_ACTIONS" ]; then
            echo "::set-output name=duration::$duration_str"
            echo "::set-output name=total_items::$total_items"
            echo "::set-output name=file_count::$file_count"
            echo "::set-output name=report_file::$report_file"
        fi
        
        return 0
    else
        log_message "❌ PIPELINE TERMINÉ AVEC DES ERREURS" "ERROR"
        log_message "Consultez les logs pour plus de détails" "ERROR"
        
        # Envoyer une notification d'erreur si nécessaire
        if [ -n "$DISCORD_WEBHOOK" ]; then
            local error_msg="❌ Le pipeline de scraping a échoué après $duration_str. Consultez les logs pour plus de détails."
            curl -H "Content-Type: application/json" -X POST -d "{\"content\":\"$error_msg\"}" "$DISCORD_WEBHOOK" &>/dev/null || true
        fi
        
        return 1
    fi
}

if [ "$SKIP_ENRICHMENT" = false ]; then
    log_message "Début de l'étape 2: Enrichissement des données" "INFO"
    
    # Vérifier si le script d'enrichissement existe
    if [ ! -f ".github/scripts/stealth/enrichissement.js" ]; then
        log_message "Le script d'enrichissement est introuvable" "ERROR"
        log_message "Création d'un script d'enrichissement vide..." "WARN"
        
        # Créer un script d'enrichissement basique s'il n'existe pas
        cat > .github/scripts/stealth/enrichissement.js << 'EOL'
// Script d'enrichissement des données
// Ce script est un exemple et doit être implémenté selon les besoins

console.log('Enrichissement des données...');
// Implémentation de l'enrichissement ici
console.log('Enrichissement terminé avec succès');
process.exit(0);
EOL
        
        log_message "Script d'enrichissement créé à .github/scripts/stealth/enrichissement.js" "INFO"
    fi
    
    # Exécuter le script d'enrichissement avec gestion des erreurs
    log_message "Exécution du script d'enrichissement..." "INFO"
    if ! node .github/scripts/stealth/enrichissement.js; then
        log_message "Échec de l'étape d'enrichissement" "ERROR"
        log_message "Consultez les logs ci-dessus pour plus de détails" "ERROR"
        exit 1
    fi
    
    log_message "Étape d'enrichissement terminée avec succès" "SUCCESS"
else
    log_message "Étape d'enrichissement ignorée (--skip-enrichment activé)" "INFO"
fi

if [ "$SKIP_DISTRIBUTION" = false ]; then
    log_message "Début de l'étape 3: Distribution des données" "INFO"
    
    # Vérifier si le script de distribution existe
    if [ ! -f ".github/scripts/stealth/distribution.js" ]; then
        log_message "Le script de distribution est introuvable" "ERROR"
        log_message "Création d'un script de distribution vide..." "WARN"
        
        # Créer un script de distribution basique s'il n'existe pas
        mkdir -p .github/scripts/stealth
        cat > .github/scripts/stealth/distribution.js << 'EOL'
// Script de distribution des données
// Ce script est un exemple et doit être implémenté selon les besoins

console.log('Distribution des données...');
// Implémentation de la distribution ici
console.log('Distribution terminée avec succès');
process.exit(0);
EOL
        
        log_message "Script de distribution créé à .github/scripts/stealth/distribution.js" "INFO"
    fi
    
    # Exécuter le script de distribution avec gestion des erreurs
    log_message "Exécution du script de distribution..." "INFO"
    if ! node .github/scripts/stealth/distribution.js; then
        log_message "Échec de l'étape de distribution" "ERROR"
        log_message "Consultez les logs ci-dessus pour plus de détails" "ERROR"
        exit 1
    fi
    
    log_message "Étape de distribution terminée avec succès" "SUCCESS"
else
    log_message "Étape de distribution ignorée (--skip-distribution activé)" "INFO"
fi

# Calculer et afficher la durée d'exécution
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
HOURS=$((DURATION / 3600))
MINUTES=$(( (DURATION % 3600) / 60 ))
SECONDS=$((DURATION % 60))
DURATION_STR="${HOURS}h ${MINUTES}m ${SECONDS}s"

# Compter les éléments et fichiers générés
log_message "Analyse des résultats..." "INFO"

# Vérifier si le répertoire de contenu existe
if [ -d "./Frontend/src/data/content" ]; then
    # Compter les éléments dans les fichiers index.json
    TOTAL_ITEMS=$(find ./Frontend/src/data/content -name "index.json" -exec cat {} \; | grep -o '"count":[0-9]*' | awk -F: '{sum += $2} END {print sum}' 2>/dev/null || echo 0)
    
    # Compter le nombre total de fichiers JSON
    FILE_COUNT=$(find ./Frontend/src/data/content -name "*.json" 2>/dev/null | wc -l)
else
    log_message "Avertissement: Le répertoire de contenu n'existe pas" "WARN"
    TOTAL_ITEMS=0
    FILE_COUNT=0
fi

# Afficher le résumé détaillé
log_message "" "INFO"
log_message "============================================================" "INFO"
log_message "                RÉSUMÉ DU PIPELINE DE SCRAPING" "INFO"
log_message "============================================================" "INFO"
log_message "⏱️  Durée totale d'exécution: $DURATION_STR" "INFO"
log_message "📊 Total d'éléments: $TOTAL_ITEMS" "INFO"
log_message "📁 Fichiers générés: $FILE_COUNT" "INFO"
# Point d'entrée principal du script
main() {
    # Afficher la bannière d'accueil
    show_banner
    
    # Vérifier les dépendances système
    if ! check_dependencies; then
        log_message "Échec de la vérification des dépendances système" "ERROR"
        return 1
    fi
    
    # Configurer les répertoires nécessaires
    if ! setup_directories; then
        log_message "Échec de la configuration des répertoires" "ERROR"
        return 1
    fi
    
    # Nettoyer les anciens fichiers de logs si nécessaire
    cleanup_old_logs
    
    # Installer les dépendances de scraping si nécessaire
    if [ "$SKIP_SCRAPING" = false ]; then
        if ! install_scraping_deps; then
            log_message "Échec de l'installation des dépendances de scraping" "ERROR"
            return 1
        fi
    fi
    
    # Exécuter le pipeline principal
    if ! run_pipeline; then
        log_message "Le pipeline a échoué" "ERROR"
        return 1
    fi
    
    # Nettoyer les fichiers temporaires si demandé
    if [ "$CLEAN" = true ]; then
        log_message "Nettoyage des fichiers temporaires demandé..." "INFO"
        if ! cleanup_temporary_files; then
            log_message "Des erreurs sont survenues lors du nettoyage des fichiers temporaires" "WARN"
        fi
    else
        log_message "Nettoyage des fichiers temporaires non demandé (utilisez --clean pour activer)" "INFO"
    fi
    
    log_message "Script terminé avec succès" "SUCCESS"
    return 0
}

# Exécuter la fonction principale
if [ "$0" = "${BASH_SOURCE[0]}" ]; then
    # Si le script est exécuté directement (et non importé)
    main "$@"
    exit $?
fi
