#!/bin/bash

# Script pour configurer CloudFront pour permettre l'accès public aux vidéos de test
# Créé le 8 avril 2025

set -e

echo "🚀 Configuration de CloudFront pour l'accès public aux vidéos de test"

# Récupération des informations de configuration AWS
CONFIG_FILE="./config/video-proxy-config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Fichier de configuration AWS introuvable. Veuillez d'abord exécuter le script configurer-proxy-video-aws.sh."
    exit 1
fi

# Récupération du nom du bucket S3
S3_BUCKET=$(jq -r '.s3Bucket' "$CONFIG_FILE")
CLOUDFRONT_DOMAIN=$(jq -r '.cloudfrontDomain' "$CONFIG_FILE")
CLOUDFRONT_ID=$(jq -r '.cloudfrontId' "$CONFIG_FILE")

echo "📋 Bucket S3: $S3_BUCKET"
echo "📋 Domaine CloudFront: $CLOUDFRONT_DOMAIN"
echo "📋 ID CloudFront: $CLOUDFRONT_ID"

# Création d'une politique de bucket S3 pour permettre l'accès public aux vidéos de test
echo "📋 Création d'une politique de bucket S3 pour l'accès public aux vidéos de test..."

POLICY_JSON=$(cat <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadForGetBucketObjects",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::${S3_BUCKET}/test/*"
        }
    ]
}
EOF
)

# Mise à jour de la politique du bucket S3
echo "📋 Mise à jour de la politique du bucket S3..."
echo "$POLICY_JSON" > /tmp/bucket-policy.json
aws s3api put-bucket-policy --bucket $S3_BUCKET --policy file:///tmp/bucket-policy.json

# Mise à jour de la configuration de CloudFront pour désactiver les restrictions d'accès pour le chemin /test/*
echo "📋 Récupération de la configuration CloudFront actuelle..."
aws cloudfront get-distribution-config --id $CLOUDFRONT_ID > /tmp/cloudfront-config.json

# Extraction de l'ETag
ETAG=$(jq -r '.ETag' /tmp/cloudfront-config.json)
echo "📋 ETag CloudFront: $ETAG"

# Modification de la configuration pour le chemin /test/*
echo "📋 Modification de la configuration CloudFront..."
jq '.DistributionConfig.CacheBehaviors.Items += [{"PathPattern": "test/*", "TargetOriginId": "S3-'"$S3_BUCKET"'", "ViewerProtocolPolicy": "redirect-to-https", "AllowedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]}, "CachedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]}, "ForwardedValues": {"QueryString": false, "Cookies": {"Forward": "none"}, "Headers": {"Quantity": 0, "Items": []}}, "MinTTL": 0, "DefaultTTL": 86400, "MaxTTL": 31536000, "Compress": true}] | .DistributionConfig.CacheBehaviors.Quantity = (.DistributionConfig.CacheBehaviors.Quantity + 1)' /tmp/cloudfront-config.json > /tmp/cloudfront-config-updated.json

# Mise à jour de la distribution CloudFront
echo "📋 Mise à jour de la distribution CloudFront..."
aws cloudfront update-distribution --id $CLOUDFRONT_ID --if-match $ETAG --distribution-config "$(jq .DistributionConfig /tmp/cloudfront-config-updated.json)"

echo "✅ Configuration CloudFront terminée avec succès!"
echo "⚠️ Note: La propagation des modifications CloudFront peut prendre jusqu'à 15 minutes."
echo "📌 Vous pouvez tester l'accès aux vidéos à l'adresse: https://$CLOUDFRONT_DOMAIN/test/test-video-720p.mp4"

# Création d'une URL de test directe
echo "📋 Création d'une page HTML de test direct..."
cat > ./test-direct.html << EOF
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Direct Vidéo FloDrama</title>
    <style>
        body {
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: #121118;
            color: white;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        h1 {
            background: linear-gradient(to right, #3b82f6, #d946ef);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 30px;
        }
        .video-container {
            margin-bottom: 20px;
        }
        video {
            width: 100%;
            border-radius: 8px;
        }
        h2 {
            margin-top: 30px;
        }
        pre {
            background-color: #1A1926;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
            color: #e2e8f0;
        }
    </style>
</head>
<body>
    <h1>Test Direct Vidéo FloDrama</h1>
    
    <div class="video-container">
        <h2>Vidéo 720p (Accès Direct)</h2>
        <video controls src="https://${CLOUDFRONT_DOMAIN}/test/test-video-720p.mp4"></video>
    </div>
    
    <h2>URL de la vidéo:</h2>
    <pre>https://${CLOUDFRONT_DOMAIN}/test/test-video-720p.mp4</pre>
</body>
</html>
EOF

echo "✅ Page HTML de test direct créée: ./test-direct.html"
echo "📌 Ouvrez ce fichier dans votre navigateur pour tester l'accès direct à la vidéo."
