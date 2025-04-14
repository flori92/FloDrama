#!/bin/bash
# Script de configuration de l'infrastructure AWS pour FloDrama Multi-plateformes
# Créé le 29-03-2025

# Couleurs pour les messages
ROUGE='\033[0;31m'
VERT='\033[0;32m'
JAUNE='\033[0;33m'
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

# Vérifier si AWS CLI est installé
if ! command -v aws &> /dev/null; then
  erreur "AWS CLI n'est pas installé. Veuillez l'installer avant de continuer."
  exit 1
fi

# Vérifier si jq est installé
if ! command -v jq &> /dev/null; then
  attention "jq n'est pas installé. Installation en cours..."
  brew install jq || {
    erreur "Échec de l'installation de jq. Veuillez l'installer manuellement."
    exit 1
  }
fi

# Configuration
PROJECT_NAME="flodrama"
S3_BUCKET_NAME="${PROJECT_NAME}-app-bucket"
CLOUDFRONT_COMMENT="Distribution FloDrama"
CODECOMMIT_REPO_NAME="${PROJECT_NAME}-monorepo"
CODEBUILD_PROJECT_PREFIX="${PROJECT_NAME}"
CODEPIPELINE_NAME="${PROJECT_NAME}-pipeline"
REGION=$(aws configure get region)
if [ -z "$REGION" ]; then
  REGION="eu-west-3"  # Paris par défaut
  attention "Région AWS non configurée. Utilisation de la région par défaut: $REGION"
fi

# Vérifier les identifiants AWS
log "Vérification des identifiants AWS..."
aws sts get-caller-identity > /dev/null || {
  erreur "Identifiants AWS non valides ou non configurés."
  erreur "Veuillez exécuter 'aws configure' pour configurer vos identifiants AWS."
  exit 1
}

# Créer un bucket S3 pour le déploiement
log "Création du bucket S3 pour le déploiement web: $S3_BUCKET_NAME"
if aws s3api head-bucket --bucket "$S3_BUCKET_NAME" 2>/dev/null; then
  attention "Le bucket S3 $S3_BUCKET_NAME existe déjà."
