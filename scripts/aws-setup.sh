#!/bin/bash

# Script de configuration AWS pour FloDrama
# Ce script configure l'infrastructure AWS nécessaire pour FloDrama

# Couleurs pour les messages
BLUE='\033[0;34m'
FUCHSIA='\033[0;35m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Afficher le logo FloDrama avec le dégradé signature
echo -e "${BLUE}███████${FUCHSIA}██████  ${BLUE}██       ${FUCHSIA}██████  ${BLUE}██████  ${FUCHSIA}██████  ${BLUE}███    ███${FUCHSIA}  █████  ${NC}"
echo -e "${BLUE}██     ${FUCHSIA}██   ██ ${BLUE}██      ${FUCHSIA}██    ██ ${BLUE}██   ██ ${FUCHSIA}██   ██ ${BLUE}████  ████${FUCHSIA} ██   ██ ${NC}"
echo -e "${BLUE}█████  ${FUCHSIA}██   ██ ${BLUE}██      ${FUCHSIA}██    ██ ${BLUE}██████  ${FUCHSIA}██████  ${BLUE}██ ████ ██${FUCHSIA} ███████ ${NC}"
echo -e "${BLUE}██     ${FUCHSIA}██   ██ ${BLUE}██      ${FUCHSIA}██    ██ ${BLUE}██   ██ ${FUCHSIA}██   ██ ${BLUE}██  ██  ██${FUCHSIA} ██   ██ ${NC}"
echo -e "${BLUE}██     ${FUCHSIA}██████  ${BLUE}███████ ${FUCHSIA}██████  ${BLUE}██   ██ ${FUCHSIA}██   ██ ${BLUE}██      ██${FUCHSIA} ██   ██ ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━${FUCHSIA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Configuration AWS pour FloDrama${NC}"
echo ""

# Vérifier si AWS CLI est installé
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI n'est pas installé. Veuillez l'installer avant de continuer.${NC}"
    echo -e "${YELLOW}Vous pouvez l'installer en suivant les instructions sur : https://aws.amazon.com/cli/${NC}"
    exit 1
fi

# Vérifier si l'utilisateur est connecté à AWS
echo -e "${YELLOW}Vérification de la connexion AWS...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Vous n'êtes pas connecté à AWS. Veuillez configurer vos identifiants AWS.${NC}"
    echo -e "${YELLOW}Exécutez 'aws configure' pour configurer vos identifiants.${NC}"
    exit 1
fi

echo -e "${GREEN}Connexion AWS vérifiée avec succès.${NC}"

# Définir les variables
STACK_NAME="flodrama-stack"
REGION="eu-west-3"  # Paris
API_NAME="flodrama-api"
LAMBDA_AUTH_NAME="flodrama-auth"
LAMBDA_CONTENT_NAME="flodrama-content"
LAMBDA_USER_NAME="flodrama-user"
S3_BUCKET_NAME="flodrama-assets"

# Créer le bucket S3 pour les assets
echo -e "${YELLOW}Création du bucket S3 pour les assets...${NC}"
if aws s3api head-bucket --bucket $S3_BUCKET_NAME 2>/dev/null; then
    echo -e "${YELLOW}Le bucket S3 $S3_BUCKET_NAME existe déjà.${NC}"
else
    aws s3api create-bucket \
        --bucket $S3_BUCKET_NAME \
        --region $REGION \
        --create-bucket-configuration LocationConstraint=$REGION
    
    # Configurer le bucket pour l'hébergement web statique
    aws s3 website s3://$S3_BUCKET_NAME \
        --index-document index.html \
        --error-document error.html
    
    # Configurer la politique CORS
    cat > cors-policy.json << EOL
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET"],
            "AllowedOrigins": ["https://*.github.io"],
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 3000
        }
    ]
}
EOL
    
    aws s3api put-bucket-cors \
        --bucket $S3_BUCKET_NAME \
        --cors-configuration file://cors-policy.json
    
    echo -e "${GREEN}Bucket S3 $S3_BUCKET_NAME créé avec succès.${NC}"
fi

# Créer les fonctions Lambda
echo -e "${YELLOW}Création des fonctions Lambda...${NC}"

# Créer le répertoire pour les fonctions Lambda
mkdir -p lambda/auth lambda/content lambda/user

# Créer la fonction d'authentification
cat > lambda/auth/index.js << EOL
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Variables d'environnement
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Connexion à MongoDB Atlas
let cachedDb = null;
const connectToDatabase = async () => {
  if (cachedDb) {
    return cachedDb;
  }
  
  const client = await MongoClient.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  const db = client.db('flodrama');
  cachedDb = db;
  return db;
};

