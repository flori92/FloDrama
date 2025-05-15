#!/bin/bash

# Script pour mettre à jour les imports dans les fichiers
# Remplace "componets" par "components" dans tous les imports

find /Users/floriace/FLO_DRAMA/FloDrama/New-FloDrama/src -type f -name "*.js" -o -name "*.jsx" | while read file; do
  # Remplacer les imports
  sed -i '' 's/from "\.\.\/componets\//from "\.\.\/components\//g' "$file"
  sed -i '' "s/from '\.\.\/componets\//from '\.\.\/components\//g" "$file"
  
  # Remplacer les imports avec chemin plus profond
  sed -i '' 's/from "\.\.\/.\.\/componets\//from "\.\.\/.\.\/components\//g' "$file"
  sed -i '' "s/from '\.\.\/.\.\/componets\//from '\.\.\/.\.\/components\//g" "$file"
  
  # Remplacer les imports relatifs
  sed -i '' 's/from "\.\/componets\//from "\.\/components\//g' "$file"
  sed -i '' "s/from '\.\/componets\//from '\.\/components\//g" "$file"
  
  echo "Traitement de $file terminé"
done

echo "Mise à jour des imports terminée"
