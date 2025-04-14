#!/bin/bash
# Script de déploiement pour FloDrama vers AWS en mode React uniquement
# Créé le 29-03-2025

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/${TIMESTAMP}_backup_deploy_react"
S3_BUCKET="flodrama-app-bucket"
CLOUDFRONT_DISTRIBUTION_ID="E1MU6L4S4UVUSS" # ID de la distribution CloudFront

# Couleurs pour les messages
ROUGE='\033[0;31m'
VERT='\033[0;32m'
JAUNE='\033[0;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log() {
  echo -e "${VERT}[$(date +"%Y-%m-%d %H:%M:%S")] $1${NC}"
}

erreur() {
  echo -e "${ROUGE}[$(date +"%Y-%m-%d %H:%M:%S")] ERREUR: $1${NC}"
}

attention() {
  echo -e "${JAUNE}[$(date +"%Y-%m-%d %H:%M:%S")] ATTENTION: $1${NC}"
}

# Créer un répertoire de sauvegarde
mkdir -p "$BACKUP_DIR"
log "Répertoire de sauvegarde créé: $BACKUP_DIR"

# Sauvegarder les fichiers importants
log "Sauvegarde des fichiers importants..."
cp -r ./Frontend/src "$BACKUP_DIR/src"
cp -r ./Frontend/public "$BACKUP_DIR/public"
cp ./Frontend/package.json "$BACKUP_DIR/package.json"
cp ./Frontend/index.html "$BACKUP_DIR/index.html" 2>/dev/null || :
log "Sauvegarde terminée"

# Se déplacer dans le répertoire du frontend
cd ./Frontend || {
  erreur "Impossible d'accéder au répertoire Frontend"
  exit 1
}

# Créer un fichier .env temporaire pour forcer le mode React
log "Création d'un fichier .env pour forcer le mode React..."
cat > .env << EOF
VITE_FORCE_REACT_MODE=true
EOF

# Modifier temporairement le package.json pour exclure les dépendances Lynx
log "Modification temporaire du package.json pour exclure les dépendances Lynx..."
cp package.json package.json.bak
jq 'del(.dependencies."@lynx/core", .dependencies."@lynx/react", .dependencies."@lynx/hooks", .dependencies."@lynx/runtime")' package.json.bak > package.json || {
  attention "jq n'est pas installé ou a échoué. Tentative de modification manuelle..."
  # Tentative de modification manuelle si jq échoue
  sed -i.bak -E 's/"@lynx\/core": "[^"]*",?//g; s/"@lynx\/react": "[^"]*",?//g; s/"@lynx\/hooks": "[^"]*",?//g; s/"@lynx\/runtime": "[^"]*",?//g' package.json
  # Nettoyer les virgules en trop
  sed -i.bak2 -E 's/,\s*}/}/g; s/,\s*,/,/g' package.json
}

# Installer les dépendances sans les packages Lynx
log "Installation des dépendances sans les packages Lynx..."
npm install --legacy-peer-deps || {
  erreur "Échec de l'installation des dépendances"
  # Restaurer le package.json original
  mv package.json.bak package.json 2>/dev/null || :
  exit 1
}

# Modifier temporairement le HybridComponentProvider pour forcer le mode React
log "Modification temporaire du HybridComponentProvider pour forcer le mode React..."
HYBRID_PROVIDER_FILE="./src/components/HybridComponentProvider.tsx"
cp "$HYBRID_PROVIDER_FILE" "${HYBRID_PROVIDER_FILE}.bak"

# Ajouter une variable d'environnement pour forcer le mode React
sed -i.bak 's/const \[forceReactMode, setForceReactMode\] = useState<boolean>(false);/const \[forceReactMode, setForceReactMode\] = useState<boolean>(true); \/\/ Forcé à true pour le déploiement/' "$HYBRID_PROVIDER_FILE"

# Construction de l'application avec les variables d'environnement de production
log "Construction de l'application en mode React uniquement..."
npm run build || {
  erreur "Échec de la construction de l'application"
  # Restaurer les fichiers originaux
  mv "${HYBRID_PROVIDER_FILE}.bak" "$HYBRID_PROVIDER_FILE" 2>/dev/null || :
  mv package.json.bak package.json 2>/dev/null || :
  exit 1
}

# Restaurer les fichiers originaux
log "Restauration des fichiers originaux..."
mv "${HYBRID_PROVIDER_FILE}.bak" "$HYBRID_PROVIDER_FILE" 2>/dev/null || :
mv package.json.bak package.json 2>/dev/null || :
rm -f package.json.bak2 2>/dev/null || :
rm -f .env 2>/dev/null || :

# Vérifier que le répertoire de build existe
if [ ! -d "./dist" ]; then
  erreur "Le répertoire de build (dist) n'existe pas"
  exit 1
fi

# Revenir au répertoire principal
cd ..

# Créer une politique de bucket S3 pour permettre l'accès public
log "Création de la politique de bucket S3..."
cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$S3_BUCKET/*"
    }
  ]
}
EOF

# Mettre à jour la politique du bucket S3
log "Mise à jour de la politique du bucket S3..."
aws s3api put-bucket-policy --bucket $S3_BUCKET --policy file://bucket-policy.json || {
  attention "Échec de la mise à jour de la politique du bucket S3"
}

# Désactiver le blocage de l'accès public
log "Désactivation du blocage de l'accès public..."
aws s3api put-public-access-block --bucket $S3_BUCKET --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" || {
  attention "Échec de la désactivation du blocage de l'accès public"
}

# Déployer sur S3 avec l'ACL public-read
log "Déploiement sur S3 avec l'ACL public-read..."
aws s3 sync ./Frontend/dist s3://$S3_BUCKET --delete --acl public-read || {
  erreur "Échec du déploiement sur S3"
  exit 1
}

# Invalider le cache CloudFront
log "Invalidation du cache CloudFront..."
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*" || {
  attention "Échec de l'invalidation du cache CloudFront"
}

# Nettoyage des fichiers temporaires
log "Nettoyage des fichiers temporaires..."
rm -f bucket-policy.json

log "Déploiement terminé avec succès!"
log "L'application est accessible à l'adresse: https://d1pbqs2b6em4ha.cloudfront.net"
log "Ou via le nom de domaine configuré dans CloudFront."
log "IMPORTANT: Cette version est déployée en mode React uniquement (sans Lynx)."
