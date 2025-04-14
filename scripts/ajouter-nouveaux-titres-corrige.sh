#!/bin/bash

# Script d'ajout de nouveaux titres à l'interface FloDrama (version corrigée)
# Auteur: Cascade
# Date: 4 avril 2025

# Couleurs pour les messages
BLEU='\033[94m'
VERT='\033[92m'
JAUNE='\033[93m'
ROUGE='\033[91m'
FIN='\033[0m'

# Fonctions d'affichage
function log() { echo -e "${BLEU}[INFO]${FIN} $1"; }
function log_success() { echo -e "${VERT}[SUCCÈS]${FIN} $1"; }
function log_warning() { echo -e "${JAUNE}[ATTENTION]${FIN} $1"; }
function log_error() { echo -e "${ROUGE}[ERREUR]${FIN} $1"; }

# Configuration
BUCKET_NOM="flodrama-prod-20250402173726"
ANCIEN_BUCKET="flodrama-prod"
DISTRIBUTION_ID="E1IG2U5KWWN11Y"
ANCIENNE_DISTRIBUTION="E5XC74WR62W9Z"
REGION="us-east-1"

log "=== Ajout de nouveaux titres à l'interface FloDrama ==="
log "Date: $(date)"

# Étape 1: Configurer la région AWS
log "Configuration de la région AWS à $REGION..."
export AWS_DEFAULT_REGION=$REGION

# Étape 2: Créer un répertoire temporaire
log "Création d'un répertoire temporaire..."
mkdir -p /tmp/flodrama-update/images

# Étape 3: Télécharger les nouvelles images d'affiches
log "Téléchargement des nouvelles images d'affiches..."

# Télécharger les nouvelles images
curl -s -o "/tmp/flodrama-update/images/solo_leveling.jpg" "https://m.media-amazon.com/images/M/MV5BZjE2OTFiZmUtMTQ5Yy00YWEzLTg3NTUtODkwZTFiMjZjZjY4XkEyXkFqcGdeQXVyMTEzMTI1Mjk3._V1_.jpg"
log "Image téléchargée: solo_leveling.jpg"

curl -s -o "/tmp/flodrama-update/images/the_beginning_after_the_end.jpg" "https://m.media-amazon.com/images/I/81+-8zKZ0TL._AC_UF1000,1000_QL80_.jpg"
log "Image téléchargée: the_beginning_after_the_end.jpg"

curl -s -o "/tmp/flodrama-update/images/sword_of_the_demon_hunter.jpg" "https://m.media-amazon.com/images/M/MV5BODY0MDdjNmItOThkZS00MzFkLTkxYTUtNzgxMjI5NTNkOWUxXkEyXkFqcGdeQXVyMTA0MTM5NjI2._V1_.jpg"
log "Image téléchargée: sword_of_the_demon_hunter.jpg"

