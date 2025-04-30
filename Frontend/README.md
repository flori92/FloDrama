# FloDrama Frontend

FloDrama est une plateforme moderne de streaming multi-sources dédiée aux dramas, films, animes et contenus asiatiques, offrant une expérience utilisateur immersive et performante.

---

## 🚀 Présentation

FloDrama agrège et présente dynamiquement du contenu vidéo issu de différentes sources, avec une interface inspirée des meilleures plateformes de streaming. L'application met l'accent sur la rapidité, la disponibilité des assets et une expérience visuelle premium (carrousels, dark mode, responsive, etc.).

---

## ✨ Fonctionnalités principales

- **Accueil dynamique** avec sections "Tendances" et "Ajouts récents" (carrousels horizontaux)
- **Navigation multi-catégorie** : Dramas, Films, Animes, Bollywood, WatchParty, Recherche
- **Carrousels modernes** avec effets, badges, overlay et support tactile
- **Système d'images multi-sources** (GitHub Pages, CloudFront, S3) avec fallback automatique
- **Mode sombre/clair** automatique
- **Design responsive** (desktop/mobile)
- **Préparation à l'intégration dynamique** (API, recherche, watchlist, etc.)
- **Performance & accessibilité** (lazy loading, animations fluides, optimisation CDN)

---

## 🏗️ Architecture technique

- **Framework** : Next.js (App Router)
- **UI/UX** : React, Tailwind CSS, CSS modules, Framer Motion
- **Système d'images** :
  - `imageSystemConfig.js` : gestion des priorités/fallback CDN
  - `FloDramaImage.jsx` : composant image réutilisable
  - Placeholders SVG et cache intégré
- **Carrousels** :
  - `ContentRow`, `ContentCard` : carrousels horizontaux et cartes animées
  - Effets de survol, badges, overlay dynamique
- **Navigation** :
  - `MainNavigation` : barre de navigation principale
  - `Footer` : pied de page moderne
  - `HeroBanner` : bannière héroïque personnalisée
- **Configuration** :
  - Alias TypeScript (`@/`) configuré dans `tsconfig.json`
  - Export statique optimisé pour GitHub Pages
  - Fichiers `.nojekyll` et `CNAME` pour le domaine personnalisé

---

## 🖼️ Gestion des images et CDN (important)

### Chargement des images de démonstration et placeholders

- Les images de démo (placeholders) ne sont **plus chargées localement** (`/static/placeholders/...`), mais directement depuis le CDN AWS/CloudFront.
- **URL dynamique** : L’URL de base du CDN est injectée globalement dans la page via le script `aws-config-global.js` :
  ```js
  window.MEDIA_CDN_URL = 'https://d1323ouxr1qbdp.cloudfront.net';
  ```
- Dans le code React (ex : `ContentGrid.tsx`), on accède à cette variable via :
  ```typescript
  // @ts-expect-error: propriété dynamique injectée globalement
  const CDN_URL = (typeof window !== 'undefined' && window.MEDIA_CDN_URL) ? window.MEDIA_CDN_URL : 'https://d1323ouxr1qbdp.cloudfront.net';
  ```
- **Pourquoi ce choix ?**
  - Évite toute erreur de build liée à l’import d’une constante JS non typée ou à la non-existence du module côté TypeScript.
  - Compatible avec tous les environnements (GitHub Pages, CloudFront, développement local).
  - Permet de changer dynamiquement l’URL du CDN sans rebuild.
- **Fallback** : Si la variable n’est pas injectée, l’URL par défaut du CDN est utilisée.
- **TypeScript** : La directive `@ts-expect-error` est utilisée pour ignorer l’erreur de typage sur `window.MEDIA_CDN_URL` (propriété dynamique non déclarée dans les types standards TS).

### Structure attendue sur le CDN
- Les images doivent être accessibles à l’URL : `${MEDIA_CDN_URL}/placeholders/<category>-<index>.webp`
  - Exemple : `https://d1323ouxr1qbdp.cloudfront.net/placeholders/drama-1.webp`
- Le fallback fonctionne pour toutes les catégories simulées (drama, movie, anime, bollywood, etc.)

---

## 🌐 Compatibilité Netlify & GitHub Pages

- Le fichier `netlify.toml` présent à la racine du dossier Frontend **n'a aucun impact** sur le fonctionnement du projet sur GitHub Pages.
- **GitHub Pages ignore ce fichier** : il ne sert qu’à Netlify ou à certains outils d’aperçu pour la configuration du build et des redirections.
- Tu peux donc :
  - Garder `netlify.toml` pour faciliter des tests multi-cloud ou des déploiements alternatifs.
  - Ou le supprimer si tu es certain de ne jamais utiliser Netlify (optionnel, sans effet sur GitHub Pages).
- **Le workflow principal de déploiement reste `.github/workflows/deploy.yml`** : c’est lui qui gère le build, la création de `.nojekyll` et le push vers la branche `gh-pages`.

**En résumé : ton projet est 100 % compatible GitHub Pages, même avec `netlify.toml` présent.**

---

## 📦 Installation & développement

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) pour voir l'application.

---

## 🔗 Ressources complémentaires

- [Documentation Next.js](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)

---

## 📝 Licence

Projet sous licence MIT.
