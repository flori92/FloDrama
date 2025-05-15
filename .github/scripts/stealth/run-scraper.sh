#!/bin/bash

# Script d'exécution du scraping pour FloDrama
# Ce script utilise les outils de scraping éprouvés pour contourner
# les protections Cloudflare et récupérer des milliers de contenus réels

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Répertoire de sortie
OUTPUT_DIR="./Frontend/src/data/content"
TEMP_DIR="./cloudflare/scraping/scraping-results"

# Créer les répertoires nécessaires
mkdir -p "$OUTPUT_DIR"
mkdir -p "$TEMP_DIR"

# Liste des sources par catégorie
DRAMA_SOURCES=("mydramalist" "dramacool" "voirdrama" "asianwiki")
ANIME_SOURCES=("voiranime" "nekosama" "animesama" "animevostfr")
FILM_SOURCES=("vostfree" "streamingdivx" "filmcomplet")
BOLLYWOOD_SOURCES=("bollyplay" "hindilinks4u")

# Fonction pour afficher une bannière
function show_banner() {
    echo -e "${BLUE}=========================================================================${NC}"
    echo -e "${BLUE}                FloDrama - Scraping avec Contournement Cloudflare${NC}"
    echo -e "${BLUE}=========================================================================${NC}"
    echo ""
}

# Fonction pour scraper une source
function scrape_source() {
    local source=$1
    local category=$2
    
    echo -e "${YELLOW}🔍 Scraping de ${source} (catégorie: ${category})...${NC}"
    
    # Exécuter le scraper CLI avec les options appropriées
    node ./cloudflare/scraping/src/cli-scraper.js --source=$source --limit=100 --output=$TEMP_DIR --debug --save
    
    # Vérifier si le scraping a réussi
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Scraping de ${source} terminé avec succès${NC}"
        return 0
    else
        echo -e "${RED}❌ Échec du scraping de ${source}${NC}"
        return 1
    fi
}

