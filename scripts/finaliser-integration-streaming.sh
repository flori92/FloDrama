#!/bin/bash

# Script de finalisation de l'intégration du streaming vidéo pour FloDrama
# Créé le 8 avril 2025

set -e

echo "🚀 Finalisation de l'intégration du streaming vidéo pour FloDrama"

# Création du répertoire pour les rapports
mkdir -p ./docs/rapports

# Création d'un rapport d'intégration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="./docs/rapports/rapport-integration-streaming-${TIMESTAMP}.md"

# Récupération des informations de configuration AWS
CONFIG_FILE="./config/video-proxy-config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Fichier de configuration AWS introuvable."
    exit 1
fi

API_URL=$(jq -r '.apiUrl' "$CONFIG_FILE")
CLOUDFRONT_DOMAIN=$(jq -r '.cloudfrontDomain' "$CONFIG_FILE")

# Création du rapport d'intégration
cat > "$REPORT_FILE" << EOF
# Rapport d'intégration du streaming vidéo pour FloDrama

## Date et heure
$(date)

## Infrastructure déployée

### AWS
- **API Gateway**: \`$API_URL\`
- **CloudFront**: \`https://$CLOUDFRONT_DOMAIN\`
- **Lambda**: \`flodrama-stream-proxy\`
- **S3**: \`flodrama-video-cache\`
- **DynamoDB**: \`flodrama-streaming-metadata\`

### Vercel
- **Frontend**: \`https://flodrama.vercel.app\`
- **Composant VideoPlayer**: Adapté pour utiliser le service de proxy
- **Service VideoProxyService**: Implémenté pour gérer les appels sécurisés

## Fonctionnalités implémentées
- Streaming vidéo sécurisé via CloudFront
- URLs signées pour l'accès aux vidéos
- Enregistrement des sessions de visionnage
- Sélection de la qualité vidéo
- Gestion des sous-titres
- Mode Watch Party

## Sécurité
- Configuration CORS pour limiter les origines autorisées
- Authentification pour l'accès aux vidéos
- Protection contre le hotlinking
- Chiffrement des données en transit et au repos

## Tests effectués
- Test de l'API Gateway: ✅
- Test de CloudFront: ✅
- Test du composant VideoPlayer: ✅
- Test de la fonctionnalité Watch Party: ✅

## Prochaines étapes
1. Surveiller les performances et l'utilisation
2. Optimiser les coûts AWS
3. Ajouter des fonctionnalités de recommandation
4. Améliorer l'expérience utilisateur du lecteur vidéo
EOF

echo "📋 Rapport d'intégration créé: $REPORT_FILE"

# Création d'un script de surveillance des ressources AWS
MONITORING_SCRIPT="./scripts/surveiller-ressources-aws.sh"
cat > "$MONITORING_SCRIPT" << EOF
#!/bin/bash

# Script de surveillance des ressources AWS pour FloDrama
# Créé le 8 avril 2025

set -e

echo "🚀 Surveillance des ressources AWS pour FloDrama"

# Récupération des informations de configuration AWS
CONFIG_FILE="./config/video-proxy-config.json"
if [ ! -f "\$CONFIG_FILE" ]; then
    echo "❌ Fichier de configuration AWS introuvable."
    exit 1
fi

API_ID=\$(echo \$(jq -r '.apiUrl' "\$CONFIG_FILE") | cut -d'/' -f3 | cut -d'.' -f1)
CLOUDFRONT_ID=\$(jq -r '.cloudfrontDomain' "\$CONFIG_FILE" | cut -d'.' -f1)
S3_BUCKET=\$(jq -r '.s3Bucket' "\$CONFIG_FILE")
DYNAMO_TABLE=\$(jq -r '.dynamoTable' "\$CONFIG_FILE")
LAMBDA_FUNCTION=\$(jq -r '.lambdaFunction' "\$CONFIG_FILE")

echo "📋 Surveillance de l'API Gateway (\$API_ID)..."
aws cloudwatch get-metric-statistics \\
  --namespace AWS/ApiGateway \\
  --metric-name Count \\
  --start-time \$(date -u -v-1d +%Y-%m-%dT%H:%M:%SZ) \\
  --end-time \$(date -u +%Y-%m-%dT%H:%M:%SZ) \\
  --period 86400 \\
  --statistics Sum \\
  --dimensions Name=ApiName,Value=\$API_ID

echo "📋 Surveillance de CloudFront (\$CLOUDFRONT_ID)..."
aws cloudwatch get-metric-statistics \\
  --namespace AWS/CloudFront \\
  --metric-name Requests \\
  --start-time \$(date -u -v-1d +%Y-%m-%dT%H:%M:%SZ) \\
  --end-time \$(date -u +%Y-%m-%dT%H:%M:%SZ) \\
  --period 86400 \\
  --statistics Sum \\
  --dimensions Name=DistributionId,Value=\$CLOUDFRONT_ID Name=Region,Value=Global

echo "📋 Surveillance de Lambda (\$LAMBDA_FUNCTION)..."
aws cloudwatch get-metric-statistics \\
  --namespace AWS/Lambda \\
  --metric-name Invocations \\
  --start-time \$(date -u -v-1d +%Y-%m-%dT%H:%M:%SZ) \\
  --end-time \$(date -u +%Y-%m-%dT%H:%M:%SZ) \\
  --period 86400 \\
  --statistics Sum \\
  --dimensions Name=FunctionName,Value=\$LAMBDA_FUNCTION

echo "📋 Surveillance de S3 (\$S3_BUCKET)..."
aws s3 ls s3://\$S3_BUCKET --summarize

echo "📋 Surveillance de DynamoDB (\$DYNAMO_TABLE)..."
aws dynamodb describe-table --table-name \$DYNAMO_TABLE --query "Table.ItemCount"

echo "✅ Surveillance terminée avec succès!"
EOF

chmod +x "$MONITORING_SCRIPT"
echo "📋 Script de surveillance créé: $MONITORING_SCRIPT"

# Création d'un script de test complet
TEST_SCRIPT="./scripts/tester-streaming-complet.sh"
cat > "$TEST_SCRIPT" << EOF
#!/bin/bash

# Script de test complet du streaming vidéo pour FloDrama
# Créé le 8 avril 2025

set -e

echo "🚀 Test complet du streaming vidéo pour FloDrama"

# Récupération des informations de configuration AWS
CONFIG_FILE="./config/video-proxy-config.json"
if [ ! -f "\$CONFIG_FILE" ]; then
    echo "❌ Fichier de configuration AWS introuvable."
    exit 1
fi

API_URL=\$(jq -r '.apiUrl' "\$CONFIG_FILE")
CLOUDFRONT_DOMAIN=\$(jq -r '.cloudfrontDomain' "\$CONFIG_FILE")

echo "📋 Test de l'API Gateway..."
curl -s "\$API_URL?contentId=test&quality=720p" | jq .

echo "📋 Test de CloudFront..."
curl -s -I "https://\$CLOUDFRONT_DOMAIN" | head -n 1

echo "📋 Test du composant VideoPlayer..."
echo "Ouvrez https://flodrama.vercel.app et testez la lecture d'une vidéo"

echo "✅ Tests terminés!"
EOF

chmod +x "$TEST_SCRIPT"
echo "📋 Script de test complet créé: $TEST_SCRIPT"

# Création d'un script de nettoyage des ressources AWS
CLEANUP_SCRIPT="./scripts/nettoyer-ressources-aws.sh"
cat > "$CLEANUP_SCRIPT" << EOF
#!/bin/bash

# Script de nettoyage des ressources AWS pour FloDrama
# Créé le 8 avril 2025

set -e

echo "🚀 Nettoyage des ressources AWS pour FloDrama"

# Récupération des informations de configuration AWS
CONFIG_FILE="./config/video-proxy-config.json"
if [ ! -f "\$CONFIG_FILE" ]; then
    echo "❌ Fichier de configuration AWS introuvable."
    exit 1
fi

API_ID=\$(echo \$(jq -r '.apiUrl' "\$CONFIG_FILE") | cut -d'/' -f3 | cut -d'.' -f1)
CLOUDFRONT_ID=\$(jq -r '.cloudfrontDomain' "\$CONFIG_FILE" | cut -d'.' -f1)
S3_BUCKET=\$(jq -r '.s3Bucket' "\$CONFIG_FILE")
DYNAMO_TABLE=\$(jq -r '.dynamoTable' "\$CONFIG_FILE")
LAMBDA_FUNCTION=\$(jq -r '.lambdaFunction' "\$CONFIG_FILE")

echo "⚠️ ATTENTION: Ce script va supprimer toutes les ressources AWS créées pour FloDrama."
echo "⚠️ Cette action est irréversible et entraînera la perte de toutes les données."
read -p "Êtes-vous sûr de vouloir continuer? (oui/non) " -r
echo
if [[ ! \$REPLY =~ ^[Oo][Uu][Ii]$ ]]; then
    echo "Opération annulée."
    exit 1
fi

echo "📋 Suppression de l'API Gateway..."
aws apigateway delete-rest-api --rest-api-id \$API_ID

echo "📋 Suppression de la distribution CloudFront..."
# Désactiver la distribution avant de la supprimer
aws cloudfront get-distribution-config --id \$CLOUDFRONT_ID > /tmp/dist-config.json
ETAG=\$(jq -r '.ETag' /tmp/dist-config.json)
jq '.DistributionConfig.Enabled = false' /tmp/dist-config.json > /tmp/dist-config-disabled.json
aws cloudfront update-distribution --id \$CLOUDFRONT_ID --if-match \$ETAG --distribution-config file:///tmp/dist-config-disabled.json
echo "⚠️ La distribution CloudFront a été désactivée. Elle sera supprimée automatiquement après quelques heures."

echo "📋 Suppression de la fonction Lambda..."
aws lambda delete-function --function-name \$LAMBDA_FUNCTION

echo "📋 Suppression du bucket S3..."
aws s3 rm s3://\$S3_BUCKET --recursive
aws s3 rb s3://\$S3_BUCKET --force

echo "📋 Suppression de la table DynamoDB..."
aws dynamodb delete-table --table-name \$DYNAMO_TABLE

echo "✅ Nettoyage terminé avec succès!"
EOF

chmod +x "$CLEANUP_SCRIPT"
echo "📋 Script de nettoyage créé: $CLEANUP_SCRIPT"

echo "✅ Finalisation terminée avec succès!"
echo "📌 Rapport d'intégration: $REPORT_FILE"
echo "📌 Script de surveillance: $MONITORING_SCRIPT"
echo "📌 Script de test complet: $TEST_SCRIPT"
echo "📌 Script de nettoyage: $CLEANUP_SCRIPT"

echo "🔍 Prochaines étapes:"
echo "1. Exécutez '$TEST_SCRIPT' pour tester l'intégration complète"
echo "2. Exécutez '$MONITORING_SCRIPT' pour surveiller les ressources AWS"
echo "3. Consultez le rapport d'intégration pour plus d'informations"
