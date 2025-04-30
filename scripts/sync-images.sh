#!/bin/bash

# Script de synchronisation des images entre les différentes sources
# Ce script synchronise les images entre GitHub Pages et AWS CloudFront
# et génère automatiquement les placeholders manquants

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Synchronisation des images FloDrama ===${NC}"

# Vérifier si AWS CLI est installé
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI n'est pas installé. Veuillez l'installer pour continuer.${NC}"
    echo "Instructions d'installation : https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Vérifier si jq est installé (pour le traitement JSON)
if ! command -v jq &> /dev/null; then
    echo -e "${RED}jq n'est pas installé. Veuillez l'installer pour continuer.${NC}"
    echo "Instructions d'installation : https://stedolan.github.io/jq/download/"
    exit 1
fi

# Configuration
PROJECT_ROOT="/Users/floriace/FLO_DRAMA/FloDrama"
LOCAL_MEDIA_DIR="${PROJECT_ROOT}/public/assets/media"
S3_BUCKET="flodrama-assets"
CLOUDFRONT_DISTRIBUTION_ID="E275AW2L6UVK2A"
MEDIA_TYPES=("posters" "backdrops" "thumbnails")
CONTENT_IDS_FILE="${PROJECT_ROOT}/scripts/content_ids.json"

# Créer les dossiers locaux s'ils n'existent pas
for type in "${MEDIA_TYPES[@]}"; do
    mkdir -p "${LOCAL_MEDIA_DIR}/${type}"
done

# Extraire les IDs de contenu depuis le fichier JSON
if [ -f "$CONTENT_IDS_FILE" ]; then
    echo -e "${BLUE}Chargement des IDs de contenu depuis ${CONTENT_IDS_FILE}${NC}"
    CONTENT_IDS=($(jq -r '.ids[]' "$CONTENT_IDS_FILE"))
else
    echo -e "${YELLOW}Fichier d'IDs de contenu non trouvé. Utilisation des IDs par défaut.${NC}"
    # IDs par défaut
    CONTENT_IDS=("drama001" "drama002" "drama003" "drama004" "drama005" "drama006" "drama007" "drama008")
    
    # Créer le fichier JSON avec les IDs par défaut
    echo '{"ids":["drama001","drama002","drama003","drama004","drama005","drama006","drama007","drama008"]}' > "$CONTENT_IDS_FILE"
    echo -e "${GREEN}✓ Fichier d'IDs de contenu créé avec les valeurs par défaut${NC}"
fi

echo -e "${BLUE}Synchronisation pour ${#CONTENT_IDS[@]} IDs de contenu${NC}"

# Fonction pour générer un SVG placeholder
generate_svg_placeholder() {
    local content_id=$1
    local type=$2
    local width=$3
    local height=$4
    local output_file=$5
    
    # Définir les dimensions en fonction du type
    if [ "$type" == "posters" ]; then
        width=300
        height=450
    elif [ "$type" == "backdrops" ]; then
        width=1280
        height=720
    elif [ "$type" == "thumbnails" ]; then
        width=200
        height=113
    fi
    
    # Créer le SVG
    cat > "$output_file" << EOF
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#d946ef" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="#1A1926" />
  <rect x="10" y="10" width="$((width-20))" height="$((height-20))" rx="8" stroke="url(#gradient)" stroke-width="2" fill="none" />
  <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="url(#gradient)">${content_id}</text>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#FFFFFF">${type}</text>
</svg>
EOF
    
    echo -e "${GREEN}✓ SVG placeholder généré pour ${content_id} (${type})${NC}"
}

# Fonction pour convertir SVG en JPG
convert_svg_to_jpg() {
    local svg_file=$1
    local jpg_file=$2
    
    # Vérifier si convert (ImageMagick) est installé
    if command -v convert &> /dev/null; then
        convert "$svg_file" "$jpg_file"
        echo -e "${GREEN}✓ SVG converti en JPG${NC}"
    else
        echo -e "${YELLOW}ImageMagick n'est pas installé. Impossible de convertir SVG en JPG.${NC}"
        echo -e "${YELLOW}Le SVG sera utilisé comme placeholder.${NC}"
        cp "$svg_file" "${jpg_file%.jpg}.svg"
    fi
}

# Synchroniser les images locales vers S3
sync_local_to_s3() {
    echo -e "${BLUE}Synchronisation des images locales vers S3...${NC}"
    
    for type in "${MEDIA_TYPES[@]}"; do
        echo -e "${BLUE}Synchronisation du dossier ${type}...${NC}"
        
        # Synchroniser le dossier complet
        aws s3 sync "${LOCAL_MEDIA_DIR}/${type}" "s3://${S3_BUCKET}/media/${type}" --acl public-read
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Synchronisation réussie pour ${type}${NC}"
        else
            echo -e "${RED}✗ Erreur lors de la synchronisation pour ${type}${NC}"
        fi
    done
}