// Gestionnaire pour l'inscription
const register = async (event) => {
  try {
    const { name, email, password } = JSON.parse(event.body);
    
    // Validation des entrées
    if (!name || !email || !password) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          message: 'Veuillez fournir un nom, un email et un mot de passe'
        })
      };
    }
    
    const db = await connectToDatabase();
    const users = db.collection('users');
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          message: 'Un utilisateur avec cet email existe déjà'
        })
      };
    }
    
    // Hacher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Créer un nouvel utilisateur
    const newUser = {
      name,
      email,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date(),
      lastLogin: new Date(),
      preferences: {
        theme: 'dark',
        language: 'fr',
        notifications: true,
        subtitles: true
      },
      favorites: [],
      watchHistory: []
    };
    
    await users.insertOne(newUser);
    
    // Générer un token JWT
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Retourner la réponse
    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          preferences: newUser.preferences,
          favorites: []
        }
      })
    };
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Erreur lors de l\'inscription',
        error: error.message
      })
    };
  }
};

// Gestionnaire pour la connexion
const login = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body);
    
    // Validation des entrées
    if (!email || !password) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          message: 'Veuillez fournir un email et un mot de passe'
        })
      };
    }
    
    const db = await connectToDatabase();
    const users = db.collection('users');
    
    // Trouver l'utilisateur
    const user = await users.findOne({ email });
    if (!user) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          message: 'Identifiants invalides'
        })
      };
    }
    
    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          message: 'Identifiants invalides'
        })
      };
    }
    
    // Mettre à jour la date de dernière connexion
    await users.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );
    
    // Générer un token JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Retourner la réponse
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          preferences: user.preferences,
          favorites: user.favorites
        }
      })
    };
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Erreur lors de la connexion',
        error: error.message
      })
    };
  }
};

// En-têtes CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE'
};

// Gestionnaire principal
exports.handler = async (event) => {
  // Gérer les requêtes OPTIONS (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }
  
  // Router les requêtes
  const path = event.path.split('/').pop();
  
  if (path === 'register' && event.httpMethod === 'POST') {
    return await register(event);
  } else if (path === 'login' && event.httpMethod === 'POST') {
    return await login(event);
  } else {
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Route non trouvée'
      })
    };
  }
};
EOL

# Créer le fichier package.json pour la fonction d'authentification
cat > lambda/auth/package.json << EOL
{
  "name": "flodrama-auth-lambda",
  "version": "1.0.0",
  "description": "Fonction Lambda d'authentification pour FloDrama",
  "main": "index.js",
  "dependencies": {
    "mongodb": "^6.15.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^3.0.2"
  }
}
EOL

echo -e "${GREEN}Fonctions Lambda créées avec succès.${NC}"

# Créer le template CloudFormation
echo -e "${YELLOW}Création du template CloudFormation...${NC}"

cat > cloudformation-template.yaml << 'EOL'
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Infrastructure AWS pour FloDrama'

