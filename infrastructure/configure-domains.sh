#!/bin/bash
# Script de configuration des domaines pour FloDrama sur AWS
# Ce script permet de configurer et vérifier les domaines existants
# pour la nouvelle architecture AWS de FloDrama

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages d'information
info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

# Fonction pour afficher les messages de succès
success() {
  echo -e "${GREEN}[SUCCÈS]${NC} $1"
}

# Fonction pour afficher les messages d'avertissement
warning() {
  echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

# Fonction pour afficher les messages d'erreur
error() {
  echo -e "${RED}[ERREUR]${NC} $1"
}

# Vérifier les dépendances
if ! command -v aws &> /dev/null; then
  error "La commande 'aws' n'est pas installée. Veuillez l'installer avant de continuer."
  exit 1
fi

if ! command -v terraform &> /dev/null; then
  error "La commande 'terraform' n'est pas installée. Veuillez l'installer avant de continuer."
  exit 1
fi

if ! command -v jq &> /dev/null; then
  error "La commande 'jq' n'est pas installée. Veuillez l'installer avant de continuer."
  exit 1
fi

# Définir les variables d'environnement
ENV=${1:-"dev"}
TERRAFORM_DIR="./terraform"
CONFIG_FILE="./domains-config.json"

# Vérifier si le fichier de configuration existe
if [ ! -f "$CONFIG_FILE" ]; then
  info "Création du fichier de configuration des domaines..."
  
  # Demander les informations sur les domaines
  read -p "Domaine principal (ex: flodrama.com): " MAIN_DOMAIN
  read -p "Domaine de développement (ex: dev.flodrama.com) [laisser vide si non applicable]: " DEV_DOMAIN
  read -p "Domaine de staging (ex: staging.flodrama.com) [laisser vide si non applicable]: " STAGING_DOMAIN
  read -p "Sous-domaine pour l'API (ex: api.flodrama.com): " API_DOMAIN
  read -p "Sous-domaine pour l'administration (ex: admin.flodrama.com): " ADMIN_DOMAIN
  read -p "Sous-domaine pour les médias (ex: media.flodrama.com): " MEDIA_DOMAIN
  
  # Créer le fichier de configuration JSON
  cat > "$CONFIG_FILE" << EOF
{
  "main_domain": "$MAIN_DOMAIN",
  "dev_domain": "$DEV_DOMAIN",
  "staging_domain": "$STAGING_DOMAIN",
  "api_domain": "$API_DOMAIN",
  "admin_domain": "$ADMIN_DOMAIN",
  "media_domain": "$MEDIA_DOMAIN",
  "environment": "$ENV"
}
EOF
  
  success "Fichier de configuration des domaines créé avec succès"
else
  info "Utilisation du fichier de configuration des domaines existant"
  
  # Charger les informations du fichier de configuration
  MAIN_DOMAIN=$(jq -r '.main_domain' "$CONFIG_FILE")
  DEV_DOMAIN=$(jq -r '.dev_domain' "$CONFIG_FILE")
  STAGING_DOMAIN=$(jq -r '.staging_domain' "$CONFIG_FILE")
  API_DOMAIN=$(jq -r '.api_domain' "$CONFIG_FILE")
  ADMIN_DOMAIN=$(jq -r '.admin_domain' "$CONFIG_FILE")
  MEDIA_DOMAIN=$(jq -r '.media_domain' "$CONFIG_FILE")
  ENV=$(jq -r '.environment' "$CONFIG_FILE")
fi

# Fonction pour vérifier si une zone hébergée existe
check_hosted_zone() {
  local domain=$1
  info "Vérification de la zone hébergée pour $domain..."
  
  # Vérifier si la zone hébergée existe
  if aws route53 list-hosted-zones-by-name --dns-name "$domain." --max-items 1 | grep -q "Id"; then
    success "Zone hébergée trouvée pour $domain"
    return 0
  else
    warning "Aucune zone hébergée trouvée pour $domain"
    return 1
  fi
}

# Fonction pour créer une zone hébergée
create_hosted_zone() {
  local domain=$1
  info "Création de la zone hébergée pour $domain..."
  
  # Créer la zone hébergée
  aws route53 create-hosted-zone --name "$domain." --caller-reference "$(date +%s)" --hosted-zone-config Comment="Zone hébergée pour $domain"
  
  if [ $? -eq 0 ]; then
    success "Zone hébergée créée avec succès pour $domain"
    
    # Afficher les serveurs de noms
    local nameservers=$(aws route53 list-hosted-zones-by-name --dns-name "$domain." --max-items 1 | jq -r '.HostedZones[0].Id' | xargs -I{} aws route53 get-hosted-zone --id {} | jq -r '.DelegationSet.NameServers[]')
    
    info "Serveurs de noms pour $domain:"
    echo "$nameservers" | while read ns; do
      echo "  - $ns"
    done
    
    warning "Veuillez mettre à jour les serveurs de noms chez votre registrar pour $domain"
  else
    error "Erreur lors de la création de la zone hébergée pour $domain"
  fi
}

# Fonction pour vérifier si un certificat SSL existe
check_certificate() {
  local domain=$1
  info "Vérification du certificat SSL pour $domain..."
  
  # Vérifier si un certificat SSL existe
  if aws acm list-certificates --certificate-statuses ISSUED | jq -r '.CertificateSummaryList[].DomainName' | grep -q "$domain\|*.$domain"; then
    success "Certificat SSL trouvé pour $domain"
    return 0
  else
    warning "Aucun certificat SSL trouvé pour $domain"
    return 1
  fi
}

# Fonction pour générer les variables Terraform pour les domaines
generate_terraform_variables() {
  info "Génération des variables Terraform pour les domaines..."
  
  # Créer le fichier de variables Terraform
  cat > "$TERRAFORM_DIR/domains.auto.tfvars" << EOF
# Variables de domaine pour FloDrama
# Générées automatiquement par le script configure-domains.sh

domain_name = "$MAIN_DOMAIN"
api_subdomain = "api"
admin_subdomain = "admin"
media_subdomain = "media"
EOF
  
  success "Variables Terraform générées avec succès"
}

# Fonction principale
main() {
  info "Configuration des domaines pour FloDrama sur AWS (environnement: $ENV)..."
  
  # Vérifier la zone hébergée principale
  if ! check_hosted_zone "$MAIN_DOMAIN"; then
    read -p "Voulez-vous créer une zone hébergée pour $MAIN_DOMAIN? (o/n): " CREATE_ZONE
    if [ "$CREATE_ZONE" = "o" ] || [ "$CREATE_ZONE" = "O" ]; then
      create_hosted_zone "$MAIN_DOMAIN"
    fi
  fi
  
  # Vérifier le certificat SSL
  check_certificate "$MAIN_DOMAIN"
  
  # Générer les variables Terraform
  generate_terraform_variables
  
  # Afficher les informations de configuration
  info "Configuration des domaines terminée"
  info "Domaine principal: $MAIN_DOMAIN"
  [ ! -z "$DEV_DOMAIN" ] && info "Domaine de développement: $DEV_DOMAIN"
  [ ! -z "$STAGING_DOMAIN" ] && info "Domaine de staging: $STAGING_DOMAIN"
  info "Sous-domaine API: $API_DOMAIN"
  info "Sous-domaine Admin: $ADMIN_DOMAIN"
  info "Sous-domaine Média: $MEDIA_DOMAIN"
  
  success "Les domaines sont prêts à être utilisés avec la nouvelle architecture AWS"
  info "Pour déployer l'infrastructure avec ces domaines, exécutez: ./deploy.sh $ENV"
}

# Exécuter la fonction principale
main
