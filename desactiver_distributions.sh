#!/bin/bash

# Script pour désactiver les distributions CloudFront redondantes pour FloDrama
# Ce script conserve uniquement la distribution principale et désactive les autres

echo "✨ [CHORE] Début de la désactivation des distributions CloudFront redondantes"

# ID de la distribution principale à conserver
MAIN_DISTRIBUTION="E275AW2L6UVK2A"  # d11nnqvjfooahr.cloudfront.net

# Liste des distributions CloudFront liées à FloDrama
DISTRIBUTIONS=(
  "E5XC74WR62W9Z"  # d1323ouxr1qbdp.cloudfront.net
  "E2Q1IQGU47SLGM"  # d28f6c3hzvqkgp.cloudfront.net
  "EIT8NA31RVVWK"  # d1k0hdg1q5wjpi.cloudfront.net
  "EBE40VWPLFMPH"  # d18lg9vvv7unw2.cloudfront.net
  "E1IG2U5KWWN11Y"  # d3f5h9d39jukrl.cloudfront.net
  "E2TIZZTTLG9R3U"  # dyba0cgavum1j.cloudfront.net
)

# Pour chaque distribution, vérifier si elle n'est pas la principale et la désactiver
for dist_id in "${DISTRIBUTIONS[@]}"; do
  if [ "$dist_id" != "$MAIN_DISTRIBUTION" ]; then
    echo "🔄 Désactivation de la distribution $dist_id..."
    
    # Récupérer la configuration actuelle
    echo "  - Récupération de la configuration..."
    aws cloudfront get-distribution-config --id $dist_id > /tmp/dist_config.json
    
    # Extraire l'ETag
    ETAG=$(jq -r '.ETag' /tmp/dist_config.json)
    
    # Modifier la configuration pour désactiver la distribution
    echo "  - Modification de la configuration..."
    jq '.DistributionConfig.Enabled = false' /tmp/dist_config.json > /tmp/dist_config_disabled.json
    
    # Mettre à jour la distribution
    echo "  - Mise à jour de la distribution..."
    aws cloudfront update-distribution --id $dist_id --if-match $ETAG --distribution-config "$(jq '.DistributionConfig' /tmp/dist_config_disabled.json)"
    
    if [ $? -eq 0 ]; then
      echo "✅ Distribution $dist_id désactivée avec succès"
    else
      echo "❌ Échec de la désactivation de la distribution $dist_id"
    fi
  fi
done

echo "✨ [CHORE] Désactivation des distributions CloudFront terminée"
echo ""
echo "📝 Recommandations :"
echo "1. Attendre que les distributions désactivées passent à l'état 'Deployed' (cela peut prendre jusqu'à 15 minutes)"
echo "2. Tester l'application avec la nouvelle configuration CloudFront"
echo "3. Une fois l'application testée avec succès, supprimer les distributions désactivées"
