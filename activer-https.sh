#!/bin/bash

# Script d'activation HTTPS pour FloDrama sur GitHub Pages
# Respecte l'identité visuelle avec le dégradé signature bleu-fuchsia (#3b82f6 → #d946ef)

echo -e "\033[38;2;59;130;246m╔════════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[38;2;59;130;246m║\033[38;2;217;70;239m            Activation HTTPS pour FloDrama                  \033[38;2;59;130;246m║\033[0m"
echo -e "\033[38;2;59;130;246m╚════════════════════════════════════════════════════════════╝\033[0m"

# Vérification de la configuration DNS
echo -e "\033[38;2;59;130;246m[1/5]\033[0m Vérification de la configuration DNS..."
DNS_CHECK=$(dig flodrama.com +short)
if [[ $DNS_CHECK == *"185.199.108.153"* || $DNS_CHECK == *"185.199.109.153"* || $DNS_CHECK == *"185.199.110.153"* || $DNS_CHECK == *"185.199.111.153"* ]]; then
  echo -e "\033[38;2;217;70;239m✓\033[0m Configuration DNS correcte"
else
  echo -e "\033[31m✗\033[0m Configuration DNS incorrecte. Veuillez vérifier vos enregistrements DNS."
  exit 1
fi

# Vérification de la configuration GitHub Pages
echo -e "\033[38;2;59;130;246m[2/5]\033[0m Vérification de la configuration GitHub Pages..."
PAGES_CONFIG=$(gh api repos/flori92/FloDrama/pages)
if [[ $PAGES_CONFIG == *"\"cname\":\"flodrama.com\""* ]]; then
  echo -e "\033[38;2;217;70;239m✓\033[0m Domaine personnalisé correctement configuré"
else
  echo -e "\033[31m✗\033[0m Domaine personnalisé non configuré. Veuillez vérifier vos paramètres GitHub Pages."
  exit 1
fi

# Vérification du fichier CNAME
echo -e "\033[38;2;59;130;246m[3/5]\033[0m Vérification du fichier CNAME..."
if [ -f "CNAME" ] && [ "$(cat CNAME)" == "flodrama.com" ]; then
  echo -e "\033[38;2;217;70;239m✓\033[0m Fichier CNAME correctement configuré"
else
  echo -e "\033[38;2;217;70;239m!\033[0m Création du fichier CNAME..."
  echo "flodrama.com" > CNAME
  git add CNAME
  git commit -m "✨ [FEAT] Ajout du fichier CNAME pour le domaine personnalisé"
  git push origin github-pages-clean
  echo -e "\033[38;2;217;70;239m✓\033[0m Fichier CNAME créé et poussé vers GitHub"
fi

# Tentative d'activation HTTPS
echo -e "\033[38;2;59;130;246m[4/5]\033[0m Tentative d'activation HTTPS..."
HTTPS_RESULT=$(gh api -X PUT repos/flori92/FloDrama/pages --input - << EOF
{
  "https_enforced": true
}
EOF 2>&1)

if [[ $HTTPS_RESULT == *"certificate does not exist yet"* ]]; then
  echo -e "\033[38;2;217;70;239m!\033[0m Le certificat SSL n'a pas encore été émis par GitHub Pages."
  echo -e "   Cela peut prendre jusqu'à 24 heures après la configuration DNS."
  echo -e "   Veuillez réessayer plus tard."
elif [[ $HTTPS_RESULT == *"error"* || $HTTPS_RESULT == *"Error"* ]]; then
  echo -e "\033[31m✗\033[0m Erreur lors de l'activation HTTPS: $HTTPS_RESULT"
else
  echo -e "\033[38;2;217;70;239m✓\033[0m HTTPS activé avec succès"
fi

# Instructions pour la vérification manuelle
echo -e "\033[38;2;59;130;246m[5/5]\033[0m Instructions pour la vérification manuelle..."
echo -e "Pour vérifier manuellement la configuration HTTPS :"
echo -e "1. Accédez aux paramètres de votre dépôt GitHub"
echo -e "2. Cliquez sur 'Pages' dans le menu latéral"
echo -e "3. Vérifiez la section 'Custom domain' et assurez-vous que 'Enforce HTTPS' est coché"
echo -e "4. Si l'option n'est pas disponible, attendez que GitHub vérifie votre domaine (jusqu'à 24h)"

echo -e "\033[38;2;59;130;246m╔════════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[38;2;59;130;246m║\033[38;2;217;70;239m                Processus terminé                           \033[38;2;59;130;246m║\033[0m"
echo -e "\033[38;2;59;130;246m╚════════════════════════════════════════════════════════════╝\033[0m"
echo -e "FloDrama sera bientôt accessible en HTTPS à l'adresse :"
echo -e "\033[38;2;217;70;239mhttps://flodrama.com\033[0m"
