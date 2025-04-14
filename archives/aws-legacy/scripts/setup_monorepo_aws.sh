#!/bin/bash

# Script de configuration du monorepo FloDrama avec l'infrastructure AWS existante
# Ce script configure les ressources AWS nécessaires pour la refonte multi-plateformes
# en s'appuyant sur l'infrastructure existante

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log() {
  echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

attention() {
  echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ATTENTION: $1${NC}"
}

erreur() {
  echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERREUR: $1${NC}"
}

# Variables de configuration
REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)
PROJECT_NAME="flodrama"
MONOREPO_BUCKET="${PROJECT_NAME}-monorepo-builds"
CODEBUILD_PROJECT="${PROJECT_NAME}-monorepo-build"
CODEPIPELINE_NAME="${PROJECT_NAME}-monorepo-pipeline"
CLOUDFRONT_DISTRIBUTION_ID="E2Q1IQGU47SLGM" # Distribution existante

# Vérification des identifiants AWS
log "Vérification des identifiants AWS..."
if ! aws sts get-caller-identity &> /dev/null; then
  erreur "Impossible de vérifier les identifiants AWS. Veuillez configurer vos identifiants avec 'aws configure'."
  exit 1
fi
success "Identifiants AWS valides."

# Création du bucket S3 pour les builds du monorepo
log "Création du bucket S3 pour les builds du monorepo: $MONOREPO_BUCKET"
if aws s3api head-bucket --bucket "$MONOREPO_BUCKET" 2>/dev/null; then
  attention "Le bucket S3 $MONOREPO_BUCKET existe déjà."
else
  # Vérifier si la région est us-east-1 (qui a un traitement spécial)
  if [ "$REGION" = "us-east-1" ]; then
    aws s3api create-bucket \
      --bucket "$MONOREPO_BUCKET" \
      --region "$REGION" || {
      erreur "Échec de la création du bucket S3."
      exit 1
    }
  else
    aws s3api create-bucket \
      --bucket "$MONOREPO_BUCKET" \
      --region "$REGION" \
      --create-bucket-configuration LocationConstraint="$REGION" || {
      erreur "Échec de la création du bucket S3."
      exit 1
    }
  fi
  
  # Activer le versionnement sur le bucket
  log "Activation du versionnement sur le bucket..."
  aws s3api put-bucket-versioning \
    --bucket "$MONOREPO_BUCKET" \
    --versioning-configuration Status=Enabled || {
    attention "Échec de l'activation du versionnement sur le bucket."
  }
  
  success "Bucket S3 $MONOREPO_BUCKET créé avec succès."
fi

# Création du rôle IAM pour CodeBuild
log "Création du rôle IAM pour CodeBuild..."
CODEBUILD_ROLE_NAME="${PROJECT_NAME}-codebuild-role"
CODEBUILD_POLICY_NAME="${PROJECT_NAME}-codebuild-policy"

# Vérifier si le rôle existe déjà
if aws iam get-role --role-name "$CODEBUILD_ROLE_NAME" &> /dev/null; then
  attention "Le rôle IAM $CODEBUILD_ROLE_NAME existe déjà."
else
  # Créer le document de politique d'approbation
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
    erreur "Échec de la création du rôle IAM."
    exit 1
  }
  
  # Créer la politique
  cat > codebuild-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Resource": [
        "arn:aws:logs:${REGION}:${ACCOUNT_ID}:log-group:/aws/codebuild/${CODEBUILD_PROJECT}",
        "arn:aws:logs:${REGION}:${ACCOUNT_ID}:log-group:/aws/codebuild/${CODEBUILD_PROJECT}:*"
      ],
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
    },
    {
      "Effect": "Allow",
      "Resource": [
        "arn:aws:s3:::${MONOREPO_BUCKET}",
        "arn:aws:s3:::${MONOREPO_BUCKET}/*",
        "arn:aws:s3:::flodrama-app-bucket",
        "arn:aws:s3:::flodrama-app-bucket/*"
      ],
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:GetBucketAcl",
        "s3:GetBucketLocation"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": [
        "arn:aws:cloudfront::${ACCOUNT_ID}:distribution/${CLOUDFRONT_DISTRIBUTION_ID}"
      ]
    }
  ]
}
EOF

  # Attacher la politique au rôle
  aws iam put-role-policy \
    --role-name "$CODEBUILD_ROLE_NAME" \
    --policy-name "$CODEBUILD_POLICY_NAME" \
    --policy-document file://codebuild-policy.json || {
    erreur "Échec de l'attachement de la politique au rôle."
    exit 1
  }
  
  success "Rôle IAM $CODEBUILD_ROLE_NAME créé avec succès."
  
  # Supprimer les fichiers temporaires
  rm trust-policy.json codebuild-policy.json
  
  # Attendre la propagation des politiques IAM
  log "Attente de la propagation des politiques IAM (30 secondes)..."
  sleep 30
fi

# Création du projet CodeBuild
log "Création du projet CodeBuild pour le monorepo..."
if aws codebuild batch-get-projects --names "$CODEBUILD_PROJECT" --query "projects[0].name" --output text 2>/dev/null | grep -q "$CODEBUILD_PROJECT"; then
  attention "Le projet CodeBuild $CODEBUILD_PROJECT existe déjà."