else
  # Vérifier si la région est us-east-1 (qui a un traitement spécial)
  if [ "$REGION" = "us-east-1" ]; then
    aws s3api create-bucket \
      --bucket "$S3_BUCKET_NAME" \
      --region "$REGION" || {
      erreur "Échec de la création du bucket S3."
      exit 1
    }
  else
    aws s3api create-bucket \
      --bucket "$S3_BUCKET_NAME" \
      --region "$REGION" \
      --create-bucket-configuration LocationConstraint="$REGION" || {
      erreur "Échec de la création du bucket S3."
      exit 1
    }
  fi
  
  # Configurer le bucket pour l'hébergement de site web statique
  log "Configuration du bucket pour l'hébergement web..."
  aws s3 website "s3://$S3_BUCKET_NAME" \
    --index-document index.html \
    --error-document index.html || {
    attention "Échec de la configuration de l'hébergement web."
  }
  
  # Configurer la politique du bucket pour permettre l'accès public
  log "Configuration de la politique du bucket..."
  cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$S3_BUCKET_NAME/*"
    }
  ]
}
EOF
  
  aws s3api put-bucket-policy \
    --bucket "$S3_BUCKET_NAME" \
    --policy file://bucket-policy.json || {
    attention "Échec de la mise à jour de la politique du bucket."
  }
  
  # Désactiver le blocage de l'accès public
  log "Désactivation du blocage de l'accès public..."
  aws s3api put-public-access-block \
    --bucket "$S3_BUCKET_NAME" \
    --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" || {
    attention "Échec de la désactivation du blocage de l'accès public."
  }
  
  rm -f bucket-policy.json
fi

# Créer une distribution CloudFront
log "Création de la distribution CloudFront..."
CLOUDFRONT_EXISTS=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[0].DomainName=='$S3_BUCKET_NAME.s3.amazonaws.com'].Id" --output text)

if [ -n "$CLOUDFRONT_EXISTS" ]; then
  attention "Une distribution CloudFront existe déjà pour ce bucket: $CLOUDFRONT_EXISTS"
  CLOUDFRONT_ID=$CLOUDFRONT_EXISTS
else
  # Créer un fichier de configuration pour CloudFront
  cat > cloudfront-config.json << EOF
{
  "CallerReference": "${PROJECT_NAME}-$(date +%s)",
  "Aliases": {
    "Quantity": 0
  },
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-${S3_BUCKET_NAME}",
        "DomainName": "${S3_BUCKET_NAME}.s3.${REGION}.amazonaws.com",
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
    "TargetOriginId": "S3-${S3_BUCKET_NAME}",
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
  "Comment": "${CLOUDFRONT_COMMENT}",
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

  CLOUDFRONT_RESULT=$(aws cloudfront create-distribution --distribution-config file://cloudfront-config.json)
  CLOUDFRONT_ID=$(echo "$CLOUDFRONT_RESULT" | jq -r '.Distribution.Id')
  CLOUDFRONT_DOMAIN=$(echo "$CLOUDFRONT_RESULT" | jq -r '.Distribution.DomainName')
  
  if [ -z "$CLOUDFRONT_ID" ] || [ "$CLOUDFRONT_ID" == "null" ]; then
    erreur "Échec de la création de la distribution CloudFront."
    exit 1
  fi
  
  log "Distribution CloudFront créée avec succès: $CLOUDFRONT_ID"
  log "Domaine CloudFront: $CLOUDFRONT_DOMAIN"
  
  rm -f cloudfront-config.json
fi

# Créer un repository CodeCommit
log "Création du repository CodeCommit: $CODECOMMIT_REPO_NAME"
if aws codecommit get-repository --repository-name "$CODECOMMIT_REPO_NAME" 2>/dev/null; then
  attention "Le repository CodeCommit $CODECOMMIT_REPO_NAME existe déjà."
else
  aws codecommit create-repository \
    --repository-name "$CODECOMMIT_REPO_NAME" \
    --repository-description "Monorepo FloDrama multi-plateformes" || {
    erreur "Échec de la création du repository CodeCommit."
    exit 1
  }
  
  log "Repository CodeCommit créé avec succès."
  
  # Afficher les informations de clonage
  REPO_URL=$(aws codecommit get-repository --repository-name "$CODECOMMIT_REPO_NAME" --query "repositoryMetadata.cloneUrlHttp" --output text)
  log "URL de clonage du repository: $REPO_URL"
fi

# Créer un bucket S3 pour les artefacts de build
ARTIFACTS_BUCKET="${PROJECT_NAME}-build-artifacts"
log "Création du bucket S3 pour les artefacts de build: $ARTIFACTS_BUCKET"
if aws s3api head-bucket --bucket "$ARTIFACTS_BUCKET" 2>/dev/null; then
  attention "Le bucket S3 $ARTIFACTS_BUCKET existe déjà."
else
  aws s3api create-bucket \
    --bucket "$ARTIFACTS_BUCKET" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION" || {
    erreur "Échec de la création du bucket S3 pour les artefacts."
    exit 1
  }
  
  log "Bucket S3 pour les artefacts créé avec succès."
fi

# Créer un rôle IAM pour CodeBuild
CODEBUILD_ROLE_NAME="${PROJECT_NAME}-codebuild-role"
log "Création du rôle IAM pour CodeBuild: $CODEBUILD_ROLE_NAME"
if aws iam get-role --role-name "$CODEBUILD_ROLE_NAME" 2>/dev/null; then
  attention "Le rôle IAM $CODEBUILD_ROLE_NAME existe déjà."
else
  # Créer un document de politique d'approbation
  cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "codebuild.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

  # Créer le rôle
  aws iam create-role \
    --role-name "$CODEBUILD_ROLE_NAME" \
    --assume-role-policy-document file://trust-policy.json || {
    erreur "Échec de la création du rôle IAM pour CodeBuild."
    exit 1
  }
  
  # Attacher les politiques nécessaires
  aws iam attach-role-policy \
    --role-name "$CODEBUILD_ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/AmazonS3FullAccess" || {
    attention "Échec de l'attachement de la politique S3FullAccess."
  }
  
  aws iam attach-role-policy \
    --role-name "$CODEBUILD_ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/CloudFrontFullAccess" || {
    attention "Échec de l'attachement de la politique CloudFrontFullAccess."
  }
  
  aws iam attach-role-policy \
    --role-name "$CODEBUILD_ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/AWSCodeBuildAdminAccess" || {
    attention "Échec de l'attachement de la politique CodeBuildAdminAccess."
  }
  
  log "Rôle IAM pour CodeBuild créé avec succès."
  rm -f trust-policy.json
fi

# Créer un projet CodeBuild pour l'application web
CODEBUILD_WEB_PROJECT="${CODEBUILD_PROJECT_PREFIX}-web-build"
log "Création du projet CodeBuild pour l'application web: $CODEBUILD_WEB_PROJECT"
if aws codebuild batch-get-projects --names "$CODEBUILD_WEB_PROJECT" --query "projects[0].name" --output text 2>/dev/null | grep -q "$CODEBUILD_WEB_PROJECT"; then
  attention "Le projet CodeBuild $CODEBUILD_WEB_PROJECT existe déjà."
else
  # Créer un fichier buildspec.yml pour l'application web
  mkdir -p buildspecs
  cat > buildspecs/buildspec-web.yml << EOF
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 16
    commands:
      - npm install -g yarn
      - yarn install
  build:
    commands:
      - yarn workspace @flodrama/web build
  post_build:
    commands:
      - aws s3 sync apps/web/build/ s3://${S3_BUCKET_NAME}/ --delete
      - aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_ID} --paths "/*"

artifacts:
  files:
    - apps/web/build/**/*
  base-directory: '.'

