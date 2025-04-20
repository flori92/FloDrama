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
