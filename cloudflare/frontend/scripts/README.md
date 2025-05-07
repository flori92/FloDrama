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

## Script de déploiement Cloudflare Pages

### Objectif
Le script `deploy_to_cloudflare.sh` automatise le déploiement de l’application FloDrama sur Cloudflare Pages, en gérant l’authentification (y compris OAuth), la compilation, et l’invalidation du cache.

### Utilisation
Depuis le dossier `frontend` :

```bash
bash scripts/deploy_to_cloudflare.sh --env prod --project flodrama-frontend
```

#### Options principales
- `--env` ou `-e` : Environnement de déploiement (`dev`, `staging`, `prod`).
- `--project` ou `-p` : Nom du projet Cloudflare Pages (ex : `flodrama-frontend`).
- `--branch` ou `-b` : Branche à déployer (par défaut : `main`).

### Fonctionnement
- Vérifie les prérequis (`npm`, `wrangler`, connexion Cloudflare).
- Charge automatiquement les variables d’environnement depuis `.env`.
- Compile l’application (`npm run build`).
- Déploie sur Cloudflare Pages avec gestion automatique de l’authentification (contournement des problèmes d’API token via OAuth si besoin).
- Invalide le cache du projet après déploiement.

### Points de vigilance
- Si l’authentification échoue, le script lance automatiquement `wrangler login` (OAuth).
- Le fichier `.env` doit contenir `CLOUDFLARE_ACCOUNT_ID` et `CLOUDFLARE_API_TOKEN`.
- Le fichier `wrangler.toml` doit contenir la ligne :
  ```toml
  pages_build_output_dir = "dist"
  ```
- Le script affiche un récapitulatif complet à la fin du déploiement.

### Historique
- 2025-05-07 : Création initiale du script et documentation associée.
- 2025-05-07 : Ajout de la section sur le déploiement Cloudflare Pages et la gestion de l’authentification.

---

*Pour toute modification future du format de données ou du processus de déploiement, adapter ce script et cette documentation en conséquence.*
