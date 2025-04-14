#!/bin/bash

# Script de désactivation progressive de CloudFront pour FloDrama
# Respecte l'identité visuelle avec le dégradé signature bleu-fuchsia (#3b82f6 → #d946ef)

echo -e "\033[38;2;59;130;246m╔════════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[38;2;59;130;246m║\033[38;2;217;70;239m                Désactivation de CloudFront                  \033[38;2;59;130;246m║\033[0m"
echo -e "\033[38;2;59;130;246m╚════════════════════════════════════════════════════════════╝\033[0m"

# Récupération de la configuration actuelle
echo -e "\033[38;2;59;130;246m[1/4]\033[0m Récupération de la configuration CloudFront..."
aws cloudfront get-distribution-config --id E5XC74WR62W9Z --output json > cloudfront-config.json
ETAG=$(jq -r '.ETag' cloudfront-config.json)
echo -e "\033[38;2;217;70;239m✓\033[0m Configuration récupérée avec ETag: $ETAG"

# Modification de la configuration pour désactiver la distribution
echo -e "\033[38;2;59;130;246m[2/4]\033[0m Préparation de la désactivation..."
jq '.DistributionConfig.Enabled = false' cloudfront-config.json > cloudfront-disable.json
jq 'del(.ETag)' cloudfront-disable.json > cloudfront-update.json
echo -e "\033[38;2;217;70;239m✓\033[0m Configuration modifiée"

# Mise à jour de la distribution
echo -e "\033[38;2;59;130;246m[3/4]\033[0m Désactivation de la distribution CloudFront..."
aws cloudfront update-distribution --id E5XC74WR62W9Z --if-match $ETAG --distribution-config file://cloudfront-update.json

# Nettoyage
echo -e "\033[38;2;59;130;246m[4/4]\033[0m Nettoyage des fichiers temporaires..."
rm cloudfront-config.json cloudfront-disable.json cloudfront-update.json
echo -e "\033[38;2;217;70;239m✓\033[0m Nettoyage terminé"

echo -e "\033[38;2;59;130;246m╔════════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[38;2;59;130;246m║\033[38;2;217;70;239m                Migration terminée avec succès               \033[38;2;59;130;246m║\033[0m"
echo -e "\033[38;2;59;130;246m╚════════════════════════════════════════════════════════════╝\033[0m"
echo -e "FloDrama est maintenant hébergé sur GitHub Pages à l'adresse :"
echo -e "\033[38;2;217;70;239mhttps://flodrama.com\033[0m"