# Synchroniser les images S3 vers local
sync_s3_to_local() {
    echo -e "${BLUE}Synchronisation des images S3 vers local...${NC}"
    
    for type in "${MEDIA_TYPES[@]}"; do
        echo -e "${BLUE}Synchronisation du dossier ${type}...${NC}"
        
        # Synchroniser le dossier complet
        aws s3 sync "s3://${S3_BUCKET}/media/${type}" "${LOCAL_MEDIA_DIR}/${type}"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Synchronisation réussie pour ${type}${NC}"
        else
            echo -e "${RED}✗ Erreur lors de la synchronisation pour ${type}${NC}"
        fi
    done
}

# Vérifier et générer les placeholders manquants
generate_missing_placeholders() {
    echo -e "${BLUE}Vérification et génération des placeholders manquants...${NC}"
    
    local missing_count=0
    local total_count=0
    
    for content_id in "${CONTENT_IDS[@]}"; do
        for type in "${MEDIA_TYPES[@]}"; do
            local file_path="${LOCAL_MEDIA_DIR}/${type}/${content_id}.jpg"
            total_count=$((total_count + 1))
            
            if [ ! -f "$file_path" ]; then
                echo -e "${YELLOW}Image manquante: ${file_path}${NC}"
                missing_count=$((missing_count + 1))
                
                # Générer un SVG placeholder
                local temp_svg="/tmp/${content_id}_${type}.svg"
                generate_svg_placeholder "$content_id" "$type" 0 0 "$temp_svg"
                
                # Convertir SVG en JPG
                convert_svg_to_jpg "$temp_svg" "$file_path"
                
                # Nettoyer le fichier temporaire
                rm -f "$temp_svg"
            fi
        done
    done
    
    echo -e "${BLUE}Vérification terminée: ${missing_count}/${total_count} images manquantes générées${NC}"
}

# Invalider le cache CloudFront
invalidate_cloudfront_cache() {
    echo -e "${BLUE}Invalidation du cache CloudFront...${NC}"
    
    # Créer un fichier de configuration pour l'invalidation
    local invalidation_config="/tmp/cloudfront_invalidation.json"
    cat > "$invalidation_config" << EOF
{
  "Paths": {
    "Quantity": 1,
    "Items": [
      "/media/*"
    ]
  },
  "CallerReference": "sync-images-$(date +%s)"
}
EOF
    
    # Lancer l'invalidation
    aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --invalidation-batch file://"$invalidation_config"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Invalidation du cache CloudFront lancée avec succès${NC}"
    else
        echo -e "${RED}✗ Erreur lors de l'invalidation du cache CloudFront${NC}"
    fi
    
    # Nettoyer le fichier temporaire
    rm -f "$invalidation_config"
}

# Vérifier l'état des CDNs
check_cdn_status() {
    echo -e "${BLUE}Vérification de l'état des CDNs...${NC}"
    
    # Vérifier GitHub Pages
    local github_status_url="${PROJECT_ROOT}/public/status.json"
    if [ -f "$github_status_url" ]; then
        echo -e "${GREEN}✓ GitHub Pages est disponible${NC}"
    else
        echo -e "${RED}✗ GitHub Pages n'est pas disponible${NC}"
    fi
    
    # Vérifier CloudFront
    local cloudfront_status_url="https://d11nnqvjfooahr.cloudfront.net/status.json"
    local cloudfront_status=$(curl -s -o /dev/null -w "%{http_code}" "$cloudfront_status_url")
    
    if [ "$cloudfront_status" == "200" ]; then
        echo -e "${GREEN}✓ CloudFront est disponible (code: ${cloudfront_status})${NC}"
    else
        echo -e "${RED}✗ CloudFront n'est pas disponible (code: ${cloudfront_status})${NC}"
    fi
}

# Menu principal
show_menu() {
    echo -e "${BLUE}=== Menu de synchronisation des images FloDrama ===${NC}"
    echo "1. Vérifier et générer les placeholders manquants"
    echo "2. Synchroniser les images locales vers S3"
    echo "3. Synchroniser les images S3 vers local"
    echo "4. Invalider le cache CloudFront"
    echo "5. Vérifier l'état des CDNs"
    echo "6. Exécuter toutes les actions"
    echo "0. Quitter"
    
    read -p "Votre choix: " choice
    
    case $choice in
        1)
            generate_missing_placeholders
            ;;
        2)
            sync_local_to_s3
            ;;
        3)
            sync_s3_to_local
            ;;
        4)
            invalidate_cloudfront_cache
            ;;
        5)
            check_cdn_status
            ;;
        6)
            generate_missing_placeholders
            sync_local_to_s3
            invalidate_cloudfront_cache
            check_cdn_status
            ;;
        0)
            echo -e "${BLUE}Au revoir !${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Choix invalide${NC}"
            ;;
    esac
    
    echo ""
    read -p "Appuyez sur Entrée pour continuer..."
    show_menu
}

# Démarrer le script
show_menu
