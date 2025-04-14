#!/bin/bash

# Script de vérification périodique et finalisation
# Respecte l'identité visuelle avec le dégradé signature bleu-fuchsia (#3b82f6 → #d946ef)

echo -e "\033[38;2;59;130;246m╔════════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[38;2;59;130;246m║\033[38;2;217;70;239m        Vérification périodique du certificat SSL          \033[38;2;59;130;246m║\033[0m"
echo -e "\033[38;2;59;130;246m╚════════════════════════════════════════════════════════════╝\033[0m"

# Vérification de l'état du certificat SSL
SSL_CHECK=$(curl -sI https://flodrama.com | head -n 1)

if [[ $SSL_CHECK == *"200 OK"* ]]; then
  echo -e "\033[38;2;217;70;239m✓\033[0m Le certificat SSL est correctement configuré !"
  
  # Récupération de la configuration actuelle de CloudFront
  aws cloudfront get-distribution-config --id E5XC74WR62W9Z --output json > cloudfront-config.json
  ETAG=$(jq -r '.ETag' cloudfront-config.json)
  
  # Modification de la configuration pour désactiver la distribution
  jq '.DistributionConfig.Enabled = false' cloudfront-config.json > cloudfront-disable.json
  jq 'del(.ETag)' cloudfront-disable.json > cloudfront-update.json
  
  # Mise à jour de la distribution
  aws cloudfront update-distribution --id E5XC74WR62W9Z --if-match $ETAG --distribution-config file://cloudfront-update.json
  
  # Nettoyage
  rm cloudfront-config.json cloudfront-disable.json cloudfront-update.json
  
  echo -e "\033[38;2;217;70;239m✓\033[0m Distribution CloudFront désactivée avec succès"
  
  # Notification
  echo -e "\033[38;2;59;130;246m╔════════════════════════════════════════════════════════════╗\033[0m"
  echo -e "\033[38;2;59;130;246m║\033[38;2;217;70;239m        Migration terminée avec succès                    \033[38;2;59;130;246m║\033[0m"
  echo -e "\033[38;2;59;130;246m╚════════════════════════════════════════════════════════════╝\033[0m"
  echo -e "FloDrama est maintenant accessible en HTTPS à l'adresse :"
  echo -e "\033[38;2;217;70;239mhttps://flodrama.com\033[0m"
  
  # Arrêt des vérifications périodiques
  crontab -l | grep -v "verifier-et-finaliser.sh" | crontab -
else
  echo -e "\033[38;2;217;70;239m!\033[0m Le certificat SSL n'est pas encore actif."
  echo -e "   Statut actuel : $SSL_CHECK"
  echo -e "   Nouvelle vérification dans 1 heure."
fi
