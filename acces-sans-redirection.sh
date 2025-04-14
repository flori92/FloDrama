#!/bin/bash

# Script d'accès sans redirection pour FloDrama
# Respecte l'identité visuelle avec le dégradé signature bleu-fuchsia (#3b82f6 → #d946ef)

echo -e "\033[38;2;59;130;246m╔════════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[38;2;59;130;246m║\033[38;2;217;70;239m            Accès sans redirection à FloDrama              \033[38;2;59;130;246m║\033[0m"
echo -e "\033[38;2;59;130;246m╚════════════════════════════════════════════════════════════╝\033[0m"

# Fonction pour afficher les messages d'étape
function etape() {
  echo -e "\033[38;2;59;130;246m[$1/$4]\033[0m $2"
}

# Fonction pour afficher les succès
function succes() {
  echo -e "\033[38;2;217;70;239m✓\033[0m $1"
}

# Fonction pour afficher les avertissements
function avertissement() {
  echo -e "\033[38;2;217;70;239m!\033[0m $1"
}

# Arrêt des serveurs existants
etape 1 4 "Arrêt des serveurs existants..."
pkill -f "serve" > /dev/null 2>&1
succes "Serveurs arrêtés"

# Création d'un fichier HTML temporaire sans redirection
etape 2 4 "Création d'un fichier HTML temporaire sans redirection..."
mkdir -p /tmp/flodrama-direct
cat > /tmp/flodrama-direct/index.html << EOF
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FloDrama - Accès Direct</title>
  <style>
    body {
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background-color: #121118;
      color: white;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .container {
      max-width: 800px;
      padding: 2rem;
      background-color: #1A1926;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    h1 {
      background: linear-gradient(to right, #3b82f6, #d946ef);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      font-size: 2.5rem;
      margin-bottom: 1.5rem;
    }
    p {
      font-size: 1.1rem;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }
    .btn {
      display: inline-block;
      padding: 0.8rem 1.5rem;
      background: linear-gradient(to right, #3b82f6, #d946ef);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.3s ease;
      margin: 0.5rem;
    }
    .btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4);
    }
    .btn-outline {
      background: transparent;
      border: 2px solid #3b82f6;
      color: #3b82f6;
    }
    .btn-outline:hover {
      background: rgba(59, 130, 246, 0.1);
    }
    .options {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 1rem;
      margin-top: 2rem;
    }
    .note {
      font-size: 0.9rem;
      opacity: 0.7;
      margin-top: 2rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>FloDrama - Accès Direct</h1>
    <p>
      Bienvenue sur la page d'accès direct à FloDrama. Cette interface vous permet d'accéder au site sans être redirigé vers flodrama.com pendant la période de transition.
    </p>
    <p>
      Choisissez une des options ci-dessous pour accéder à l'interface de FloDrama :
    </p>
    
    <div class="options">
      <a href="https://flori92.github.io/FloDrama/" target="_blank" class="btn">Accéder via GitHub Pages</a>
      <a href="http://localhost:3000" target="_blank" class="btn">Accéder via Serveur Local</a>
      <a href="#" onclick="startLocalServer(); return false;" class="btn btn-outline">Démarrer le serveur local</a>
    </div>
    
    <p class="note">
      Note: L'accès via GitHub Pages peut toujours rediriger vers flodrama.com si la propagation DNS n'est pas terminée. Dans ce cas, utilisez l'option du serveur local.
    </p>
  </div>

  <script>
    function startLocalServer() {
      fetch('/start-server')
        .then(response => response.text())
        .then(data => {
          alert('Serveur local démarré! Vous pouvez maintenant accéder à FloDrama via http://localhost:3000');
          setTimeout(() => {
            window.open('http://localhost:3000', '_blank');
          }, 1000);
        })
        .catch(error => {
          alert('Erreur lors du démarrage du serveur: ' + error);
        });
    }
  </script>
</body>
</html>
EOF
succes "Fichier HTML temporaire créé"

# Création d'un script de démarrage du serveur local
cat > /tmp/flodrama-direct/start-server.sh << EOF
#!/bin/bash
cd /Users/floriace/FLO_DRAMA/FloDrama
HOSTNAME=localhost serve -s . -l 3000 &
EOF
chmod +x /tmp/flodrama-direct/start-server.sh
succes "Script de démarrage du serveur local créé"

# Démarrage du serveur d'accès direct
etape 3 4 "Démarrage du serveur d'accès direct..."
cd /tmp/flodrama-direct
npx http-server -p 8080 &
SERVER_PID=$!
succes "Serveur d'accès direct démarré sur le port 8080"

# Instructions pour l'accès
etape 4 4 "Instructions pour l'accès..."
echo -e "\033[38;2;59;130;246m╔════════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[38;2;59;130;246m║\033[38;2;217;70;239m                Accès configuré                            \033[38;2;59;130;246m║\033[0m"
echo -e "\033[38;2;59;130;246m╚════════════════════════════════════════════════════════════╝\033[0m"
echo -e "Accédez à FloDrama sans redirection à l'adresse :"
echo -e "\033[38;2;217;70;239mhttp://localhost:8080\033[0m"
echo -e ""
echo -e "Pour arrêter les serveurs, exécutez :"
echo -e "\033[38;2;217;70;239mpkill -f \"serve\"\033[0m"
echo -e "\033[38;2;217;70;239mpkill -f \"http-server\"\033[0m"

# Ouverture automatique du navigateur
open http://localhost:8080
