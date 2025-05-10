#!/bin/bash

# Script de déploiement pour le Worker CORS Proxy FloDrama
# Ce script nécessite que wrangler soit installé et configuré

echo "Déploiement du CORS Proxy pour FloDrama API..."

# Vérifier si wrangler est installé
if ! command -v wrangler &> /dev/null
then
    echo "Erreur: wrangler n'est pas installé. Installez-le avec 'npm install -g wrangler'"
    exit 1
fi

# Vérifier si l'utilisateur est connecté à Cloudflare
echo "Vérification de la connexion à Cloudflare..."
wrangler whoami || {
    echo "Erreur: Vous n'êtes pas connecté à Cloudflare. Connectez-vous avec 'wrangler login'"
    exit 1
}

# Créer le Worker directement avec wrangler
echo "Création et déploiement du Worker CORS Proxy..."

# Créer un fichier temporaire pour le déploiement
TEMP_FILE=$(mktemp)
echo "Fichier temporaire créé: $TEMP_FILE"

# Copier le contenu du fichier cors-config.js dans le fichier temporaire
cp cors-config.js $TEMP_FILE

# Déployer le Worker avec wrangler
wrangler deploy --name flodrama-cors-proxy --compatibility-date 2023-05-08 $TEMP_FILE

# Nettoyage
rm $TEMP_FILE

echo "Déploiement terminé !"
echo "Vérifiez que le Worker fonctionne correctement en accédant à https://flodrama-cors-proxy.florifavi.workers.dev"
