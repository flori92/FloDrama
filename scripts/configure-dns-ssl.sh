#!/bin/bash
# Script de configuration DNS et SSL pour FloDrama sur AWS
# Créé le 29-03-2025

# Configuration
REGION="us-east-1"
DOMAINS=("flodrama.com" "www.flodrama.com" "flodrama.org" "flodrama.net" "flodrama.info")
DISTRIBUTION_ID="E1MU6L4S4UVUSS"
CERTIFICATE_ARN="arn:aws:acm:us-east-1:108782079729:certificate/19fa1966-523e-44f3-84bb-7e43aedc0af9"

# Couleurs pour les messages
ROUGE='\033[0;31m'
VERT='\033[0;32m'
JAUNE='\033[0;33m'
BLEU='\033[0;34m'
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

info() {
  echo -e "${BLEU}[$(date +"%Y-%m-%d %H:%M:%S")] INFO: $1${NC}"
}

# Vérifier que AWS CLI est installé
if ! command -v aws &> /dev/null; then
  erreur "AWS CLI n'est pas installé. Veuillez l'installer avant de continuer."
  exit 1
fi

# Fonction pour créer une zone hébergée Route 53 si elle n'existe pas
create_hosted_zone() {
  local domain=$1
  
  # Vérifier si la zone existe déjà
  local zone_id=$(aws route53 list-hosted-zones-by-name --dns-name "$domain." --max-items 1 --query "HostedZones[?Name=='$domain.'].Id" --output text | cut -d'/' -f3)
  
  if [ -z "$zone_id" ]; then
    log "Création de la zone hébergée pour $domain..."
    aws route53 create-hosted-zone --name "$domain" --caller-reference "flodrama-$(date +%s)" --query "HostedZone.Id" --output text
    return $?
  else
    info "La zone hébergée pour $domain existe déjà (ID: $zone_id)"
    return 0
  fi
}

# Fonction pour ajouter des enregistrements A vers CloudFront
create_cloudfront_record() {
  local domain=$1
  local zone_id=$2
  
  log "Ajout d'un enregistrement A pour $domain vers CloudFront..."
  
  # Créer le fichier de changement
  cat > change-batch.json << EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$domain",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "d1pbqs2b6em4ha.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
EOF
  
  # Appliquer le changement
  aws route53 change-resource-record-sets --hosted-zone-id "$zone_id" --change-batch file://change-batch.json
  local result=$?
  
  # Nettoyer
  rm -f change-batch.json
  
  return $result
}

# Fonction pour ajouter le certificat ACM à la distribution CloudFront
update_cloudfront_certificate() {
  # Obtenir la configuration actuelle
  log "Récupération de la configuration CloudFront..."
  aws cloudfront get-distribution-config --id "$DISTRIBUTION_ID" > cf-config.json
  
  if [ $? -ne 0 ]; then
    erreur "Impossible de récupérer la configuration CloudFront"
    return 1
  fi
  
  # Extraire l'ETag
  ETAG=$(grep -o '"ETag": "[^"]*"' cf-config.json | cut -d'"' -f4)
  
  if [ -z "$ETAG" ]; then
    erreur "ETag non trouvé dans la configuration CloudFront"
    return 1
  fi
  
  log "ETag récupéré: $ETAG"
  
  # Modifier le fichier de configuration pour ajouter le certificat et les alias
  jq --arg cert "$CERTIFICATE_ARN" --arg dom1 "${DOMAINS[0]}" --arg dom2 "${DOMAINS[1]}" '.DistributionConfig.ViewerCertificate.ACMCertificateArn = $cert | .DistributionConfig.ViewerCertificate.CertificateSource = "acm" | .DistributionConfig.ViewerCertificate.SSLSupportMethod = "sni-only" | .DistributionConfig.ViewerCertificate.MinimumProtocolVersion = "TLSv1.2_2021" | .DistributionConfig.Aliases.Quantity = 2 | .DistributionConfig.Aliases.Items = [$dom1, $dom2]' cf-config.json > cf-config-new.json
  
  # Mettre à jour la configuration
  log "Mise à jour de la configuration CloudFront avec le certificat SSL..."
  aws cloudfront update-distribution --id "$DISTRIBUTION_ID" --distribution-config file://cf-config-new.json --if-match "$ETAG"
  local result=$?
  
  # Nettoyer
  rm -f cf-config.json cf-config-new.json
  
  return $result
}

# Fonction principale
main() {
  log "Début de la configuration DNS et SSL pour FloDrama sur AWS..."
  
  # Pour chaque domaine
  for domain in "${DOMAINS[@]}"; do
    # Créer une zone hébergée si nécessaire
    create_hosted_zone "$domain"
    if [ $? -ne 0 ]; then
      attention "Échec de la création de la zone hébergée pour $domain"
      continue
    fi
    
    # Obtenir l'ID de la zone
    zone_id=$(aws route53 list-hosted-zones-by-name --dns-name "$domain." --max-items 1 --query "HostedZones[?Name=='$domain.'].Id" --output text | cut -d'/' -f3)
    
    if [ -z "$zone_id" ]; then
      attention "Impossible de trouver l'ID de la zone pour $domain"
      continue
    fi
    
    # Ajouter l'enregistrement A vers CloudFront
    create_cloudfront_record "$domain" "$zone_id"
    if [ $? -ne 0 ]; then
      attention "Échec de la création de l'enregistrement CloudFront pour $domain"
    else
      log "Enregistrement CloudFront pour $domain créé avec succès"
    fi
    
    # Ajouter également un enregistrement pour www si ce n'est pas déjà un sous-domaine
    if [[ "$domain" != www.* ]]; then
      create_cloudfront_record "www.$domain" "$zone_id"
      if [ $? -ne 0 ]; then
        attention "Échec de la création de l'enregistrement CloudFront pour www.$domain"
      else
        log "Enregistrement CloudFront pour www.$domain créé avec succès"
      fi
    fi
  done
  
  # Mettre à jour le certificat de la distribution CloudFront
  update_cloudfront_certificate
  if [ $? -ne 0 ]; then
    attention "Échec de la mise à jour du certificat CloudFront"
  else
    log "Certificat CloudFront mis à jour avec succès"
  fi
  
  log "Configuration DNS et SSL terminée!"
  info "Note: La propagation DNS peut prendre jusqu'à 48 heures."
  info "Note: La validation des certificats SSL peut prendre jusqu'à 24 heures."
}

# Exécuter la fonction principale
main