Resources:
  # Rôle IAM pour les fonctions Lambda
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

  # Fonction Lambda d'authentification
  AuthLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Ref LambdaAuthName
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Runtime: nodejs18.x
      Timeout: 30
      MemorySize: 256
      Environment:
        Variables:
          MONGODB_URI: !Ref MongoDBURI
          JWT_SECRET: !Ref JWTSecret
          JWT_EXPIRES_IN: !Ref JWTExpiresIn
      Code:
        S3Bucket: !Ref DeploymentBucket
        S3Key: !Sub "${LambdaAuthName}.zip"

  # API Gateway
  FloDramaAPI:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Ref APIName
      Description: API pour FloDrama
      EndpointConfiguration:
        Types:
          - REGIONAL

  # Ressource API pour l'authentification
  AuthResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref FloDramaAPI
      ParentId: !GetAtt FloDramaAPI.RootResourceId
      PathPart: 'auth'

  # Ressource API pour l'inscription
  RegisterResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref FloDramaAPI
      ParentId: !Ref AuthResource
      PathPart: 'register'

  # Méthode POST pour l'inscription
  RegisterMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref FloDramaAPI
      ResourceId: !Ref RegisterResource
      HttpMethod: POST
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${AuthLambdaFunction.Arn}/invocations"
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: 'Empty'
          ResponseParameters:
            method.response.header.Access-Control-Allow-Origin: true
            method.response.header.Access-Control-Allow-Headers: true
            method.response.header.Access-Control-Allow-Methods: true

  # Ressource API pour la connexion
  LoginResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref FloDramaAPI
      ParentId: !Ref AuthResource
      PathPart: 'login'

  # Méthode POST pour la connexion
  LoginMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref FloDramaAPI
      ResourceId: !Ref LoginResource
      HttpMethod: POST
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${AuthLambdaFunction.Arn}/invocations"
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: 'Empty'
          ResponseParameters:
            method.response.header.Access-Control-Allow-Origin: true
            method.response.header.Access-Control-Allow-Headers: true
            method.response.header.Access-Control-Allow-Methods: true

  # Déploiement de l'API
  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - RegisterMethod
      - LoginMethod
    Properties:
      RestApiId: !Ref FloDramaAPI
      StageName: 'prod'

  # Permission Lambda pour l'API Gateway
  LambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !Ref AuthLambdaFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${FloDramaAPI}/*/POST/auth/*"

Outputs:
  ApiEndpoint:
    Description: URL de l'API FloDrama
    Value: !Sub "https://${FloDramaAPI}.execute-api.${AWS::Region}.amazonaws.com/prod"
  S3BucketName:
    Description: Nom du bucket S3 pour les assets
    Value: !Ref S3BucketName
EOL

echo -e "${GREEN}Template CloudFormation créé avec succès.${NC}"

# Créer un fichier .env pour stocker les variables d'environnement AWS
cat > .env.aws << EOL
# Configuration AWS pour FloDrama
VITE_API_URL=https://api.flodrama.com
AWS_REGION=${REGION}
AWS_S3_BUCKET=${S3_BUCKET_NAME}
MONGODB_URI=mongodb+srv://flodrama:${MONGODB_PASSWORD}@flodramacluster.mongodb.net/flodrama?retryWrites=true&w=majority
JWT_SECRET=flodrama_jwt_secret_key_tres_securise_a_changer_en_production
JWT_EXPIRES_IN=7d
EOL

echo -e "${GREEN}Fichier .env.aws créé avec succès.${NC}"

# Créer un script pour déployer l'infrastructure AWS
cat > deploy-aws.sh << 'EOL'
#!/bin/bash

# Script de déploiement de l'infrastructure AWS pour FloDrama

# Variables
STACK_NAME="flodrama-stack"
REGION="eu-west-3"
S3_BUCKET_NAME="flodrama-assets"
LAMBDA_AUTH_NAME="flodrama-auth"
DEPLOYMENT_BUCKET="flodrama-deployment"

# Créer le bucket de déploiement s'il n'existe pas
if ! aws s3api head-bucket --bucket $DEPLOYMENT_BUCKET 2>/dev/null; then
    aws s3api create-bucket \
        --bucket $DEPLOYMENT_BUCKET \
        --region $REGION \
        --create-bucket-configuration LocationConstraint=$REGION
fi

# Installer les dépendances pour les fonctions Lambda
echo "Installation des dépendances pour les fonctions Lambda..."
cd lambda/auth && npm install && cd ../..

# Créer les archives ZIP pour les fonctions Lambda
echo "Création des archives ZIP pour les fonctions Lambda..."
cd lambda/auth && zip -r ../../$LAMBDA_AUTH_NAME.zip * && cd ../..

# Télécharger les archives ZIP vers le bucket de déploiement
echo "Téléchargement des archives ZIP vers le bucket de déploiement..."
aws s3 cp $LAMBDA_AUTH_NAME.zip s3://$DEPLOYMENT_BUCKET/

# Déployer le stack CloudFormation
echo "Déploiement du stack CloudFormation..."
aws cloudformation deploy \
    --template-file cloudformation-template.yaml \
    --stack-name $STACK_NAME \
    --region $REGION \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides \
        APIName="flodrama-api" \
        LambdaAuthName=$LAMBDA_AUTH_NAME \
        DeploymentBucket=$DEPLOYMENT_BUCKET \
        S3BucketName=$S3_BUCKET_NAME \
        MongoDBURI=$(grep MONGODB_URI .env.aws | cut -d '=' -f2) \
        JWTSecret=$(grep JWT_SECRET .env.aws | cut -d '=' -f2) \
        JWTExpiresIn=$(grep JWT_EXPIRES_IN .env.aws | cut -d '=' -f2)

# Récupérer l'URL de l'API
API_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" \
    --output text)

echo "Déploiement terminé avec succès !"
echo "URL de l'API : $API_URL"

# Mettre à jour le fichier .env avec l'URL de l'API
sed -i '' "s|VITE_API_URL=.*|VITE_API_URL=$API_URL|g" .env.aws

echo "Fichier .env.aws mis à jour avec l'URL de l'API."
EOL

chmod +x deploy-aws.sh

echo -e "${GREEN}Script de déploiement AWS créé avec succès.${NC}"

# Instructions finales
echo -e "${YELLOW}Configuration AWS pour FloDrama terminée avec succès !${NC}"
echo -e "${YELLOW}Pour déployer l'infrastructure AWS, exécutez :${NC}"
echo -e "${BLUE}./deploy-aws.sh${NC}"
echo -e "${YELLOW}Assurez-vous d'avoir configuré vos identifiants AWS et d'avoir les permissions nécessaires.${NC}"
