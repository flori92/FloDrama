#!/bin/bash
# Script de configuration de CloudFront pour FloDrama
# Créé le 9 avril 2025
# Auteur: Développeur FloDrama

set -e

# Configuration
BUCKET_NAME="flodrama-video-cache"
CLOUDFRONT_COMMENT="Distribution FloDrama pour le streaming vidéo"
PRICE_CLASS="PriceClass_100" # Europe et Amérique du Nord uniquement
DEFAULT_TTL=86400 # 24 heures
MAX_TTL=31536000 # 1 an
ALLOWED_ORIGINS="https://flodrama.vercel.app,http://localhost:3000"

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Configuration de CloudFront pour FloDrama...${NC}"

# Vérifier si le bucket S3 existe
if ! aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo -e "${RED}Le bucket S3 $BUCKET_NAME n'existe pas. Création...${NC}"
    aws s3 mb s3://$BUCKET_NAME --region us-east-1
    
    # Configurer le bucket pour le stockage des vidéos
    aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "AllowCloudFrontServicePrincipal",
                "Effect": "Allow",
                "Principal": {
                    "Service": "cloudfront.amazonaws.com"
                },
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*",
                "Condition": {
                    "StringEquals": {
                        "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_NUMBER:distribution/DISTRIBUTION_ID"
                    }
                }
            }
        ]
    }'
    
    echo -e "${GREEN}Bucket S3 créé avec succès.${NC}"
fi

# Créer un fichier de configuration pour CloudFront
TEMP_CONFIG=$(mktemp)
cat > $TEMP_CONFIG << EOF
{
    "CallerReference": "flodrama-$(date +%s)",
    "Comment": "$CLOUDFRONT_COMMENT",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-$BUCKET_NAME",
                "DomainName": "$BUCKET_NAME.s3.amazonaws.com",
                "OriginPath": "",
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                }
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-$BUCKET_NAME",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"],
            "CachedMethods": {
                "Quantity": 2,
                "Items": ["GET", "HEAD"]
            }
        },
        "DefaultTTL": $DEFAULT_TTL,
        "MaxTTL": $MAX_TTL,
        "MinTTL": 0,
        "ForwardedValues": {
            "QueryString": true,
            "Cookies": {
                "Forward": "none"
            },
            "Headers": {
                "Quantity": 3,
                "Items": ["Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]
            }
        },
        "SmoothStreaming": false,
        "Compress": true
    },
    "CustomErrorResponses": {
        "Quantity": 2,
        "Items": [
            {
                "ErrorCode": 403,
                "ResponsePagePath": "",
                "ResponseCode": "403",
                "ErrorCachingMinTTL": 300
            },
            {
                "ErrorCode": 404,
                "ResponsePagePath": "",
                "ResponseCode": "404",
                "ErrorCachingMinTTL": 300
            }
        ]
    },
    "PriceClass": "$PRICE_CLASS",
    "Enabled": true,
    "ViewerCertificate": {
        "CloudFrontDefaultCertificate": true,
        "MinimumProtocolVersion": "TLSv1.2_2021"
    },
    "Restrictions": {
        "GeoRestriction": {
            "RestrictionType": "none",
            "Quantity": 0
        }
    },
    "HttpVersion": "http2",
    "IsIPV6Enabled": true
}
EOF

# Vérifier si la distribution existe déjà
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[?Id=='S3-$BUCKET_NAME']].Id" --output text)

if [ -z "$DISTRIBUTION_ID" ]; then
    echo -e "${YELLOW}Création d'une nouvelle distribution CloudFront...${NC}"
    DISTRIBUTION_RESULT=$(aws cloudfront create-distribution --distribution-config file://$TEMP_CONFIG)
    DISTRIBUTION_ID=$(echo $DISTRIBUTION_RESULT | jq -r '.Distribution.Id')
    DOMAIN_NAME=$(echo $DISTRIBUTION_RESULT | jq -r '.Distribution.DomainName')
    
    echo -e "${GREEN}Distribution CloudFront créée avec succès.${NC}"
else
    echo -e "${YELLOW}Une distribution CloudFront existe déjà pour ce bucket. Mise à jour...${NC}"
    CONFIG_ETAG=$(aws cloudfront get-distribution-config --id $DISTRIBUTION_ID | jq -r '.ETag')
    aws cloudfront update-distribution --id $DISTRIBUTION_ID --distribution-config file://$TEMP_CONFIG --if-match "$CONFIG_ETAG"
    DOMAIN_NAME=$(aws cloudfront get-distribution --id $DISTRIBUTION_ID | jq -r '.Distribution.DomainName')
    
    echo -e "${GREEN}Distribution CloudFront mise à jour avec succès.${NC}"
fi

# Configurer CORS sur le bucket S3
echo -e "${YELLOW}Configuration des règles CORS sur le bucket S3...${NC}"
aws s3api put-bucket-cors --bucket $BUCKET_NAME --cors-configuration '{
    "CORSRules": [
        {
            "AllowedOrigins": ["'"$ALLOWED_ORIGINS"'"],
            "AllowedMethods": ["GET", "HEAD"],
            "AllowedHeaders": ["*"],
            "MaxAgeSeconds": 3000
        }
    ]
}'

# Nettoyer le fichier temporaire
rm $TEMP_CONFIG

# Mettre à jour le fichier de configuration
CONFIG_FILE="/Users/floriace/FLO_DRAMA/FloDrama/config/video-proxy-config.json"
if [ -f "$CONFIG_FILE" ]; then
    echo -e "${YELLOW}Mise à jour du fichier de configuration...${NC}"
    jq --arg domain "$DOMAIN_NAME" '.cloudfront_domain = $domain' $CONFIG_FILE > ${CONFIG_FILE}.tmp && mv ${CONFIG_FILE}.tmp $CONFIG_FILE
    echo -e "${GREEN}Fichier de configuration mis à jour.${NC}"
fi

# Mettre à jour le fichier .env.development
ENV_FILE="/Users/floriace/FLO_DRAMA/FloDrama/.env.development"
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Mise à jour du fichier .env.development...${NC}"
    if grep -q "REACT_APP_CLOUDFRONT_DOMAIN" "$ENV_FILE"; then
        sed -i '' "s|REACT_APP_CLOUDFRONT_DOMAIN=.*|REACT_APP_CLOUDFRONT_DOMAIN=https://$DOMAIN_NAME|g" "$ENV_FILE"
    else
        echo "REACT_APP_CLOUDFRONT_DOMAIN=https://$DOMAIN_NAME" >> "$ENV_FILE"
    fi
    echo -e "${GREEN}Fichier .env.development mis à jour.${NC}"
fi

echo -e "${GREEN}Configuration de CloudFront terminée avec succès.${NC}"
echo -e "${YELLOW}Domaine CloudFront: ${NC}https://$DOMAIN_NAME"
echo -e "${YELLOW}ID de distribution: ${NC}$DISTRIBUTION_ID"
echo -e "${YELLOW}Veuillez noter ces informations pour référence future.${NC}"
