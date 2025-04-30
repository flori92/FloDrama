#!/bin/bash

# Script pour télécharger et téléverser des vidéos de test vers le bucket S3
# Créé le 8 avril 2025

# Configuration
S3_BUCKET="flodrama-video-cache"
TEST_DIR="test"
TEMP_DIR="/tmp/flodrama-test-videos"
VIDEO_QUALITIES=("240p" "360p" "480p" "720p" "1080p")
VIDEO_DURATIONS=("10" "30" "60")

# Créer le répertoire temporaire s'il n'existe pas
mkdir -p $TEMP_DIR

echo "🎬 Téléchargement et téléversement des vidéos de test vers S3..."

# Fonction pour générer une vidéo de test avec ffmpeg
generate_test_video() {
    local quality=$1
    local duration=$2
    local output_file="$TEMP_DIR/test-video-${quality}-${duration}s.mp4"
    
    # Déterminer la résolution en fonction de la qualité
    local resolution
    case $quality in
        "240p") resolution="426x240" ;;
        "360p") resolution="640x360" ;;
        "480p") resolution="854x480" ;;
        "720p") resolution="1280x720" ;;
        "1080p") resolution="1920x1080" ;;
        *) resolution="640x360" ;;
    esac
    
    echo "Génération d'une vidéo de test $quality ($resolution) de $duration secondes..."
    
    # Générer une vidéo de test avec ffmpeg
    ffmpeg -y -f lavfi -i "testsrc=duration=$duration:size=$resolution:rate=30" \
           -vf "drawtext=text='FloDrama Test Video $quality':fontsize=24:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" \
           -c:v libx264 -tune stillimage -pix_fmt yuv420p $output_file
    
    # Vérifier si la génération a réussi
    if [ $? -eq 0 ]; then
        echo "✅ Vidéo générée avec succès: $output_file"
        return 0
    else
        echo "❌ Échec de la génération de la vidéo: $output_file"
        return 1
    fi
}

# Fonction pour téléverser une vidéo vers S3
upload_to_s3() {
    local file_path=$1
    local s3_key=$2
    
    echo "Téléversement vers S3: $s3_key"
    
    # Téléverser le fichier vers S3
    aws s3 cp $file_path s3://$S3_BUCKET/$s3_key
    
    # Vérifier si le téléversement a réussi
    if [ $? -eq 0 ]; then
        echo "✅ Téléversement réussi: s3://$S3_BUCKET/$s3_key"
        return 0
    else
        echo "❌ Échec du téléversement: s3://$S3_BUCKET/$s3_key"
        return 1
    fi
}

# Vérifier si ffmpeg est installé
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ffmpeg n'est pas installé. Veuillez l'installer pour continuer."
    exit 1
fi

# Vérifier si AWS CLI est installé
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI n'est pas installé. Veuillez l'installer pour continuer."
    exit 1
fi

# Générer et téléverser les vidéos de test pour chaque qualité et durée
for quality in "${VIDEO_QUALITIES[@]}"; do
    for duration in "${VIDEO_DURATIONS[@]}"; do
        # Générer la vidéo de test
        generate_test_video $quality $duration
        
        if [ $? -eq 0 ]; then
            # Téléverser la vidéo vers S3
            local_file="$TEMP_DIR/test-video-${quality}-${duration}s.mp4"
            s3_key="$TEST_DIR/test-video-${quality}-${duration}s.mp4"
            upload_to_s3 $local_file $s3_key
            
            # Créer également une version sans la durée dans le nom pour la compatibilité
            if [ "$duration" == "30" ]; then
                s3_key_simple="$TEST_DIR/test-video-${quality}.mp4"
                upload_to_s3 $local_file $s3_key_simple
            fi
        fi
    done
done

# Créer un fichier de test générique
generate_test_video "480p" "30"
if [ $? -eq 0 ]; then
    local_file="$TEMP_DIR/test-video-480p-30s.mp4"
    s3_key="$TEST_DIR/test-video.mp4"
    upload_to_s3 $local_file $s3_key
fi

echo "🎉 Opération terminée!"
echo "Les vidéos de test ont été téléversées vers s3://$S3_BUCKET/$TEST_DIR/"

# Nettoyer les fichiers temporaires
echo "Nettoyage des fichiers temporaires..."
rm -rf $TEMP_DIR

echo "✨ Tout est prêt pour les tests!"
