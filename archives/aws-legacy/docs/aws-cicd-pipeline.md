# Pipeline CI/CD AWS pour FloDrama Multi-plateformes

Ce document détaille la configuration d'un pipeline CI/CD complet sur AWS pour le projet FloDrama multi-plateformes.

## Architecture globale

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  CodeCommit │────>│  CodeBuild  │────>│ CodeDeploy  │────>│    S3 +     │
│  ou GitHub  │     │             │     │             │     │ CloudFront  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                          │                    │
                          ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │ Device Farm │     │   Lambda    │
                    │  (Mobile)   │     │ (Automation)│
                    └─────────────┘     └─────────────┘
                                              │
                                              ▼
                                        ┌─────────────┐
                                        │     SNS     │
                                        │(Notification)│
                                        └─────────────┘
```

## Configuration détaillée

### 1. Configuration du dépôt CodeCommit

```bash
# Création du dépôt
aws codecommit create-repository --repository-name flodrama-monorepo --repository-description "Monorepo FloDrama multi-plateformes"

# Configuration des notifications
aws codecommit put-repository-triggers --repository-name flodrama-monorepo --triggers name=BuildTrigger,destinationArn=arn:aws:sns:region:account-id:BuildNotification,events=UPDATE,PUSH
```

### 2. Configuration de CodeBuild pour les différentes plateformes

#### Web (buildspec-web.yml)

```yaml
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
      - aws s3 sync apps/web/build/ s3://flodrama-app-bucket/ --delete
      - aws cloudfront create-invalidation --distribution-id E1MU6L4S4UVUSS --paths "/*"

artifacts:
  files:
    - apps/web/build/**/*
  base-directory: '.'

cache:
  paths:
    - 'node_modules/**/*'
    - '.turbo/**/*'
```

#### Mobile Android (buildspec-android.yml)

```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 16
      java: corretto11
    commands:
      - npm install -g yarn
      - yarn install
  pre_build:
    commands:
      - export ENVFILE=.env.production
  build:
    commands:
      - yarn workspace @flodrama/mobile android:build
  post_build:
    commands:
      - aws s3 cp apps/mobile/android/app/build/outputs/apk/release/app-release.apk s3://flodrama-builds/android/flodrama-$(date +%Y%m%d-%H%M%S).apk

artifacts:
  files:
    - apps/mobile/android/app/build/outputs/apk/release/app-release.apk
  base-directory: '.'

cache:
  paths:
    - 'node_modules/**/*'
    - '.turbo/**/*'
    - 'apps/mobile/node_modules/**/*'
```

#### Mobile iOS (buildspec-ios.yml)

```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 16
    commands:
      - npm install -g yarn
      - yarn install
      - brew install cocoapods
  pre_build:
    commands:
      - export ENVFILE=.env.production
      - cd apps/mobile/ios && pod install
  build:
    commands:
      - yarn workspace @flodrama/mobile ios:build
  post_build:
    commands:
      - aws s3 cp apps/mobile/ios/build/Build/Products/Release-iphoneos/FloDrama.ipa s3://flodrama-builds/ios/flodrama-$(date +%Y%m%d-%H%M%S).ipa

artifacts:
  files:
    - apps/mobile/ios/build/Build/Products/Release-iphoneos/FloDrama.ipa
  base-directory: '.'

cache:
  paths:
    - 'node_modules/**/*'
    - '.turbo/**/*'
    - 'apps/mobile/node_modules/**/*'
    - 'apps/mobile/ios/Pods/**/*'
```

#### Desktop (buildspec-desktop.yml)

```yaml
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
      - yarn workspace @flodrama/desktop build
      - yarn workspace @flodrama/desktop electron:build
  post_build:
    commands:
      - aws s3 cp apps/desktop/dist/FloDrama*.dmg s3://flodrama-builds/desktop/mac/
      - aws s3 cp apps/desktop/dist/FloDrama*.exe s3://flodrama-builds/desktop/windows/
      - aws s3 cp apps/desktop/dist/FloDrama*.AppImage s3://flodrama-builds/desktop/linux/

artifacts:
  files:
    - apps/desktop/dist/**/*
  base-directory: '.'

cache:
  paths:
    - 'node_modules/**/*'
    - '.turbo/**/*'
    - 'apps/desktop/node_modules/**/*'
