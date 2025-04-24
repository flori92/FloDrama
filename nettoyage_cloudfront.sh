#!/bin/bash

# Script de nettoyage des distributions CloudFront redondantes pour FloDrama
# Ce script identifie les distributions obsolètes et les désactive

echo "✨ [CHORE] Début de l'analyse des distributions CloudFront"

# Récupérer la liste complète des distributions avec leurs détails
echo "🔍 Récupération des informations sur les distributions CloudFront..."
DISTRIBUTIONS=$(aws cloudfront list-distributions --query "DistributionList.Items[].{Id:Id,Domain:DomainName,Origin:Origins.Items[0].DomainName,Status:Status,Enabled:Enabled,Comment:Comment}" --output json)

# Identifier les distributions liées à FloDrama
echo "🔍 Identification des distributions liées à FloDrama..."
echo "$DISTRIBUTIONS" | jq -c '.[] | select(.Origin | contains("flodrama") or .Comment | contains("flodrama"))' > /tmp/flodrama_distributions.json

# Afficher les distributions identifiées
echo "📋 Distributions CloudFront liées à FloDrama :"
cat /tmp/flodrama_distributions.json | jq -r '.Domain + " (" + .Id + ") - " + .Origin'

# Identifier la distribution principale à conserver (la plus récente ou celle spécifiée)
MAIN_DISTRIBUTION=$(cat /tmp/flodrama_distributions.json | jq -r 'select(.Origin | contains("flodrama-assets") or .Origin | contains("images.flodrama.com")) | .Id' | head -1)

if [ -z "$MAIN_DISTRIBUTION" ]; then
  # Si aucune distribution avec l'origine spécifique n'est trouvée, prendre celle avec l'origine "images.flodrama.com"
  MAIN_DISTRIBUTION=$(cat /tmp/flodrama_distributions.json | jq -r 'select(.Origin | contains("images.flodrama.com")) | .Id' | head -1)
fi

if [ -z "$MAIN_DISTRIBUTION" ]; then
  # Si toujours aucune distribution n'est trouvée, prendre la première de la liste
  MAIN_DISTRIBUTION=$(cat /tmp/flodrama_distributions.json | jq -r '.Id' | head -1)
fi

echo "ℹ️ Distribution principale à conserver: $MAIN_DISTRIBUTION"

# Récupérer les informations sur la distribution principale
MAIN_DIST_INFO=$(cat /tmp/flodrama_distributions.json | jq -r "select(.Id == \"$MAIN_DISTRIBUTION\")")
MAIN_DOMAIN=$(echo "$MAIN_DIST_INFO" | jq -r '.Domain')

echo "ℹ️ Domaine de la distribution principale: $MAIN_DOMAIN"
echo "⚠️ ATTENTION: Mise à jour du code contentService.ts nécessaire pour utiliser ce domaine"

# Afficher les distributions à désactiver
echo "📋 Distributions CloudFront à désactiver :"
cat /tmp/flodrama_distributions.json | jq -r "select(.Id != \"$MAIN_DISTRIBUTION\") | .Domain + \" (\" + .Id + \") - \" + .Origin"

echo "✨ [CHORE] Analyse des distributions CloudFront terminée"
echo ""
echo "📝 Recommandations :"
echo "1. Mettre à jour la constante CLOUDFRONT_DOMAIN dans contentService.ts avec : $MAIN_DOMAIN"
echo "2. Désactiver manuellement les distributions CloudFront obsolètes via la console AWS"
echo "3. Une fois l'application testée avec le nouveau domaine, supprimer les distributions désactivées"
