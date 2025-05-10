#!/bin/bash

# Script pour générer des images placeholder avec identité visuelle FloDrama

# Vérifier si ImageMagick est installé
if ! command -v convert &> /dev/null; then
    echo "ImageMagick n'est pas installé. Installation..."
    brew install imagemagick || {
        echo "Impossible d'installer ImageMagick. Veuillez l'installer manuellement."
        exit 1
    }
fi

echo "Génération des images placeholder pour FloDrama..."

# Dégradé signature FloDrama (bleu -> fuchsia)
GRADIENT_COLORS="gradient:rgb(59,130,246)-rgb(217,70,239)"

# Génération du poster placeholder (300x450)
convert -size 300x450 $GRADIENT_COLORS -gravity center -pointsize 24 -fill white \
    -font "Arial-Bold" -annotate 0 "FloDrama" -pointsize 16 -annotate +0+30 "Image non disponible" \
    public/assets/placeholder-poster.jpg

# Génération du backdrop placeholder (1280x720)
convert -size 1280x720 $GRADIENT_COLORS -gravity center -pointsize 36 -fill white \
    -font "Arial-Bold" -annotate 0 "FloDrama" -pointsize 24 -annotate +0+40 "Image non disponible" \
    public/assets/placeholder-backdrop.jpg

# Génération du thumbnail placeholder (240x135)
convert -size 240x135 $GRADIENT_COLORS -gravity center -pointsize 16 -fill white \
    -font "Arial-Bold" -annotate 0 "FloDrama" -pointsize 12 -annotate +0+20 "Image non disponible" \
    public/assets/placeholder-thumbnail.jpg

# Génération de l'image générique placeholder (400x300)
convert -size 400x300 $GRADIENT_COLORS -gravity center -pointsize 24 -fill white \
    -font "Arial-Bold" -annotate 0 "FloDrama" -pointsize 16 -annotate +0+30 "Image non disponible" \
    public/assets/placeholder-image.jpg

echo "Images placeholder générées avec succès !"
echo "Vous pouvez les trouver dans le dossier public/assets/"
