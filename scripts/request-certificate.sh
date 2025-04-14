#!/bin/bash

# Script pour demander un certificat SSL pour FloDrama
# Ce script demande un certificat SSL et affiche les instructions de validation DNS

echo "🔒 Demande de certificat SSL pour FloDrama"
echo "=========================================="

# Couleurs pour l'identité visuelle FloDrama
BLUE="#3b82f6"
FUCHSIA="#d946ef"

# Fonction pour afficher les messages avec le style FloDrama
function flodrama_echo() {
  echo -e "\033[38;2;59;130;246m▶\033[0m \033[38;2;217;70;239m$1\033[0m"
}

# Vérifier les prérequis
flodrama_echo "Vérification des prérequis..."
if ! command -v aws &> /dev/null; then
  echo "❌ AWS CLI n'est pas installé. Veuillez l'installer et configurer vos identifiants."
  exit 1
fi

if ! command -v jq &> /dev/null; then
  echo "❌ jq n'est pas installé. Veuillez l'installer pour traiter les réponses JSON."
  exit 1
fi

# Paramètres
DOMAIN_NAME="flodrama.com"
ALTERNATE_DOMAIN="www.flodrama.com"
REGION="us-east-1"  # Les certificats ACM pour CloudFront doivent être en us-east-1

# Demander le certificat
flodrama_echo "Demande du certificat SSL pour $DOMAIN_NAME et $ALTERNATE_DOMAIN..."
CERTIFICATE_ARN=$(aws acm request-certificate \
  --domain-name $DOMAIN_NAME \
  --subject-alternative-names $ALTERNATE_DOMAIN \
  --validation-method DNS \
  --region $REGION \
  --output text)

if [ -z "$CERTIFICATE_ARN" ]; then
  echo "❌ Échec de la demande de certificat."
  exit 1
fi

echo "✅ Certificat demandé avec succès: $CERTIFICATE_ARN"

# Attendre que les informations de validation soient disponibles
flodrama_echo "Attente des informations de validation DNS..."
sleep 10

# Récupérer les informations de validation DNS
VALIDATION_INFO=$(aws acm describe-certificate \
  --certificate-arn $CERTIFICATE_ARN \
  --region $REGION \
  --query "Certificate.DomainValidationOptions" \
  --output json)

# Afficher les instructions de validation
flodrama_echo "Instructions de validation DNS:"
echo "Pour valider votre certificat, créez les enregistrements DNS suivants:"
echo ""

echo "$VALIDATION_INFO" | jq -r '.[] | "Domaine: \(.DomainName)\nNom: \(.ResourceRecord.Name)\nType: \(.ResourceRecord.Type)\nValeur: \(.ResourceRecord.Value)\n"'

echo ""
flodrama_echo "Enregistrez le certificat ARN pour l'utiliser lors du déploiement CloudFront:"
echo "CERTIFICATE_ARN=$CERTIFICATE_ARN"
echo ""
echo "Une fois les enregistrements DNS configurés, la validation peut prendre jusqu'à 30 minutes."
echo "Vous pouvez vérifier l'état du certificat avec la commande:"
echo "aws acm describe-certificate --certificate-arn $CERTIFICATE_ARN --region $REGION --query Certificate.Status"

# Enregistrer l'ARN du certificat pour une utilisation ultérieure
echo "CERTIFICATE_ARN=$CERTIFICATE_ARN" > certificate-arn.txt