else
  # Créer le fichier de configuration du projet
  cat > codebuild-project.json << EOF
{
  "name": "${CODEBUILD_PROJECT}",
  "description": "Projet de build pour le monorepo FloDrama",
  "source": {
    "type": "CODECOMMIT",
    "location": "https://git-codecommit.${REGION}.amazonaws.com/v1/repos/flodrama-monorepo",
    "buildspec": "buildspec.yml"
  },
  "artifacts": {
    "type": "S3",
    "location": "${MONOREPO_BUCKET}",
    "path": "builds",
    "name": "flodrama-monorepo-build.zip"
  },
  "environment": {
    "type": "LINUX_CONTAINER",
    "image": "aws/codebuild/amazonlinux2-x86_64-standard:3.0",
    "computeType": "BUILD_GENERAL1_SMALL",
    "privilegedMode": true,
    "environmentVariables": [
      {
        "name": "CLOUDFRONT_DISTRIBUTION_ID",
        "value": "${CLOUDFRONT_DISTRIBUTION_ID}"
      },
      {
        "name": "S3_WEB_BUCKET",
        "value": "flodrama-app-bucket"
      }
    ]
  },
  "serviceRole": "arn:aws:iam::${ACCOUNT_ID}:role/${CODEBUILD_ROLE_NAME}",
  "timeoutInMinutes": 60,
  "queuedTimeoutInMinutes": 480,
  "logsConfig": {
    "cloudWatchLogs": {
      "status": "ENABLED"
    }
  }
}
EOF

  # Créer le projet
  aws codebuild create-project --cli-input-json file://codebuild-project.json || {
    erreur "Échec de la création du projet CodeBuild."
    exit 1
  }
  
  success "Projet CodeBuild $CODEBUILD_PROJECT créé avec succès."
  
  # Supprimer le fichier temporaire
  rm codebuild-project.json
fi

# Création du rôle IAM pour CodePipeline
log "Création du rôle IAM pour CodePipeline..."
CODEPIPELINE_ROLE_NAME="${PROJECT_NAME}-codepipeline-role"
CODEPIPELINE_POLICY_NAME="${PROJECT_NAME}-codepipeline-policy"

# Vérifier si le rôle existe déjà
if aws iam get-role --role-name "$CODEPIPELINE_ROLE_NAME" &> /dev/null; then
  attention "Le rôle IAM $CODEPIPELINE_ROLE_NAME existe déjà."
else
  # Créer le document de politique d'approbation
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
    erreur "Échec de la création du rôle IAM."
    exit 1
  }
  
  # Créer la politique
  cat > codepipeline-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:GetBucketVersioning",
        "s3:PutObject"
      ],
      "Resource": [
        "arn:aws:s3:::${MONOREPO_BUCKET}",
        "arn:aws:s3:::${MONOREPO_BUCKET}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "codecommit:GetBranch",
        "codecommit:GetCommit",
        "codecommit:UploadArchive",
        "codecommit:GetUploadArchiveStatus",
        "codecommit:CancelUploadArchive"
      ],
      "Resource": "arn:aws:codecommit:${REGION}:${ACCOUNT_ID}:flodrama-monorepo"
    },
    {
      "Effect": "Allow",
      "Action": [
        "codebuild:BatchGetBuilds",
        "codebuild:StartBuild"
      ],
      "Resource": "arn:aws:codebuild:${REGION}:${ACCOUNT_ID}:project/${CODEBUILD_PROJECT}"
    }
  ]
}
EOF

  # Attacher la politique au rôle
  aws iam put-role-policy \
    --role-name "$CODEPIPELINE_ROLE_NAME" \
    --policy-name "$CODEPIPELINE_POLICY_NAME" \
    --policy-document file://codepipeline-policy.json || {
    erreur "Échec de l'attachement de la politique au rôle."
    exit 1
  }
  
  success "Rôle IAM $CODEPIPELINE_ROLE_NAME créé avec succès."
  
  # Supprimer les fichiers temporaires
  rm trust-policy.json codepipeline-policy.json
fi

# Création du pipeline CodePipeline
log "Création du pipeline CodePipeline..."
if aws codepipeline get-pipeline --name "$CODEPIPELINE_NAME" &> /dev/null; then
  attention "Le pipeline CodePipeline $CODEPIPELINE_NAME existe déjà."
