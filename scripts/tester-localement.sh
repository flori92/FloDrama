#!/bin/bash

# Script de test local pour l'intégration AWS/Vercel
# Créé le 8 avril 2025

set -e

echo "🚀 Test local de l'intégration AWS/Vercel pour FloDrama"

# Récupération des informations de configuration AWS
CONFIG_FILE="./config/video-proxy-config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Fichier de configuration AWS introuvable. Veuillez d'abord exécuter le script configurer-proxy-video-aws.sh."
    exit 1
fi

API_URL=$(jq -r '.apiUrl' "$CONFIG_FILE")
CLOUDFRONT_DOMAIN=$(jq -r '.cloudfrontDomain' "$CONFIG_FILE")

# Création d'un fichier HTML temporaire pour tester l'intégration
cat > ./test-integration.html << EOF
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test d'intégration FloDrama</title>
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
        .card {
            background-color: #1A1926;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        button {
            background: linear-gradient(to right, #3b82f6, #d946ef);
            border: none;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            margin-bottom: 10px;
        }
        pre {
            background-color: #2a293a;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
        }
        .error {
            color: #f87171;
        }
        .success {
            color: #34d399;
        }
    </style>
</head>
<body>
    <h1>Test d'intégration FloDrama</h1>
    
    <div class="card">
        <h2>Test de l'API Gateway</h2>
        <button id="testApi">Tester l'API</button>
        <pre id="apiResult">Résultat apparaîtra ici...</pre>
    </div>
    
    <div class="card">
        <h2>Test de CloudFront</h2>
        <button id="testCloudFront">Tester CloudFront</button>
        <pre id="cloudFrontResult">Résultat apparaîtra ici...</pre>
    </div>

    <script>
        document.getElementById('testApi').addEventListener('click', async () => {
            const resultElement = document.getElementById('apiResult');
            resultElement.textContent = 'Test en cours...';
            
            try {
                const response = await fetch('${API_URL}?contentId=test&quality=720p', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                resultElement.innerHTML = '<span class="success">✅ Succès!</span>\n\n' + JSON.stringify(data, null, 2);
            } catch (error) {
                resultElement.innerHTML = '<span class="error">❌ Erreur!</span>\n\n' + error.message;
            }
        });
        
        document.getElementById('testCloudFront').addEventListener('click', async () => {
            const resultElement = document.getElementById('cloudFrontResult');
            resultElement.textContent = 'Test en cours...';
            
            try {
                const response = await fetch('https://${CLOUDFRONT_DOMAIN}', {
                    method: 'HEAD'
                });
                
                resultElement.innerHTML = '<span class="success">✅ Succès!</span>\n\nStatut: ' + response.status + ' ' + response.statusText;
            } catch (error) {
                resultElement.innerHTML = '<span class="error">❌ Erreur!</span>\n\n' + error.message;
            }
        });
    </script>
</body>
</html>
EOF

echo "✅ Fichier de test créé: test-integration.html"
echo "📌 Ouvrez ce fichier dans votre navigateur pour tester l'intégration"

# Ouvrir le fichier HTML dans le navigateur par défaut
if [[ "$OSTYPE" == "darwin"* ]]; then
    open ./test-integration.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open ./test-integration.html
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    start ./test-integration.html
else
    echo "📌 Veuillez ouvrir manuellement le fichier test-integration.html dans votre navigateur"
fi
