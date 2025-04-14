#!/bin/bash

# Configuration CloudFront pour FloDrama
# Ce script configure une distribution CloudFront pour le bucket S3 FloDrama

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
function log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

function log_success() {
    echo -e "${GREEN}[SUCCÈS]${NC} $1"
}

function log_warning() {
    echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

function log_error() {
    echo -e "${RED}[ERREUR]${NC} $1"
}

function log_step() {
    echo -e "${BLUE}[ÉTAPE]${NC} $1"
}

# Paramètres par défaut
ENV="prod"
REGION="us-east-1"
CREATE_BUCKET=false

# Traitement des arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        dev|staging|prod)
            ENV="$1"
            shift
            ;;
        --region)
            REGION="$2"
            shift 2
            ;;
        *)
            log_error "Option non reconnue: $1"
            exit 1
            ;;
    esac
done

BUCKET_NAME="flodrama-$ENV"
log_info "Configuration CloudFront pour le bucket S3: $BUCKET_NAME"
log_info "Région AWS: $REGION"

# Vérifier si le bucket existe
if ! aws s3 ls "s3://$BUCKET_NAME" --region "$REGION" &> /dev/null; then
    log_error "Le bucket S3 '$BUCKET_NAME' n'existe pas. Veuillez le créer d'abord."
    exit 1
fi

# Créer un fichier de configuration temporaire pour CloudFront
TEMP_CONFIG=$(mktemp)
cat > "$TEMP_CONFIG" << EOF
{
    "CallerReference": "flodrama-$ENV-$(date +%s)",
    "Aliases": {
        "Quantity": 0
    },
    "DefaultRootObject": "index.html",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-$BUCKET_NAME",
                "DomainName": "$BUCKET_NAME.s3.amazonaws.com",
                "OriginPath": "",
                "CustomHeaders": {
                    "Quantity": 0
                },
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                }
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-$BUCKET_NAME",
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {
                "Forward": "none"
            },
            "Headers": {
                "Quantity": 0
            },
            "QueryStringCacheKeys": {
                "Quantity": 0
            }
        },
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        },
        "ViewerProtocolPolicy": "redirect-to-https",
        "MinTTL": 0,
        "AllowedMethods": {
            "Quantity": 2,
            "Items": [
                "HEAD",
                "GET"
            ],
            "CachedMethods": {
                "Quantity": 2,
                "Items": [
                    "HEAD",
                    "GET"
                ]
            }
        },
        "SmoothStreaming": false,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000,
        "Compress": true,
        "LambdaFunctionAssociations": {
            "Quantity": 0
        },
        "FieldLevelEncryptionId": ""
    },
    "CacheBehaviors": {
        "Quantity": 0
    },
    "CustomErrorResponses": {
        "Quantity": 1,
        "Items": [
            {
                "ErrorCode": 404,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            }
        ]
    },
    "Comment": "Distribution CloudFront pour FloDrama $ENV",
    "Logging": {
        "Enabled": false,
        "IncludeCookies": false,
        "Bucket": "",
        "Prefix": ""
    },
    "PriceClass": "PriceClass_100",
    "Enabled": true,
    "ViewerCertificate": {
        "CloudFrontDefaultCertificate": true,
        "MinimumProtocolVersion": "TLSv1",
        "CertificateSource": "cloudfront"
    },
    "Restrictions": {
        "GeoRestriction": {
            "RestrictionType": "none",
            "Quantity": 0
        }
    },
    "WebACLId": "",
    "HttpVersion": "http2",
    "IsIPV6Enabled": true
}
EOF

# Créer la distribution CloudFront
log_step "Création de la distribution CloudFront..."
DISTRIBUTION_INFO=$(aws cloudfront create-distribution --distribution-config file://"$TEMP_CONFIG" --region "$REGION" 2>&1)

if [ $? -ne 0 ]; then
    log_error "Échec de la création de la distribution CloudFront:"
    echo "$DISTRIBUTION_INFO"
    rm "$TEMP_CONFIG"
    exit 1
fi

# Extraire l'ID et le domaine de la distribution
DISTRIBUTION_ID=$(echo "$DISTRIBUTION_INFO" | grep -o '"Id": "[^"]*"' | cut -d'"' -f4)
DISTRIBUTION_DOMAIN=$(echo "$DISTRIBUTION_INFO" | grep -o '"DomainName": "[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$DISTRIBUTION_ID" ] || [ -z "$DISTRIBUTION_DOMAIN" ]; then
    log_error "Impossible d'extraire les informations de la distribution CloudFront."
    rm "$TEMP_CONFIG"
    exit 1
fi

log_success "Distribution CloudFront créée avec succès."
log_info "ID de la distribution: $DISTRIBUTION_ID"
log_info "Domaine CloudFront: https://$DISTRIBUTION_DOMAIN"

# Nettoyer
rm "$TEMP_CONFIG"

# Créer un fichier de configuration pour le déploiement
CONFIG_DIR="/Users/floriace/FLO_DRAMA/FloDrama/config"
mkdir -p "$CONFIG_DIR"

CONFIG_FILE="$CONFIG_DIR/cloudfront-$ENV.json"
cat > "$CONFIG_FILE" << EOF
{
    "bucketName": "$BUCKET_NAME",
    "region": "$REGION",
    "distributionId": "$DISTRIBUTION_ID",
    "distributionDomain": "$DISTRIBUTION_DOMAIN"
}
EOF

log_success "Configuration sauvegardée dans $CONFIG_FILE"
log_info "Votre application sera accessible à l'adresse: https://$DISTRIBUTION_DOMAIN"
log_warning "La propagation de la distribution CloudFront peut prendre jusqu'à 15 minutes."
log_info "Pour invalider le cache après un déploiement, utilisez:"
log_info "aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths \"/*\" --region $REGION"

echo ""
log_step "Étapes suivantes:"
echo "1. Attendez que la distribution soit déployée (statut: Deployed)"
echo "2. Accédez à votre application via https://$DISTRIBUTION_DOMAIN"
echo "3. Pour les déploiements futurs, utilisez le script deploy_to_cloudfront.sh avec l'ID de distribution:"
echo "   ./scripts/deploy_to_cloudfront.sh $ENV --distribution-id $DISTRIBUTION_ID"