```

### 3. Configuration de CodePipeline

```json
{
  "pipeline": {
    "name": "FloDrama-Pipeline",
    "roleArn": "arn:aws:iam::account-id:role/service-role/AWSCodePipelineServiceRole-region-FloDrama-Pipeline",
    "artifactStore": {
      "type": "S3",
      "location": "flodrama-pipeline-artifacts"
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
        "name": "Build-Web",
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
              "ProjectName": "FloDrama-Web-Build"
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
        "name": "Build-Mobile",
        "actions": [
          {
            "name": "BuildAndroid",
            "actionTypeId": {
              "category": "Build",
              "owner": "AWS",
              "provider": "CodeBuild",
              "version": "1"
            },
            "configuration": {
              "ProjectName": "FloDrama-Android-Build"
            },
            "inputArtifacts": [
              {
                "name": "SourceCode"
              }
            ],
            "outputArtifacts": [
              {
                "name": "AndroidBuildOutput"
              }
            ]
          },
          {
            "name": "BuildiOS",
            "actionTypeId": {
              "category": "Build",
              "owner": "AWS",
              "provider": "CodeBuild",
              "version": "1"
            },
            "configuration": {
              "ProjectName": "FloDrama-iOS-Build"
            },
            "inputArtifacts": [
              {
                "name": "SourceCode"
              }
            ],
            "outputArtifacts": [
              {
                "name": "iOSBuildOutput"
              }
            ]
          }
        ]
      },
      {
        "name": "Build-Desktop",
        "actions": [
          {
            "name": "BuildDesktop",
            "actionTypeId": {
              "category": "Build",
              "owner": "AWS",
              "provider": "CodeBuild",
              "version": "1"
            },
            "configuration": {
              "ProjectName": "FloDrama-Desktop-Build"
            },
            "inputArtifacts": [
              {
                "name": "SourceCode"
              }
            ],
            "outputArtifacts": [
              {
                "name": "DesktopBuildOutput"
              }
            ]
          }
        ]
      },
      {
        "name": "Test-Mobile",
        "actions": [
          {
            "name": "TestOnDeviceFarm",
            "actionTypeId": {
              "category": "Test",
              "owner": "AWS",
              "provider": "DeviceFarm",
              "version": "1"
            },
            "configuration": {
              "ProjectId": "arn:aws:devicefarm:us-west-2:account-id:project:project-id",
              "DevicePoolArn": "arn:aws:devicefarm:us-west-2:account-id:devicepool:project-id/pool-id",
              "AppType": "ANDROID_APP",
              "App": "AndroidBuildOutput/apps/mobile/android/app/build/outputs/apk/release/app-release.apk",
              "TestType": "APPIUM_NODE"
            },
            "inputArtifacts": [
              {
                "name": "AndroidBuildOutput"
              }
            ]
          }
        ]
      },
      {
        "name": "Deploy-Web",
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
          },
          {
            "name": "InvalidateCloudFront",
            "actionTypeId": {
              "category": "Invoke",
              "owner": "AWS",
              "provider": "Lambda",
              "version": "1"
            },
            "configuration": {
              "FunctionName": "CloudFrontInvalidation",
              "UserParameters": "{\"distributionId\":\"E1MU6L4S4UVUSS\",\"paths\":[\"/*\"]}"
            },
            "inputArtifacts": []
          }
        ]
      },
      {
        "name": "Notify",
        "actions": [
          {
            "name": "NotifyTeam",
            "actionTypeId": {
              "category": "Invoke",
              "owner": "AWS",
              "provider": "Lambda",
              "version": "1"
            },
            "configuration": {
              "FunctionName": "DeploymentNotification"
            },
            "inputArtifacts": []
          }
        ]
      }
    ]
  }
}
```

### 4. Fonction Lambda pour les notifications

```javascript
// index.js - Fonction Lambda pour les notifications de déploiement
const AWS = require('aws-sdk');
const sns = new AWS.SNS();

exports.handler = async (event) => {
    const message = {
        web: 'https://d1pbqs2b6em4ha.cloudfront.net',
        android: 'https://flodrama-builds.s3.amazonaws.com/android/',
        ios: 'https://flodrama-builds.s3.amazonaws.com/ios/',
        desktop: {
            mac: 'https://flodrama-builds.s3.amazonaws.com/desktop/mac/',
            windows: 'https://flodrama-builds.s3.amazonaws.com/desktop/windows/',
            linux: 'https://flodrama-builds.s3.amazonaws.com/desktop/linux/'
        }
    };
    
    await sns.publish({
        TopicArn: 'arn:aws:sns:region:account-id:DeploymentNotifications',
        Subject: 'FloDrama - Nouveau déploiement disponible',
        Message: JSON.stringify(message, null, 2)
    }).promise();
    
    return { statusCode: 200, body: 'Notification envoyée' };
};
```

## Gestion des environnements

Pour gérer différents environnements (développement, test, production), vous pouvez:

1. Créer des branches dédiées dans CodeCommit (dev, staging, main)
2. Configurer des pipelines distincts pour chaque environnement
3. Utiliser des variables d'environnement spécifiques à chaque pipeline

## Sécurité et bonnes pratiques

1. **Gestion des secrets**: Utiliser AWS Secrets Manager pour stocker les clés API, certificats, etc.
2. **IAM**: Configurer des rôles IAM avec le principe du moindre privilège
3. **Surveillance**: Mettre en place des alertes CloudWatch pour surveiller le pipeline
4. **Approbations manuelles**: Ajouter des étapes d'approbation manuelle avant les déploiements en production

## Coûts estimés

| Service | Utilisation | Coût mensuel estimé |
|---------|------------|---------------------|
| CodeCommit | 5 utilisateurs, 50 GB | $5 |
| CodeBuild | 100 minutes/jour | $30 |
| CodePipeline | 1 pipeline actif | $1 |
| S3 | 50 GB stockage | $1.15 |
| CloudFront | 50 GB transfert | $4.25 |
| Device Farm | 10 heures de test | $25 |
| Lambda | 1000 invocations | Gratuit (Free Tier) |
| SNS | 1000 notifications | Gratuit (Free Tier) |
| **Total** | | **~$66.40** |

*Note: Ces coûts sont des estimations et peuvent varier en fonction de l'utilisation réelle.*
