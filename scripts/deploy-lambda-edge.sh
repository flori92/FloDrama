#!/bin/bash

# Couleurs pour les messages
VERT='\033[0;32m'
ROUGE='\033[0;31m'
JAUNE='\033[0;33m'
BLEU='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
afficher_message() {
  echo -e "${BLEU}[$(date +"%H:%M:%S")] ${1}${NC}"
}

# Fonction pour afficher les erreurs
afficher_erreur() {
  echo -e "${ROUGE}[$(date +"%H:%M:%S")] ERREUR: ${1}${NC}"
}

# Fonction pour afficher les succès
afficher_succes() {
  echo -e "${VERT}[$(date +"%H:%M:%S")] SUCCÈS: ${1}${NC}"
}

# ID de la distribution CloudFront
DISTRIBUTION_ID="E5XC74WR62W9Z"

# Région pour Lambda@Edge (doit être us-east-1)
REGION="us-east-1"

# Nom de la fonction Lambda
LAMBDA_NAME="FloDrama-SecurityHeaders"

# Chemin vers le code source de la fonction Lambda
LAMBDA_SOURCE_DIR="$(pwd)/aws/lambda"

# Vérifier les identifiants AWS
afficher_message "Vérification des identifiants AWS..."
if ! aws sts get-caller-identity &> /dev/null; then
  afficher_erreur "Les identifiants AWS ne sont pas configurés correctement. Exécutez 'aws configure' pour les configurer."
  exit 1
fi

# Créer un répertoire temporaire pour le package Lambda
afficher_message "Création du package Lambda..."
TEMP_DIR=$(mktemp -d)
cp "$LAMBDA_SOURCE_DIR/security-headers.js" "$TEMP_DIR/index.js"
cd "$TEMP_DIR"

# Créer le package ZIP
zip -r function.zip index.js
cd - > /dev/null

# Créer un rôle IAM pour Lambda@Edge
afficher_message "Création du rôle IAM pour Lambda@Edge..."
ROLE_NAME="FloDrama-LambdaEdgeRole"

# Vérifier si le rôle existe déjà
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text --region $REGION 2>/dev/null)

if [ $? -ne 0 ]; then
  # Créer le document de politique d'approbation
  cat > "$TEMP_DIR/trust-policy.json" << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": [
          "lambda.amazonaws.com",
          "edgelambda.amazonaws.com"
        ]
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

  # Créer le rôle IAM
  ROLE_ARN=$(aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document file://"$TEMP_DIR/trust-policy.json" \
    --query 'Role.Arn' \
    --output text \
    --region $REGION)

  # Attacher la politique AWSLambdaBasicExecutionRole
  aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
    --region $REGION

  # Attendre que le rôle soit disponible
  afficher_message "Attente de la propagation du rôle IAM..."
  sleep 10
fi

afficher_succes "Rôle IAM configuré: $ROLE_ARN"

# Vérifier si la fonction Lambda existe déjà
LAMBDA_ARN=$(aws lambda get-function --function-name $LAMBDA_NAME --query 'Configuration.FunctionArn' --output text --region $REGION 2>/dev/null)

if [ $? -ne 0 ]; then
  # Créer la fonction Lambda
  afficher_message "Création de la fonction Lambda..."
  LAMBDA_RESULT=$(aws lambda create-function \
    --function-name $LAMBDA_NAME \
    --runtime nodejs16.x \
    --role $ROLE_ARN \
    --handler index.handler \
    --zip-file fileb://"$TEMP_DIR/function.zip" \
    --description "Fonction Lambda@Edge pour ajouter des en-têtes de sécurité" \
    --publish \
    --output json \
    --region $REGION)
  
  LAMBDA_ARN=$(echo "$LAMBDA_RESULT" | jq -r '.FunctionArn')
  LAMBDA_VERSION=$(echo "$LAMBDA_RESULT" | jq -r '.Version')
else
  # Mettre à jour la fonction Lambda
  afficher_message "Mise à jour de la fonction Lambda..."
  LAMBDA_RESULT=$(aws lambda update-function-code \
    --function-name $LAMBDA_NAME \
    --zip-file fileb://"$TEMP_DIR/function.zip" \
    --publish \
    --output json \
    --region $REGION)
  
  LAMBDA_ARN=$(echo "$LAMBDA_RESULT" | jq -r '.FunctionArn')
  LAMBDA_VERSION=$(echo "$LAMBDA_RESULT" | jq -r '.Version')
fi

# Construire l'ARN complet avec la version
LAMBDA_ARN_WITH_VERSION=$(echo $LAMBDA_ARN | sed "s/:[0-9]\+$/:$LAMBDA_VERSION/")
if [[ $LAMBDA_ARN_WITH_VERSION != *:$LAMBDA_VERSION ]]; then
  LAMBDA_ARN_WITH_VERSION="${LAMBDA_ARN}:${LAMBDA_VERSION}"
fi

afficher_succes "Fonction Lambda déployée: $LAMBDA_ARN_WITH_VERSION"

# Attendre que la fonction Lambda soit active
afficher_message "Attente de l'activation de la fonction Lambda..."
LAMBDA_STATE="Pending"
while [ "$LAMBDA_STATE" == "Pending" ]; do
  sleep 5
  LAMBDA_STATE=$(aws lambda get-function --function-name "${LAMBDA_NAME}:${LAMBDA_VERSION}" --query 'Configuration.State' --output text --region $REGION)
  afficher_message "État actuel de la fonction Lambda: $LAMBDA_STATE"
done

if [ "$LAMBDA_STATE" != "Active" ]; then
  afficher_erreur "La fonction Lambda n'a pas pu être activée. État actuel: $LAMBDA_STATE"
  exit 1
fi

afficher_succes "La fonction Lambda est maintenant active."

# Obtenir la configuration actuelle de la distribution CloudFront
afficher_message "Récupération de la configuration CloudFront..."
aws cloudfront get-distribution-config \
  --id $DISTRIBUTION_ID \
  --output json > "$TEMP_DIR/cf-config.json"

# Extraire l'ETag
ETAG=$(jq -r '.ETag' "$TEMP_DIR/cf-config.json")

# Modifier la configuration pour ajouter la fonction Lambda@Edge
jq --arg lambda_arn "$LAMBDA_ARN_WITH_VERSION" '.DistributionConfig.DefaultCacheBehavior.LambdaFunctionAssociations = {"Quantity": 1, "Items": [{"EventType": "origin-response", "LambdaFunctionARN": $lambda_arn, "IncludeBody": false}]}' "$TEMP_DIR/cf-config.json" > "$TEMP_DIR/cf-config-updated.json"

# Extraire uniquement la partie DistributionConfig
jq '.DistributionConfig' "$TEMP_DIR/cf-config-updated.json" > "$TEMP_DIR/cf-config-final.json"

# Mettre à jour la distribution CloudFront
afficher_message "Mise à jour de la distribution CloudFront..."
aws cloudfront update-distribution \
  --id $DISTRIBUTION_ID \
  --if-match $ETAG \
  --distribution-config file://"$TEMP_DIR/cf-config-final.json" \
  --output json > /dev/null

afficher_succes "Distribution CloudFront mise à jour avec succès."
afficher_message "La fonction Lambda@Edge a été associée à la distribution CloudFront."
afficher_message "Le déploiement peut prendre jusqu'à 15 minutes pour être propagé."

# Nettoyer les fichiers temporaires
rm -rf "$TEMP_DIR"

afficher_message "Opération terminée."