cache:
  paths:
    - 'node_modules/**/*'
    - '.turbo/**/*'
EOF

  # Créer le projet CodeBuild
  aws codebuild create-project \
    --name "$CODEBUILD_WEB_PROJECT" \
    --description "Projet de build pour l'application web FloDrama" \
    --service-role "arn:aws:iam::$(aws sts get-caller-identity --query "Account" --output text):role/$CODEBUILD_ROLE_NAME" \
    --artifacts type=S3,location="$ARTIFACTS_BUCKET",name="$CODEBUILD_WEB_PROJECT.zip",packaging=ZIP \
    --environment type=LINUX_CONTAINER,image=aws/codebuild/amazonlinux2-x86_64-standard:3.0,computeType=BUILD_GENERAL1_SMALL,privilegedMode=true \
    --source type=CODECOMMIT,location="https://git-codecommit.${REGION}.amazonaws.com/v1/repos/${CODECOMMIT_REPO_NAME}",buildspec=buildspecs/buildspec-web.yml \
    --cache type=LOCAL,modes=LOCAL_DOCKER_LAYER_CACHE,LOCAL_SOURCE_CACHE,LOCAL_CUSTOM_CACHE || {
    erreur "Échec de la création du projet CodeBuild pour l'application web."
    exit 1
  }
  
  log "Projet CodeBuild pour l'application web créé avec succès."
fi

# Créer un rôle IAM pour CodePipeline
CODEPIPELINE_ROLE_NAME="${PROJECT_NAME}-codepipeline-role"
log "Création du rôle IAM pour CodePipeline: $CODEPIPELINE_ROLE_NAME"
if aws iam get-role --role-name "$CODEPIPELINE_ROLE_NAME" 2>/dev/null; then
  attention "Le rôle IAM $CODEPIPELINE_ROLE_NAME existe déjà."
else
  # Créer un document de politique d'approbation
  cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "codepipeline.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

  # Créer le rôle
  aws iam create-role \
    --role-name "$CODEPIPELINE_ROLE_NAME" \
    --assume-role-policy-document file://trust-policy.json || {
    erreur "Échec de la création du rôle IAM pour CodePipeline."
    exit 1
  }
  
  # Créer une politique personnalisée pour CodePipeline
  cat > codepipeline-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:*",
        "codecommit:*",
        "codebuild:*",
        "cloudformation:*",
        "iam:PassRole"
      ],
      "Resource": "*"
    }
  ]
}
EOF

  aws iam put-role-policy \
    --role-name "$CODEPIPELINE_ROLE_NAME" \
    --policy-name "${PROJECT_NAME}-codepipeline-policy" \
    --policy-document file://codepipeline-policy.json || {
    erreur "Échec de la création de la politique pour CodePipeline."
    exit 1
  }
  
  log "Rôle IAM pour CodePipeline créé avec succès."
  rm -f trust-policy.json codepipeline-policy.json
fi

# Créer un pipeline CodePipeline
log "Création du pipeline CodePipeline: $CODEPIPELINE_NAME"
if aws codepipeline get-pipeline --name "$CODEPIPELINE_NAME" 2>/dev/null; then
  attention "Le pipeline CodePipeline $CODEPIPELINE_NAME existe déjà."