# Fonction pour copier les résultats vers le répertoire de sortie
function process_results() {
    local category=$1
    local output_category_dir="$OUTPUT_DIR/$category"
    
    echo -e "${YELLOW}📦 Traitement des résultats pour la catégorie ${category}...${NC}"
    
    # Créer le répertoire de catégorie s'il n'existe pas
    mkdir -p "$output_category_dir"
    
    # Trouver tous les fichiers JSON dans le répertoire temporaire
    local files=$(find "$TEMP_DIR" -name "*.json" -type f)
    local items=()
    local count=0
    
    # Parcourir tous les fichiers
    for file in $files; do
        # Extraire le nom de la source du nom de fichier
        local source=$(basename "$file" .json)
        
        # Vérifier si la source appartient à la catégorie
        if [[ " ${DRAMA_SOURCES[@]} " =~ " ${source} " && "$category" == "drama" ]] || \
           [[ " ${ANIME_SOURCES[@]} " =~ " ${source} " && "$category" == "anime" ]] || \
           [[ " ${FILM_SOURCES[@]} " =~ " ${source} " && "$category" == "film" ]] || \
           [[ " ${BOLLYWOOD_SOURCES[@]} " =~ " ${source} " && "$category" == "bollywood" ]]; then
            
            echo -e "${BLUE}📄 Traitement du fichier ${file} pour la catégorie ${category}...${NC}"
            
            # Lire le fichier JSON et extraire les éléments
            local content=$(cat "$file")
            local file_items=$(echo "$content" | jq -c '.data[]? // .results[]? // .[]?' 2>/dev/null)
            
            if [ -n "$file_items" ]; then
                # Ajouter les éléments à la liste
                while read -r item; do
                    # Ajouter la catégorie si elle n'est pas déjà présente
                    if [[ $(echo "$item" | jq -r '.content_type // .type // ""') == "" ]]; then
                        item=$(echo "$item" | jq --arg cat "$category" '. + {content_type: $cat}')
                    fi
                    items+=("$item")
                    ((count++))
                done <<< "$file_items"
                
                echo -e "${GREEN}✅ ${count} éléments extraits de ${file}${NC}"
            else
                echo -e "${RED}❌ Aucun élément trouvé dans ${file}${NC}"
            fi
        fi
    done
    
    if [ ${#items[@]} -gt 0 ]; then
        # Créer le fichier index.json
        echo -e "${YELLOW}📝 Création du fichier index.json pour ${category}...${NC}"
        local index_file="$output_category_dir/index.json"
        local json_content=$(printf '{"count":%d,"results":[%s],"updated_at":"%s"}' \
            ${#items[@]} \
            "$(IFS=,; echo "${items[*]}")" \
            "$(date -u +"%Y-%m-%dT%H:%M:%SZ")")
        
        echo "$json_content" | jq '.' > "$index_file"
        echo -e "${GREEN}✅ Fichier index.json créé avec ${#items[@]} éléments${NC}"
        
        # Créer le fichier trending.json (20 éléments les plus récents)
        echo -e "${YELLOW}📝 Création du fichier trending.json pour ${category}...${NC}"
        local trending_file="$output_category_dir/trending.json"
        local trending_content=$(echo "$json_content" | jq '.results = (.results | sort_by(-.year, -.rating) | .[0:20]) | .count = (.results | length)')
        
        echo "$trending_content" | jq '.' > "$trending_file"
        echo -e "${GREEN}✅ Fichier trending.json créé avec $(echo "$trending_content" | jq '.count') éléments${NC}"
        
        # Créer le fichier hero_banner.json (5 éléments avec backdrop et poster)
        echo -e "${YELLOW}📝 Création du fichier hero_banner.json pour ${category}...${NC}"
        local hero_file="$output_category_dir/hero_banner.json"
        local hero_content=$(echo "$json_content" | jq '.results = (.results | map(select(.backdrop != null and .poster != null)) | sort_by(-.year, -.rating) | .[0:5]) | .count = (.results | length)')
        
        echo "$hero_content" | jq '.' > "$hero_file"
        echo -e "${GREEN}✅ Fichier hero_banner.json créé avec $(echo "$hero_content" | jq '.count') éléments${NC}"
        
        return 0
    else
        echo -e "${RED}❌ Aucun élément trouvé pour la catégorie ${category}${NC}"
        return 1
    fi
}

# Fonction principale
function main() {
    show_banner
    
    # Statistiques
    local start_time=$(date +%s)
    local total_items=0
    local sources_processed=0
    local sources_failed=0
    
    # Scraper les sources de dramas
    echo -e "${BLUE}🎬 Scraping des sources de DRAMAS...${NC}"
    for source in "${DRAMA_SOURCES[@]}"; do
        if scrape_source "$source" "drama"; then
            ((sources_processed++))
        else
            ((sources_failed++))
        fi
    done
    
    # Scraper les sources d'animes
    echo -e "${BLUE}🎬 Scraping des sources d'ANIMES...${NC}"
    for source in "${ANIME_SOURCES[@]}"; do
        if scrape_source "$source" "anime"; then
            ((sources_processed++))
        else
            ((sources_failed++))
        fi
    done
    
    # Scraper les sources de films
    echo -e "${BLUE}🎬 Scraping des sources de FILMS...${NC}"
    for source in "${FILM_SOURCES[@]}"; do
        if scrape_source "$source" "film"; then
            ((sources_processed++))
        else
            ((sources_failed++))
        fi
    done
    
    # Scraper les sources de bollywood
    echo -e "${BLUE}🎬 Scraping des sources de BOLLYWOOD...${NC}"
    for source in "${BOLLYWOOD_SOURCES[@]}"; do
        if scrape_source "$source" "bollywood"; then
            ((sources_processed++))
        else
            ((sources_failed++))
        fi
    done
    
    # Traiter les résultats pour chaque catégorie
    local categories=("drama" "anime" "film" "bollywood")
    local category_counts=()
    
    for category in "${categories[@]}"; do
        if process_results "$category"; then
            local count=$(jq '.count' "$OUTPUT_DIR/$category/index.json")
            category_counts+=("\"$category\": $count")
            ((total_items += count))
        fi
    done
    
    # Créer le fichier global.json
    echo -e "${YELLOW}📝 Création du fichier global.json...${NC}"
    local global_file="$OUTPUT_DIR/global.json"
    local global_content=$(printf '{"total_items":%d,"categories":{%s},"updated_at":"%s"}' \
        $total_items \
        "$(IFS=,; echo "${category_counts[*]}")" \
        "$(date -u +"%Y-%m-%dT%H:%M:%SZ")")
    
    echo "$global_content" | jq '.' > "$global_file"
    echo -e "${GREEN}✅ Fichier global.json créé${NC}"
    
    # Calculer la durée totale
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local hours=$((duration / 3600))
    local minutes=$(( (duration % 3600) / 60 ))
    local seconds=$((duration % 60))
    
    # Afficher les statistiques
    echo ""
    echo -e "${BLUE}📊 Statistiques du scraping:${NC}"
    echo -e "${BLUE}⏱️ Durée totale: ${hours}h ${minutes}m ${seconds}s${NC}"
    echo -e "${BLUE}📦 Total d'éléments: ${total_items}${NC}"
    echo -e "${BLUE}✅ Sources traitées: ${sources_processed}/${#DRAMA_SOURCES[@]+ #ANIME_SOURCES[@]+ #FILM_SOURCES[@]+ #BOLLYWOOD_SOURCES[@]}${NC}"
    echo -e "${BLUE}❌ Sources en échec: ${sources_failed}${NC}"
    
    echo ""
    echo -e "${GREEN}✨ Scraping terminé avec succès!${NC}"
}

# Exécuter la fonction principale
main
