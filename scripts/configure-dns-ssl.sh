#!/bin/bash
# Script de configuration DNS et SSL pour FloDrama sur AWS et GitHub Pages
# Mis à jour le 14-04-2025

# Configuration
REGION="us-east-1"
DOMAINS=("flodrama.com" "www.flodrama.com" "api.flodrama.com" "dev.flodrama.com")
DISTRIBUTION_ID="E1MU6L4S4UVUSS"
CERTIFICATE_ARN="arn:aws:acm:us-east-1:108782079729:certificate/19fa1966-523e-44f3-84bb-7e43aedc0af9"
GITHUB_USERNAME="flori92"
GITHUB_REPO="FloDrama"

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

# Fonction pour ajouter des enregistrements pour GitHub Pages
create_github_pages_records() {
  local domain=$1
  local zone_id=$2
  
  log "Configuration des enregistrements DNS pour GitHub Pages pour $domain..."
  
  # Créer le fichier de changement
  if [ "$domain" = "flodrama.com" ]; then
    # Pour le domaine apex (racine)
    cat > github-pages-changes.json << EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$domain.",
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
        "Name": "_github-pages-challenge-$GITHUB_USERNAME.$domain.",
        "Type": "TXT",
        "TTL": 3600,
        "ResourceRecords": [
          { "Value": "\"$(aws ssm get-parameter --name "/flodrama/github-pages-challenge-code" --with-decryption --query "Parameter.Value" --output text || echo "challenge-code-not-found")\"" }
        ]
      }
    }
  ]
}
EOF
  else
    # Pour les sous-domaines
    cat > github-pages-changes.json << EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$domain.",
        "Type": "CNAME",
        "TTL": 3600,
        "ResourceRecords": [
          { "Value": "$GITHUB_USERNAME.github.io." }
        ]
      }
    }
  ]
}
EOF
  fi
  
  # Appliquer le changement
  aws route53 change-resource-record-sets --hosted-zone-id "$zone_id" --change-batch file://github-pages-changes.json
  local result=$?
  
  # Nettoyer
  rm -f github-pages-changes.json
  
  return $result
}

# Fonction pour configurer l'API
configure_api_dns() {
  local domain="api.flodrama.com"
  local zone_id=$1
  
  log "Configuration de l'enregistrement DNS pour l'API..."
  
  # Créer le fichier de changement
  cat > api-changes.json << EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$domain.",
        "Type": "CNAME",
        "TTL": 3600,
        "ResourceRecords": [
          { "Value": "flodrama-api.herokuapp.com." }
        ]
      }
    }
  ]
}
EOF
  
  # Appliquer le changement
  aws route53 change-resource-record-sets --hosted-zone-id "$zone_id" --change-batch file://api-changes.json
  local result=$?
  
  # Nettoyer
  rm -f api-changes.json
  
  return $result
}

# Fonction pour mettre à jour le certificat ACM
update_acm_certificate() {
  log "Vérification du certificat ACM..."
  
  # Vérifier si le certificat existe et sa date d'expiration
  local cert_expiry=$(aws acm describe-certificate --certificate-arn "$CERTIFICATE_ARN" --query "Certificate.NotAfter" --output text 2>/dev/null)
  
  if [ -z "$cert_expiry" ]; then
    attention "Le certificat ACM n'existe pas ou n'est pas accessible. Création d'un nouveau certificat..."
    
    # Créer un nouveau certificat
    local new_cert_arn=$(aws acm request-certificate \
      --domain-name "flodrama.com" \
      --subject-alternative-names "*.flodrama.com" \
      --validation-method DNS \
      --query "CertificateArn" \
      --output text)
    
    if [ -z "$new_cert_arn" ]; then
      erreur "Échec de la création du certificat ACM"
      return 1
    fi
    
    log "Nouveau certificat ACM créé: $new_cert_arn"
    CERTIFICATE_ARN="$new_cert_arn"
    
    # Mettre à jour le paramètre SSM
    aws ssm put-parameter \
      --name "/flodrama/ssl-certificate-arn" \
      --value "$CERTIFICATE_ARN" \
      --type "String" \
      --overwrite
  else
    # Convertir la date d'expiration en timestamp Unix
    local expiry_timestamp=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${cert_expiry%.*}" +%s)
    local current_timestamp=$(date +%s)
    local days_remaining=$(( (expiry_timestamp - current_timestamp) / 86400 ))
    
    if [ "$days_remaining" -lt 30 ]; then
      attention "Le certificat ACM expire dans $days_remaining jours. Renouvellement recommandé."
    else
      info "Le certificat ACM est valide pour encore $days_remaining jours."
    fi
  fi
  
  return 0
}