else
  # Créer un fichier de configuration pour le pipeline
  cat > pipeline-config.json << EOF
{
  "pipeline": {
    "name": "${CODEPIPELINE_NAME}",
    "roleArn": "arn:aws:iam::$(aws sts get-caller-identity --query "Account" --output text):role/${CODEPIPELINE_ROLE_NAME}",
    "artifactStore": {
      "type": "S3",
      "location": "${ARTIFACTS_BUCKET}"
    },
    "stages": [
      {
        "name": "Source",
        "actions": [
          {
            "name": "Source",
            "actionTypeId": {
              "category": "Source",
              "owner": "AWS",
              "provider": "CodeCommit",
              "version": "1"
            },
            "configuration": {
              "RepositoryName": "${CODECOMMIT_REPO_NAME}",
              "BranchName": "main"
            },
            "outputArtifacts": [
              {
                "name": "SourceCode"
              }
            ]
          }
        ]
      },
      {
        "name": "Build",
        "actions": [
          {
            "name": "BuildWeb",
            "actionTypeId": {
              "category": "Build",
              "owner": "AWS",
              "provider": "CodeBuild",
              "version": "1"
            },
            "configuration": {
              "ProjectName": "${CODEBUILD_WEB_PROJECT}"
            },
            "inputArtifacts": [
              {
                "name": "SourceCode"
              }
            ],
            "outputArtifacts": [
              {
                "name": "WebBuildOutput"
              }
            ]
          }
        ]
      },
      {
        "name": "Deploy",
        "actions": [
          {
            "name": "DeployToS3",
            "actionTypeId": {
              "category": "Deploy",
              "owner": "AWS",
              "provider": "S3",
              "version": "1"
            },
            "configuration": {
              "BucketName": "${S3_BUCKET_NAME}",
              "Extract": "true"
            },
            "inputArtifacts": [
              {
                "name": "WebBuildOutput"
              }
            ]
          }
        ]
      }
    ]
  }
}
EOF

  aws codepipeline create-pipeline --cli-input-json file://pipeline-config.json || {
    erreur "Échec de la création du pipeline CodePipeline."
    exit 1
  }
  
  log "Pipeline CodePipeline créé avec succès."
  rm -f pipeline-config.json
fi

# Créer un sujet SNS pour les notifications
SNS_TOPIC_NAME="${PROJECT_NAME}-notifications"
log "Création du sujet SNS pour les notifications: $SNS_TOPIC_NAME"
SNS_TOPIC_ARN=$(aws sns create-topic --name "$SNS_TOPIC_NAME" --query "TopicArn" --output text)

if [ -z "$SNS_TOPIC_ARN" ]; then
  attention "Échec de la création du sujet SNS."
else
  log "Sujet SNS créé avec succès: $SNS_TOPIC_ARN"
  
  # Demander l'adresse e-mail pour les notifications
  read -p "Entrez l'adresse e-mail pour recevoir les notifications de déploiement: " EMAIL
  
  if [ -n "$EMAIL" ]; then
    aws sns subscribe \
      --topic-arn "$SNS_TOPIC_ARN" \
      --protocol email \
      --notification-endpoint "$EMAIL" || {
      attention "Échec de l'abonnement au sujet SNS."
    }
    
    log "Un e-mail de confirmation a été envoyé à $EMAIL. Veuillez confirmer l'abonnement."
  fi
fi

# Résumé des ressources créées
log "=== Résumé des ressources AWS créées ==="
log "Bucket S3 pour le déploiement web: $S3_BUCKET_NAME"
log "Distribution CloudFront: $CLOUDFRONT_ID"
if [ -n "$CLOUDFRONT_DOMAIN" ]; then
  log "Domaine CloudFront: $CLOUDFRONT_DOMAIN"
else
  CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution --id "$CLOUDFRONT_ID" --query "Distribution.DomainName" --output text)
  log "Domaine CloudFront: $CLOUDFRONT_DOMAIN"
fi
log "Repository CodeCommit: $CODECOMMIT_REPO_NAME"
log "Projet CodeBuild pour l'application web: $CODEBUILD_WEB_PROJECT"
log "Pipeline CodePipeline: $CODEPIPELINE_NAME"
log "Sujet SNS pour les notifications: $SNS_TOPIC_ARN"

# Créer un fichier de configuration pour référence future
CONFIG_FILE="${PROJECT_NAME}-aws-config.json"
log "Création du fichier de configuration: $CONFIG_FILE"
cat > "$CONFIG_FILE" << EOF
{
  "project": "${PROJECT_NAME}",
  "region": "${REGION}",
  "s3": {
    "deploymentBucket": "${S3_BUCKET_NAME}",
    "artifactsBucket": "${ARTIFACTS_BUCKET}"
  },
  "cloudfront": {
    "distributionId": "${CLOUDFRONT_ID}",
    "domain": "${CLOUDFRONT_DOMAIN}"
  },
  "codecommit": {
    "repositoryName": "${CODECOMMIT_REPO_NAME}"
  },
  "codebuild": {
    "webProject": "${CODEBUILD_WEB_PROJECT}"
  },
  "codepipeline": {
    "pipelineName": "${CODEPIPELINE_NAME}"
  },
  "sns": {
    "topicArn": "${SNS_TOPIC_ARN}"
  },
  "iam": {
    "codebuildRole": "${CODEBUILD_ROLE_NAME}",
    "codepipelineRole": "${CODEPIPELINE_ROLE_NAME}"
  }
}
EOF

log "Configuration terminée avec succès!"
log "Vous pouvez maintenant initialiser le monorepo et le pousser vers CodeCommit pour déclencher le pipeline."
log "URL de l'application: https://${CLOUDFRONT_DOMAIN}"