# Étape 4: Téléverser les nouvelles images dans le bucket S3
log "Téléversement des nouvelles images dans le bucket S3..."
for image in /tmp/flodrama-update/images/*.jpg; do
    image_name=$(basename "$image")
    aws s3 cp "$image" "s3://$BUCKET_NOM/images/$image_name" --content-type "image/jpeg" --cache-control "max-age=31536000"
    aws s3 cp "$image" "s3://$ANCIEN_BUCKET/images/$image_name" --content-type "image/jpeg" --cache-control "max-age=31536000"
done

# Étape 5: Télécharger le fichier HTML actuel
log "Téléchargement du fichier HTML actuel..."
aws s3 cp "s3://$BUCKET_NOM/index.html" /tmp/flodrama-update/index.html

# Étape 6: Créer le nouveau contenu HTML pour la section des animés
log "Création du nouveau contenu HTML pour la section des animés..."
cat > /tmp/flodrama-update/animes-section.html << 'EOL'
<section class="section">
        <div class="section-title">
            <h2>Animés à découvrir</h2>
            <a href="#">Voir plus</a>
        </div>
        <div class="content-grid">
            <div class="content-card">
                <div class="card-image" style="background-image: url('images/solo_leveling.jpg');"></div>
                <div class="card-title">Solo Leveling</div>
            </div>
            <div class="content-card">
                <div class="card-image" style="background-image: url('images/attack_on_titan.jpg');"></div>
                <div class="card-title">Attack on Titan</div>
            </div>
            <div class="content-card">
                <div class="card-image" style="background-image: url('images/jujutsu_kaisen.jpg');"></div>
                <div class="card-title">Jujutsu Kaisen</div>
            </div>
            <div class="content-card">
                <div class="card-image" style="background-image: url('images/demon_slayer_series.jpg');"></div>
                <div class="card-title">Demon Slayer</div>
            </div>
            <div class="content-card">
                <div class="card-image" style="background-image: url('images/the_beginning_after_the_end.jpg');"></div>
                <div class="card-title">The Beginning After The End</div>
            </div>
        </div>
    </section>
    
    <section class="section">
        <div class="section-title">
            <h2>Nouveautés</h2>
            <a href="#">Voir plus</a>
        </div>
        <div class="content-grid">
            <div class="content-card">
                <div class="card-image" style="background-image: url('images/sword_of_the_demon_hunter.jpg');"></div>
                <div class="card-title">Sword of the Demon Hunter</div>
            </div>
            <div class="content-card">
                <div class="card-image" style="background-image: url('images/spy_family.jpg');"></div>
                <div class="card-title">Spy x Family</div>
            </div>
            <div class="content-card">
                <div class="card-image" style="background-image: url('images/chainsaw_man.jpg');"></div>
                <div class="card-title">Chainsaw Man</div>
            </div>
            <div class="content-card">
                <div class="card-image" style="background-image: url('images/solo_leveling.jpg');"></div>
                <div class="card-title">Solo Leveling</div>
            </div>
            <div class="content-card">
                <div class="card-image" style="background-image: url('images/the_beginning_after_the_end.jpg');"></div>
                <div class="card-title">The Beginning After The End</div>
            </div>
        </div>
    </section>
EOL

# Étape 7: Modifier le fichier HTML pour ajouter les nouveaux titres
log "Modification du fichier HTML pour ajouter les nouveaux titres..."
# Utiliser awk pour remplacer la section des animés
awk '
BEGIN { p=1 }
/<section class="section">.*<div class="section-title">.*<h2>Animés à découvrir<\/h2>/ { p=0 }
/<\/section>/ && p==0 { p=1; system("cat /tmp/flodrama-update/animes-section.html"); next }
p==1 { print }
' /tmp/flodrama-update/index.html > /tmp/flodrama-update/index.html.new
mv /tmp/flodrama-update/index.html.new /tmp/flodrama-update/index.html

# Étape 8: Télécharger le fichier JavaScript actuel
log "Téléchargement du fichier JavaScript actuel..."
aws s3 cp "s3://$BUCKET_NOM/script.js" /tmp/flodrama-update/script.js

# Étape 9: Créer le nouveau contenu JavaScript pour le carrousel
log "Création du nouveau contenu JavaScript pour le carrousel..."
cat > /tmp/flodrama-update/carousel-content.js << 'EOL'
const heroContent = [
        {
            title: "Solo Leveling",
            description: "Dans un monde où des chasseurs dotés de pouvoirs magiques combattent des monstres mortels, Sung Jinwoo, le chasseur le plus faible, découvre une capacité unique qui va transformer son destin.",
            background: "images/solo_leveling.jpg"
        },
        {
            title: "Sword of the Demon Hunter",
            description: "Un jeune épéiste part en quête de vengeance contre les démons qui ont massacré sa famille, découvrant sur son chemin des pouvoirs ancestraux et des alliés inattendus.",
            background: "images/sword_of_the_demon_hunter.jpg"
        },
        {
            title: "The Beginning After The End",
            description: "Un roi puissant renaît dans un nouveau monde de magie après sa mort, conservant ses souvenirs et sa détermination à devenir plus fort pour protéger ceux qu'il aime.",
            background: "images/the_beginning_after_the_end.jpg"
        },
        {
            title: "Demon Slayer",
            description: "Un jeune homme devient chasseur de démons après que sa famille a été massacrée et sa sœur transformée en démon.",
            background: "images/demon_slayer.jpg"
        },
        {
            title: "Parasite",
            description: "Une famille pauvre s'immisce dans le quotidien d'une famille riche, jusqu'à ce qu'un incident imprévu expose la face cachée de leur nouvelle vie.",
            background: "images/parasite.jpg"
        }
    ];
EOL

# Étape 10: Modifier le fichier JavaScript pour ajouter les nouveaux titres au carrousel
log "Modification du fichier JavaScript pour ajouter les nouveaux titres au carrousel..."
# Utiliser awk pour remplacer le contenu du carrousel
awk '
BEGIN { p=1 }
/const heroContent = \[/ { p=0 }
/\];/ && p==0 { p=1; system("cat /tmp/flodrama-update/carousel-content.js"); next }
p==1 { print }
' /tmp/flodrama-update/script.js > /tmp/flodrama-update/script.js.new
mv /tmp/flodrama-update/script.js.new /tmp/flodrama-update/script.js

# Étape 11: Téléverser les fichiers modifiés
log "Téléversement des fichiers modifiés..."
aws s3 cp /tmp/flodrama-update/index.html "s3://$BUCKET_NOM/index.html" --content-type "text/html; charset=utf-8" --cache-control "no-cache, no-store, must-revalidate" --expires "0"
aws s3 cp /tmp/flodrama-update/index.html "s3://$ANCIEN_BUCKET/index.html" --content-type "text/html; charset=utf-8" --cache-control "no-cache, no-store, must-revalidate" --expires "0"
aws s3 cp /tmp/flodrama-update/script.js "s3://$BUCKET_NOM/script.js" --content-type "application/javascript" --cache-control "max-age=31536000"
aws s3 cp /tmp/flodrama-update/script.js "s3://$ANCIEN_BUCKET/script.js" --content-type "application/javascript" --cache-control "max-age=31536000"

# Étape 12: Invalider le cache CloudFront
log "Invalidation du cache CloudFront..."
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
aws cloudfront create-invalidation --distribution-id $ANCIENNE_DISTRIBUTION --paths "/*"

# Étape 13: Nettoyer les fichiers temporaires
log "Nettoyage des fichiers temporaires..."
rm -rf /tmp/flodrama-update

log_success "=== Ajout des nouveaux titres terminé ==="
log "Le site flodrama.com a été mis à jour avec les nouveaux titres : Solo Leveling, The Beginning After The End et Sword of the Demon Hunter."
log "Veuillez patienter quelques minutes pour la propagation complète des modifications."
