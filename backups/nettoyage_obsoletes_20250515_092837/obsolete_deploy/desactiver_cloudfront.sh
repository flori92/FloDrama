#!/bin/bash

# Script pour désactiver une distribution CloudFront spécifique
# Usage: ./desactiver_cloudfront.sh ID_DISTRIBUTION

if [ -z "$1" ]; then
  echo "❌ Erreur: Veuillez spécifier l'ID de la distribution CloudFront"
  echo "Usage: $0 ID_DISTRIBUTION"
  exit 1
fi

DIST_ID=$1

echo "✨ [CHORE] Début de la désactivation de la distribution CloudFront $DIST_ID"

# Récupérer la configuration actuelle
echo "🔍 Récupération de la configuration..."
aws cloudfront get-distribution-config --id $DIST_ID > /tmp/dist_config_$DIST_ID.json

if [ $? -ne 0 ]; then
  echo "❌ Échec de la récupération de la configuration pour la distribution $DIST_ID"
  exit 1
fi

# Extraire l'ETag
ETAG=$(jq -r '.ETag' /tmp/dist_config_$DIST_ID.json)

# Créer une copie de la configuration avec Enabled=false
echo "🔧 Modification de la configuration..."
jq '.DistributionConfig.Enabled = false' /tmp/dist_config_$DIST_ID.json > /tmp/dist_config_disabled_$DIST_ID.json

# Extraire uniquement la partie DistributionConfig
jq '.DistributionConfig' /tmp/dist_config_disabled_$DIST_ID.json > /tmp/dist_config_only_$DIST_ID.json

# Mettre à jour la distribution
echo "🔄 Mise à jour de la distribution..."
aws cloudfront update-distribution --id $DIST_ID --if-match "$ETAG" --distribution-config file:///tmp/dist_config_only_$DIST_ID.json

if [ $? -eq 0 ]; then
  echo "✅ Distribution $DIST_ID désactivée avec succès"
else
  echo "❌ Échec de la désactivation de la distribution $DIST_ID"
  exit 1
fi

echo "✨ [CHORE] Désactivation de la distribution CloudFront terminée"
echo "ℹ️ La désactivation peut prendre jusqu'à 15 minutes pour se propager"
