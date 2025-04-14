#!/bin/bash

# Script de déploiement de la configuration CloudFront pour FloDrama
# Ce script configure CloudFront devant GitHub Pages avec un certificat SSL

echo "🔒 Déploiement de la configuration CloudFront pour FloDrama"
echo "==========================================================="

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

# Paramètres
STACK_NAME="flodrama-github-distribution"
DOMAIN_NAME="flodrama.com"
ALTERNATE_DOMAIN="www.flodrama.com"
GITHUB_PAGES_ORIGIN="flori92.github.io"
REGION="eu-west-3"  # Paris
TEMPLATE_FILE="../cloudformation/github-pages-distribution.yaml"

# Vérifier si la pile existe déjà
flodrama_echo "Vérification de l'existence de la pile CloudFormation..."
if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION &> /dev/null; then
  STACK_EXISTS=true
  flodrama_echo "La pile $STACK_NAME existe déjà, elle sera mise à jour."
else
  STACK_EXISTS=false
  flodrama_echo "La pile $STACK_NAME n'existe pas, elle sera créée."
fi

# Empaqueter la fonction Lambda
flodrama_echo "Préparation de la fonction Lambda pour les en-têtes de sécurité..."
mkdir -p build
cp ../src/lambda/security-headers.js build/
cd build
zip -r security-headers.zip security-headers.js
cd ..

# Créer ou mettre à jour la pile CloudFormation
flodrama_echo "Déploiement de la pile CloudFormation..."
if [ "$STACK_EXISTS" = true ]; then
  # Mettre à jour la pile existante
  aws cloudformation update-stack \
    --stack-name $STACK_NAME \
    --template-body file://$TEMPLATE_FILE \
    --parameters ParameterKey=DomainName,ParameterValue=$DOMAIN_NAME \
                 ParameterKey=AlternateDomainNames,ParameterValue=$ALTERNATE_DOMAIN \
                 ParameterKey=GitHubPagesOrigin,ParameterValue=$GITHUB_PAGES_ORIGIN \
    --capabilities CAPABILITY_IAM \
    --region $REGION
  
  # Attendre que la mise à jour soit terminée
  flodrama_echo "Attente de la mise à jour de la pile CloudFormation..."
  aws cloudformation wait stack-update-complete --stack-name $STACK_NAME --region $REGION
else
  # Créer une nouvelle pile
  aws cloudformation create-stack \
    --stack-name $STACK_NAME \
    --template-body file://$TEMPLATE_FILE \
    --parameters ParameterKey=DomainName,ParameterValue=$DOMAIN_NAME \
                 ParameterKey=AlternateDomainNames,ParameterValue=$ALTERNATE_DOMAIN \
                 ParameterKey=GitHubPagesOrigin,ParameterValue=$GITHUB_PAGES_ORIGIN \
    --capabilities CAPABILITY_IAM \
    --region $REGION
  
  # Attendre que la création soit terminée
  flodrama_echo "Attente de la création de la pile CloudFormation..."
  aws cloudformation wait stack-create-complete --stack-name $STACK_NAME --region $REGION
fi

# Récupérer les informations de sortie
flodrama_echo "Récupération des informations de la distribution CloudFront..."
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text \
  --region $REGION)

CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomainName'].OutputValue" \
  --output text \
  --region $REGION)

CERTIFICATE_ARN=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query "Stacks[0].Outputs[?OutputKey=='CertificateARN'].OutputValue" \
  --output text \
  --region $REGION)

# Afficher les instructions pour la configuration DNS
flodrama_echo "Configuration DNS requise pour $DOMAIN_NAME:"
echo "Pour valider le certificat SSL et diriger le trafic vers CloudFront, configurez les enregistrements DNS suivants:"
echo ""
echo "1. Enregistrements CNAME pour la validation du certificat (suivez les instructions dans AWS Certificate Manager)"
echo ""
echo "2. Une fois le certificat validé, configurez les enregistrements suivants:"
echo "   $DOMAIN_NAME.             CNAME    $CLOUDFRONT_DOMAIN."
echo "   www.$DOMAIN_NAME.         CNAME    $CLOUDFRONT_DOMAIN."
echo ""

# Afficher un résumé
flodrama_echo "Déploiement terminé avec succès !"
echo "✅ Distribution CloudFront créée/mise à jour: $DISTRIBUTION_ID"
echo "✅ Domaine CloudFront: $CLOUDFRONT_DOMAIN"
echo "✅ Certificat SSL demandé: $CERTIFICATE_ARN"
echo ""
echo "🔍 Vérifiez l'état du certificat dans AWS Certificate Manager et suivez les instructions pour la validation DNS."
echo "⏱️ Une fois le certificat validé, la distribution CloudFront sera automatiquement déployée (peut prendre 15-30 minutes)."
echo ""
echo "🎉 Votre site FloDrama sera accessible via HTTPS à l'adresse https://$DOMAIN_NAME une fois la configuration terminée !"
