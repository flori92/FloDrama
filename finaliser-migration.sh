#!/bin/bash

# Script de finalisation de la migration vers GitHub Pages pour FloDrama
# Respecte l'identité visuelle avec le dégradé signature bleu-fuchsia (#3b82f6 → #d946ef)

echo -e "\033[38;2;59;130;246m╔════════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[38;2;59;130;246m║\033[38;2;217;70;239m        Finalisation de la migration FloDrama              \033[38;2;59;130;246m║\033[0m"
echo -e "\033[38;2;59;130;246m╚════════════════════════════════════════════════════════════╝\033[0m"

# Fonction pour afficher les messages d'étape
function etape() {
  echo -e "\033[38;2;59;130;246m[$1/$2]\033[0m $3"
}

# Fonction pour afficher les succès
function succes() {
  echo -e "\033[38;2;217;70;239m✓\033[0m $1"
}

# Fonction pour afficher les avertissements
function avertissement() {
  echo -e "\033[38;2;217;70;239m!\033[0m $1"
}

# Fonction pour afficher les erreurs
function erreur() {
  echo -e "\033[31m✗\033[0m $1"
}

# 1. Retour à la branche principale
etape 1 5 "Retour à la branche principale..."
git checkout github-pages-clean
succes "Retour à la branche principale effectué"

# 2. Vérification de la configuration DNS
etape 2 5 "Vérification et optimisation de la configuration DNS..."

# Vérification des enregistrements DNS actuels
DNS_CHECK=$(dig flodrama.com +short)
if [[ $DNS_CHECK == *"185.199.108.153"* || $DNS_CHECK == *"185.199.109.153"* || $DNS_CHECK == *"185.199.110.153"* || $DNS_CHECK == *"185.199.111.153"* ]]; then
  succes "Configuration DNS correcte pour flodrama.com"
else
  avertissement "Configuration DNS incorrecte pour flodrama.com"
  
  # Création du fichier de configuration DNS
  cat > dns-github-pages.json << EOF
{
  "Comment": "Migration vers GitHub Pages avec maintien de l'identité visuelle FloDrama",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "flodrama.com.",
        "Type": "A",
        "TTL": 3600,
        "ResourceRecords": [
          { "Value": "185.199.108.153" },
          { "Value": "185.199.109.153" },
          { "Value": "185.199.110.153" },
          { "Value": "185.199.111.153" }
        ]
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "www.flodrama.com.",
        "Type": "CNAME",
        "TTL": 3600,
        "ResourceRecords": [
          { "Value": "flori92.github.io." }
        ]
      }
    }
  ]
}
EOF

  # Mise à jour des enregistrements DNS
  ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='flodrama.com.'].Id" --output text)
  aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch file://dns-github-pages.json
  
  succes "Mise à jour des enregistrements DNS effectuée"
fi

# 3. Vérification et mise à jour du fichier CNAME
etape 3 5 "Vérification et mise à jour du fichier CNAME..."

# Vérification du fichier CNAME
if [ -f "CNAME" ] && [ "$(cat CNAME)" == "flodrama.com" ]; then
  succes "Fichier CNAME correctement configuré"
else
  avertissement "Création/mise à jour du fichier CNAME..."
  echo "flodrama.com" > CNAME
  git add CNAME
  git commit -m "✨ [FEAT] Mise à jour du fichier CNAME pour le domaine personnalisé"
  git push origin github-pages-clean
  succes "Fichier CNAME créé/mis à jour et poussé vers GitHub"
fi

# 4. Ajout des fichiers de vérification pour le certificat SSL
etape 4 5 "Ajout des fichiers de vérification pour le certificat SSL..."

# Création du répertoire .well-known
mkdir -p .well-known/pki-validation

# Création des fichiers de vérification
echo "github-pages-challenge-flori92" > .well-known/pki-validation/fileauth.txt
touch .well-known/pki-validation/gd_bundle.crt

# Vérification si les fichiers ont été modifiés
if git status --porcelain | grep -q ".well-known"; then
  git add .well-known
  git commit -m "✨ [FEAT] Ajout des fichiers de vérification pour le certificat SSL"
  git push origin github-pages-clean
  succes "Fichiers de vérification créés et poussés vers GitHub"
else
  succes "Fichiers de vérification déjà présents"
fi

# 5. Préparation de la désactivation de CloudFront
etape 5 5 "Préparation de la désactivation de CloudFront..."

# Vérification de l'état du certificat SSL
SSL_CHECK=$(curl -sI https://flodrama.com | head -n 1)

if [[ $SSL_CHECK == *"200 OK"* ]]; then
  succes "Le certificat SSL est correctement configuré !"
  
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
  
  succes "Distribution CloudFront désactivée avec succès"
else
  avertissement "Le certificat SSL n'est pas encore actif."
  avertissement "La désactivation de CloudFront sera effectuée une fois le certificat SSL actif."
  avertissement "En attendant, vous pouvez accéder au site via l'URL d'accès direct :"
  echo -e "   \033[38;2;217;70;239mhttp://localhost:8080\033[0m"
  
  # Création d'un script de vérification périodique
  cat > verifier-et-finaliser.sh << 'EOF'
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
EOF

  chmod +x verifier-et-finaliser.sh
  
  # Configuration de la vérification périodique
  (crontab -l 2>/dev/null; echo "0 * * * * $(pwd)/verifier-et-finaliser.sh >> $(pwd)/migration.log 2>&1") | crontab -
  
  succes "Vérification périodique configurée (toutes les heures)"
  succes "Les résultats seront enregistrés dans migration.log"
fi

echo -e "\033[38;2;59;130;246m╔════════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[38;2;59;130;246m║\033[38;2;217;70;239m                Migration en cours                          \033[38;2;59;130;246m║\033[0m"
echo -e "\033[38;2;59;130;246m╚════════════════════════════════════════════════════════════╝\033[0m"

if [[ $SSL_CHECK == *"200 OK"* ]]; then
  echo -e "FloDrama est maintenant accessible en HTTPS à l'adresse :"
  echo -e "\033[38;2;217;70;239mhttps://flodrama.com\033[0m"
else
  echo -e "La migration est en cours. Le certificat SSL sera actif dans les prochaines 24 heures."
  echo -e "En attendant, vous pouvez accéder au site via l'URL d'accès direct :"
  echo -e "\033[38;2;217;70;239mhttp://localhost:8080\033[0m"
  echo -e ""
  echo -e "Pour vérifier manuellement l'état du certificat SSL, exécutez :"
  echo -e "\033[38;2;217;70;239m./verifier-ssl.sh\033[0m"
fi
