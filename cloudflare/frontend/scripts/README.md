# Script de vérification du fichier content.json

## Objectif
Ce script (`checkContentJson.js`) permet de vérifier et corriger automatiquement les entrées du fichier `src/data/content.json` afin de garantir la présence des champs critiques nécessaires à l’affichage correct des contenus dans l’application FloDrama.

## Fonctionnalités
- Vérifie chaque entrée du tableau `data` pour les champs suivants :
  - `poster` ou `posterUrl`
  - `backdrop` ou `imageUrl`
  - `trailer_url` ou `trailerUrl`
  - `title`
  - `description`
  - `watch_url`
- Ajoute un placeholder si un champ est manquant ou vide :
  - Images : `/images/placeholder.jpg` ou `/images/placeholder-backdrop.jpg`
  - Vidéo : `/videos/placeholder.mp4`
  - Titre : "Titre inconnu"
  - Description : "Description manquante."
  - Lien : `#`
- Génère un fichier corrigé `src/data/content.fixed.json` pour ne pas écraser l’original.
- Affiche un rapport des corrections effectuées en console.

## Utilisation

```bash
node scripts/checkContentJson.js
```

Le script doit être lancé depuis la racine du dossier `frontend`. Il nécessite Node.js.

## Historique
- 2025-05-07 : Création initiale du script et documentation associée.

---

*Pour toute modification future du format de données, adapter ce script en conséquence.*