else
  # Créer le fichier de configuration du pipeline
  cat > codepipeline.json << EOF
{
  "pipeline": {
    "name": "${CODEPIPELINE_NAME}",
    "roleArn": "arn:aws:iam::${ACCOUNT_ID}:role/${CODEPIPELINE_ROLE_NAME}",
    "artifactStore": {
      "type": "S3",
      "location": "${MONOREPO_BUCKET}"
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
              "RepositoryName": "flodrama-monorepo",
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
              "ProjectName": "${CODEBUILD_PROJECT}",
              "PrimarySource": "SourceCode",
              "EnvironmentVariables": "[{\"name\":\"BUILD_TARGET\",\"value\":\"web\",\"type\":\"PLAINTEXT\"}]"
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
              "BucketName": "flodrama-app-bucket",
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

  # Créer le pipeline
  aws codepipeline create-pipeline --cli-input-json file://codepipeline.json || {
    erreur "Échec de la création du pipeline CodePipeline."
    exit 1
  }
  
  success "Pipeline CodePipeline $CODEPIPELINE_NAME créé avec succès."
  
  # Supprimer le fichier temporaire
  rm codepipeline.json
fi

# Création du repository CodeCommit
log "Création du repository CodeCommit pour le monorepo..."
CODECOMMIT_REPO="flodrama-monorepo"

if aws codecommit get-repository --repository-name "$CODECOMMIT_REPO" &> /dev/null; then
  attention "Le repository CodeCommit $CODECOMMIT_REPO existe déjà."
else
  # Tenter de créer le repository
  if ! aws codecommit create-repository \
    --repository-name "$CODECOMMIT_REPO" \
    --repository-description "Monorepo FloDrama pour le développement multi-plateformes" &> /dev/null; then
    
    attention "Impossible de créer le repository CodeCommit. Vérifiez vos permissions ou utilisez un repository GitHub existant."
    
    # Créer un fichier de configuration pour GitHub
    cat > github-config.txt << EOF
# Configuration pour GitHub

Si vous ne pouvez pas utiliser CodeCommit en raison de restrictions de permissions,
suivez ces étapes pour configurer un repository GitHub à la place:

1. Créez un nouveau repository sur GitHub
2. Configurez les secrets GitHub pour AWS:
   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY
   - AWS_REGION

3. Créez un workflow GitHub Actions (.github/workflows/deploy.yml):

```yaml
name: Deploy FloDrama

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
          
      - name: Install dependencies
        run: yarn install
        
      - name: Build web app
        run: yarn workspace web build
        
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: \${{ secrets.AWS_REGION }}
          
      - name: Deploy to S3
        run: aws s3 sync ./apps/web/dist s3://flodrama-app-bucket --delete
        
      - name: Invalidate CloudFront
        run: aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} --paths "/*"
```

4. Poussez votre code vers GitHub:
   git remote add origin https://github.com/votre-utilisateur/flodrama-monorepo.git
   git push -u origin main
EOF
    
    success "Instructions pour GitHub créées dans github-config.txt"
  else
    success "Repository CodeCommit $CODECOMMIT_REPO créé avec succès."
    
    # Afficher les informations de connexion
    log "Informations de connexion au repository:"
    echo "URL HTTPS: https://git-codecommit.${REGION}.amazonaws.com/v1/repos/${CODECOMMIT_REPO}"
    echo "Pour cloner le repository: git clone https://git-codecommit.${REGION}.amazonaws.com/v1/repos/${CODECOMMIT_REPO}"
  fi
fi

# Création du buildspec.yml pour CodeBuild
log "Création du fichier buildspec.yml..."
cat > buildspec.yml << EOF
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 16
    commands:
      - npm install -g yarn
      - npm install -g turbo
      
  pre_build:
    commands:
      - echo "Installing dependencies..."
      - yarn install
      
  build:
    commands:
      - echo "Building the monorepo..."
      - if [ "\$BUILD_TARGET" = "web" ]; then
          echo "Building web application...";
          yarn workspace web build;
        elif [ "\$BUILD_TARGET" = "mobile" ]; then
          echo "Building mobile application...";
          yarn workspace mobile build;
        elif [ "\$BUILD_TARGET" = "desktop" ]; then
          echo "Building desktop application...";
          yarn workspace desktop build;
        else
          echo "Building all applications...";
          yarn build;
        fi
        
  post_build:
    commands:
      - echo "Build completed on \$(date)"
      - if [ "\$BUILD_TARGET" = "web" ]; then
          echo "Invalidating CloudFront cache...";
          aws cloudfront create-invalidation --distribution-id \$CLOUDFRONT_DISTRIBUTION_ID --paths "/*";
        fi

artifacts:
  files:
    - apps/web/dist/**/*
    - apps/mobile/build/**/*
    - apps/desktop/dist/**/*
  base-directory: '.'
  discard-paths: no

cache:
  paths:
    - 'node_modules/**/*'
    - '.yarn/cache/**/*'
EOF

success "Fichier buildspec.yml créé avec succès."
log "Vous pouvez maintenant initialiser votre monorepo avec le script init_monorepo.sh"

# Résumé
echo ""
log "Résumé de la configuration:"
echo "- Bucket S3 pour les builds: $MONOREPO_BUCKET"
echo "- Projet CodeBuild: $CODEBUILD_PROJECT"
echo "- Pipeline CodePipeline: $CODEPIPELINE_NAME"
echo "- Repository CodeCommit: $CODECOMMIT_REPO"
echo ""
log "Prochaines étapes:"
echo "1. Exécutez le script init_monorepo.sh pour initialiser la structure du monorepo"
echo "2. Poussez le code initial vers le repository CodeCommit"
echo "3. Vérifiez le déclenchement du pipeline dans la console AWS"
echo ""

success "Configuration terminée avec succès!"
