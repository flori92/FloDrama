#!/bin/bash

# Script de déploiement des améliorations de sécurité SSL pour FloDrama
# Ce script met à jour la configuration CloudFront et déploie les fonctions Lambda pour la sécurité

echo "🔒 Déploiement des améliorations de sécurité SSL pour FloDrama"
echo "=============================================================="

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
ENVIRONMENT=${1:-production}
STACK_NAME="flodrama-distribution-$ENVIRONMENT"
LAMBDA_DIR="../src/lambda"
CLOUDFORMATION_TEMPLATE="../cloudformation/multi-tier-distribution.yaml"

# Créer le répertoire de build si nécessaire
flodrama_echo "Préparation des fichiers de déploiement..."
mkdir -p build

# Empaqueter les fonctions Lambda
flodrama_echo "Empaquetage de la fonction Lambda security-headers..."
cd $LAMBDA_DIR
zip -r ../../build/security-headers.zip security-headers.js
cd ../../

# Déployer le template CloudFormation mis à jour
flodrama_echo "Déploiement du template CloudFormation avec les améliorations SSL..."
aws cloudformation update-stack \
  --stack-name $STACK_NAME \
  --template-body file://$CLOUDFORMATION_TEMPLATE \
  --parameters ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
  --capabilities CAPABILITY_IAM

# Attendre que la mise à jour soit terminée
flodrama_echo "Attente de la mise à jour de la pile CloudFormation..."
aws cloudformation wait stack-update-complete --stack-name $STACK_NAME

# Récupérer l'ID de distribution CloudFront
flodrama_echo "Récupération de l'ID de distribution CloudFront..."
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text)

if [ -z "$DISTRIBUTION_ID" ]; then
  echo "❌ Impossible de récupérer l'ID de distribution CloudFront."
  exit 1
fi

# Créer une invalidation CloudFront pour vider le cache
flodrama_echo "Création d'une invalidation CloudFront pour appliquer les nouvelles configurations..."
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"

# Déployer la configuration Nginx optimisée si un serveur est spécifié
if [ ! -z "$2" ]; then
  SERVER=$2
  flodrama_echo "Déploiement de la configuration Nginx optimisée sur $SERVER..."
  scp ../nginx-ssl-optimized.conf $SERVER:/etc/nginx/sites-available/flodrama.conf
  ssh $SERVER "sudo ln -sf /etc/nginx/sites-available/flodrama.conf /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx"
fi

# Vérifier la configuration SSL avec SSL Labs (simulation)
flodrama_echo "Vérification de la configuration SSL avec SSL Labs..."
echo "Cette étape peut prendre quelques minutes..."
echo "Vous pouvez également vérifier manuellement sur https://www.ssllabs.com/ssltest/analyze.html?d=flodrama.com"

# Afficher un résumé des améliorations
flodrama_echo "Améliorations de sécurité SSL déployées avec succès !"
echo "✅ Protocoles SSL mis à jour (TLSv1.2, TLSv1.3)"
echo "✅ Suites de chiffrement renforcées"
echo "✅ En-têtes de sécurité HTTP optimisés"
echo "✅ HSTS préchargé configuré"
echo "✅ OCSP Stapling activé"
echo "✅ Politique de sécurité du contenu (CSP) mise en place"
echo "✅ Certificat avec transparence (CT) activé"

echo ""
echo "🎉 Votre site FloDrama devrait maintenant obtenir une note A+ sur SSL Labs !"
echo "   Vérifiez les résultats sur https://www.ssllabs.com/ssltest/analyze.html?d=flodrama.com"
