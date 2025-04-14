#!/bin/bash

# Script de vérification des liens pour FloDrama
# Respecte l'identité visuelle avec le dégradé signature bleu-fuchsia (#3b82f6 → #d946ef)

echo -e "\033[38;2;59;130;246m╔════════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[38;2;59;130;246m║\033[38;2;217;70;239m        Vérification des liens pour FloDrama               \033[38;2;59;130;246m║\033[0m"
echo -e "\033[38;2;59;130;246m╚════════════════════════════════════════════════════════════╝\033[0m"

# Fonction pour afficher les messages d'étape
function etape() {
  echo -e "\033[38;2;59;130;246m[$1/$2]\033[0m $3"
}

# Fonction pour afficher les succès
function succes() {
  echo -e "\033[38;2;217;70;239m✓\033[0m $1"
}

# Fonction pour afficher les avertissements
function avertissement() {
  echo -e "\033[38;2;217;70;239m!\033[0m $1"
}

# Fonction pour afficher les erreurs
function erreur() {
  echo -e "\033[31m✗\033[0m $1"
}

# Fonction pour vérifier un lien
function verifier_lien() {
  local url=$1
  local description=$2
  local statut
  
  # Si c'est une URL relative, la convertir en URL absolue
  if [[ $url == /FloDrama/* ]]; then
    url="https://flori92.github.io$url"
  fi
  
  # Vérifier si l'URL est valide
  if [[ $url == mailto:* ]]; then
    succes "$description: $url (lien email valide)"
    return 0
  elif [[ $url == \#* ]]; then
    succes "$description: $url (lien ancre valide)"
    return 0
  elif [[ $url == /* || $url == ./* ]]; then
    # Lien local, vérifier si le fichier existe
    local fichier=${url#/FloDrama/}
    fichier=${fichier#./}
    if [ -f "$fichier" ]; then
      succes "$description: $url (fichier local existant)"
      return 0
    else
      erreur "$description: $url (fichier local manquant)"
      return 1
    fi
  else
    # URL externe, vérifier avec curl
    statut=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    if [ "$statut" == "200" ] || [ "$statut" == "301" ] || [ "$statut" == "302" ]; then
      succes "$description: $url (statut HTTP $statut)"
      return 0
    else
      erreur "$description: $url (statut HTTP $statut)"
      return 1
    fi
  fi
}

# 1. Vérification des liens de navigation
etape 1 4 "Vérification des liens de navigation..."

# Liste des liens de navigation à vérifier
declare -A nav_links=(
  ["/FloDrama/index.html"]="Lien Accueil"
  ["/FloDrama/dramas.html"]="Lien Dramas"
  ["/FloDrama/films.html"]="Lien Films"
  ["/FloDrama/animes.html"]="Lien Animés"
  ["/FloDrama/bollywood.html"]="Lien Bollywood"
  ["/FloDrama/ma-liste.html"]="Lien Ma Liste"
  ["/FloDrama/app.html"]="Lien App"
  ["/FloDrama/contact.html"]="Lien Contact"
)

# Vérification de chaque lien de navigation
erreurs_nav=0
for lien in "${!nav_links[@]}"; do
  if ! verifier_lien "$lien" "${nav_links[$lien]}"; then
    ((erreurs_nav++))
  fi
done

if [ $erreurs_nav -eq 0 ]; then
  succes "Tous les liens de navigation sont valides"
else
  avertissement "$erreurs_nav liens de navigation sont invalides"
fi

# 2. Vérification des liens du footer
etape 2 4 "Vérification des liens du footer..."

# Liste des liens du footer à vérifier
declare -A footer_links=(
  ["/FloDrama/a-propos.html"]="Lien À propos"
  ["/FloDrama/conditions.html"]="Lien Conditions d'utilisation"
  ["/FloDrama/confidentialite.html"]="Lien Confidentialité"
  ["/FloDrama/contact.html"]="Lien Contact (footer)"
)

# Vérification de chaque lien du footer
erreurs_footer=0
for lien in "${!footer_links[@]}"; do
  if ! verifier_lien "$lien" "${footer_links[$lien]}"; then
    ((erreurs_footer++))
  fi
done

if [ $erreurs_footer -eq 0 ]; then
  succes "Tous les liens du footer sont valides"
else
  avertissement "$erreurs_footer liens du footer sont invalides"
fi

# 3. Vérification des liens de contact et email
etape 3 4 "Vérification des liens de contact et email..."

# Liste des liens de contact à vérifier
declare -A contact_links=(
  ["mailto:contact@flodrama.com"]="Email de contact"
  ["mailto:suggestions@flodrama.com"]="Email de suggestions"
  ["mailto:privacy@flodrama.com"]="Email de confidentialité"
  ["mailto:legal@flodrama.com"]="Email légal"
)

# Vérification de chaque lien de contact
erreurs_contact=0
for lien in "${!contact_links[@]}"; do
  if ! verifier_lien "$lien" "${contact_links[$lien]}"; then
    ((erreurs_contact++))
  fi
done

if [ $erreurs_contact -eq 0 ]; then
  succes "Tous les liens de contact sont valides"
else
  avertissement "$erreurs_contact liens de contact sont invalides"
fi

# 4. Vérification des ressources statiques
etape 4 4 "Vérification des ressources statiques..."

# Liste des ressources statiques à vérifier
declare -A static_resources=(
  ["/FloDrama/logo.svg"]="Logo SVG"
  ["/FloDrama/logo192.png"]="Logo PNG"
  ["/FloDrama/manifest.json"]="Manifest JSON"
)

# Vérification de chaque ressource statique
erreurs_static=0
for ressource in "${!static_resources[@]}"; do
  if ! verifier_lien "$ressource" "${static_resources[$ressource]}"; then
    ((erreurs_static++))
  fi
done

if [ $erreurs_static -eq 0 ]; then
  succes "Toutes les ressources statiques sont valides"
else
  avertissement "$erreurs_static ressources statiques sont invalides"
fi

# Résumé des résultats
echo -e "\033[38;2;59;130;246m╔════════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[38;2;59;130;246m║\033[38;2;217;70;239m                Résumé des vérifications                    \033[38;2;59;130;246m║\033[0m"
echo -e "\033[38;2;59;130;246m╚════════════════════════════════════════════════════════════╝\033[0m"

total_erreurs=$((erreurs_nav + erreurs_footer + erreurs_contact + erreurs_static))
total_liens=$((${#nav_links[@]} + ${#footer_links[@]} + ${#contact_links[@]} + ${#static_resources[@]}))

if [ $total_erreurs -eq 0 ]; then
  echo -e "\033[38;2;217;70;239m✓\033[0m Tous les liens ($total_liens) sont valides !"
else
  echo -e "\033[31m✗\033[0m $total_erreurs liens sur $total_liens sont invalides"
  
  # Suggestions de correction
  echo -e "\033[38;2;59;130;246m[Suggestions]\033[0m Voici comment corriger les problèmes :"
  
  if [ $erreurs_nav -gt 0 ]; then
    echo -e "1. Vérifiez que tous les fichiers HTML de navigation existent dans le dépôt GitHub"
    echo -e "   Assurez-vous que tous les liens commencent par /FloDrama/"
  fi
  
  if [ $erreurs_footer -gt 0 ]; then
    echo -e "2. Vérifiez que tous les fichiers HTML du footer existent dans le dépôt GitHub"
    echo -e "   Assurez-vous que tous les liens commencent par /FloDrama/"
  fi
  
  if [ $erreurs_static -gt 0 ]; then
    echo -e "3. Vérifiez que toutes les ressources statiques (logo, manifest) existent dans le dépôt GitHub"
    echo -e "   Assurez-vous que les chemins sont corrects et commencent par /FloDrama/"
  fi
fi

# Vérification de la redirection vers HTTPS
echo -e "\n\033[38;2;59;130;246m[Vérification HTTPS]\033[0m Vérification de la redirection vers HTTPS..."
https_status=$(curl -s -o /dev/null -w "%{http_code}" "https://flodrama.com")

if [ "$https_status" == "200" ] || [ "$https_status" == "301" ] || [ "$https_status" == "302" ]; then
  succes "Le site est accessible en HTTPS (statut HTTP $https_status)"
else
  avertissement "Le site n'est pas encore accessible en HTTPS (statut HTTP $https_status)"
  echo -e "   Le certificat SSL est probablement encore en cours de propagation"
  echo -e "   Cela peut prendre jusqu'à 24 heures après la configuration DNS"
fi
