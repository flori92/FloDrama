#!/bin/bash

# Script de configuration de l'environnement local pour le service de paiement FloDrama
# Ce script installe les dépendances nécessaires et configure l'environnement local

echo "🚀 Configuration de l'environnement local pour le service de paiement FloDrama"

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# Installer Serverless Framework globalement si ce n'est pas déjà fait
if ! command -v serverless &> /dev/null; then
    echo "📦 Installation de Serverless Framework..."
    npm install -g serverless
fi

# Installer les plugins Serverless
echo "📦 Installation des plugins Serverless..."
npm install --save-dev serverless-offline serverless-dynamodb-local

# Créer le fichier .env à partir de .env.example s'il n'existe pas
if [ ! -f .env ]; then
    echo "📝 Création du fichier .env à partir de .env.example..."
    cp .env.example .env
    echo "⚠️ N'oubliez pas de modifier les valeurs dans le fichier .env selon votre environnement."
fi

# Installer DynamoDB local
echo "📦 Installation de DynamoDB local..."
serverless dynamodb install || {
    echo "⚠️ Impossible d'installer DynamoDB local via Serverless."
    echo "⚠️ Vous pouvez l'installer manuellement en suivant les instructions sur:"
    echo "⚠️ https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html"
}

echo "✅ Configuration terminée!"
echo "🔍 Pour démarrer le service en local, exécutez: npm start"
echo "🔍 Pour déployer le service sur AWS, exécutez: npm run deploy"