# Fonction pour configurer GitHub Pages avec HTTPS
configure_github_pages_https() {
  log "Configuration de GitHub Pages pour utiliser HTTPS..."
  
  # Vérifier si le fichier CNAME existe
  if [ ! -f "../CNAME" ]; then
    log "Création du fichier CNAME..."
    echo "flodrama.com" > "../CNAME"
  else
    info "Le fichier CNAME existe déjà."
  fi
  
  # Vérifier si le répertoire public existe
  if [ ! -d "../public" ]; then
    log "Création du répertoire public..."
    mkdir -p "../public"
  fi
  
  # Créer le fichier _headers pour les en-têtes de sécurité
  log "Création du fichier _headers pour les en-têtes de sécurité..."
  cat > "../public/_headers" << EOF
/*
  Strict-Transport-Security: max-age=63072000; includeSubdomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://*.cloudfront.net https://*.bunnycdn.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.flodrama.com https://api.flodrama.com; frame-ancestors 'none'; upgrade-insecure-requests;

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Content-Type: text/css
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Content-Type: application/javascript
  Cache-Control: public, max-age=31536000, immutable

/api/*
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE
  Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control
  Access-Control-Expose-Headers: Content-Length, Content-Range
EOF
  
  return 0
}

# Fonction principale
main() {
  log "Début de la configuration DNS et SSL pour FloDrama sur AWS et GitHub Pages..."
  
  # Mettre à jour le certificat ACM
  update_acm_certificate
  if [ $? -ne 0 ]; then
    attention "Problème avec la mise à jour du certificat ACM"
  fi
  
  # Configurer GitHub Pages pour HTTPS
  configure_github_pages_https
  if [ $? -ne 0 ]; then
    attention "Problème avec la configuration HTTPS de GitHub Pages"
  fi
  
  # Pour le domaine principal
  local main_domain="flodrama.com"
  create_hosted_zone "$main_domain"
  if [ $? -ne 0 ]; then
    attention "Échec de la création de la zone hébergée pour $main_domain"
  else
    # Obtenir l'ID de la zone
    local zone_id=$(aws route53 list-hosted-zones-by-name --dns-name "$main_domain." --max-items 1 --query "HostedZones[?Name=='$main_domain.'].Id" --output text | cut -d'/' -f3)
    
    if [ -z "$zone_id" ]; then
      attention "Impossible de trouver l'ID de la zone pour $main_domain"
    else
      # Configurer les enregistrements pour GitHub Pages
      create_github_pages_records "$main_domain" "$zone_id"
      if [ $? -ne 0 ]; then
        attention "Échec de la configuration des enregistrements GitHub Pages pour $main_domain"
      else
        log "Enregistrements GitHub Pages pour $main_domain configurés avec succès"
      fi
      
      # Configurer les sous-domaines
      for domain in "${DOMAINS[@]}"; do
        if [ "$domain" != "$main_domain" ]; then
          if [[ "$domain" == "api.flodrama.com" ]]; then
            configure_api_dns "$zone_id"
            if [ $? -ne 0 ]; then
              attention "Échec de la configuration de l'API DNS pour $domain"
            else
              log "API DNS pour $domain configuré avec succès"
            fi
          else
            create_github_pages_records "$domain" "$zone_id"
            if [ $? -ne 0 ]; then
              attention "Échec de la configuration des enregistrements GitHub Pages pour $domain"
            else
              log "Enregistrements GitHub Pages pour $domain configurés avec succès"
            fi
          fi
        fi
      done
    fi
  fi
  
  log "Configuration DNS et SSL terminée!"
  info "Note: La propagation DNS peut prendre jusqu'à 48 heures."
  info "Note: La validation des certificats SSL peut prendre jusqu'à 24 heures."
}

# Exécuter la fonction principale
main
