# Documentation technique — FloDrama Frontend (avril 2025)

## 1. Introduction
Ce document présente les principes techniques, l’architecture, les conventions et les bonnes pratiques pour contribuer efficacement au frontend FloDrama.

---

## 2. Architecture générale
- **Framework** : React (fonctionnel, hooks, composants réutilisables)
- **Navigation** : React Router (pages dans `Frontend/pages`)
- **Gestion d’état** : hooks locaux, contextes si besoin
- **Animations** : Framer Motion
- **Design** : palette FloDrama (bleu #3b82f6, fuchsia #d946ef, fond sombre #121118), police SF Pro Display, arrondis 8px, transitions 0.3s
- **Organisation** :
  - `pages/` : pages principales (listing, navigation, détail, utilitaires)
  - `components/` : composants UI réutilisables (cards, carrousels, navbar, footer, etc.)
  - `hooks/` : hooks personnalisés (ex : useRecommendations, useWatchlist)
  - `services/` : accès aux données (ContentDataService, SmartScrapingService, etc.)
  - `styles/` : fichiers CSS/SCSS
  - `support/` : pages d’aide, CGU, FAQ, etc.

---

## 3. Pages et navigation
- **Pages de section** : `DramasPage.jsx`, `FilmsPage.jsx`, etc. (listing par catégorie)
- **Navigation avancée** : `BrowsePage.jsx` (filtres multiples), `CategoryPage.jsx` (univers/sous-catégories)
- **Pages de détail** : `DetailPage.jsx`/`ContentPage.jsx` (fiche détaillée)
- **Pages vidéo** : `VideosPage.tsx` (player intégré)
- **Téléchargement app** : `AppDownload.jsx` (unique)
- **Pages utilitaires** : settings, profil, etc.

---

## 4. Système de recommandations IA
- **Composants** : `RecommendationCarousel.jsx`, `RecommendationDetail.jsx`, `RecommendationStats.jsx`
- **Hooks** : `useRecommendations.js`
- **Pages** : `RecommendationsDemo.jsx`, `RecommendationAdmin.jsx`
- **Algorithmes** : contextuels (heure, appareil, saison), comportementaux (genres préférés, habitudes), scoring multi-facteurs, cache optimisé
- **Respect de l’identité visuelle**

---

## 5. Bonnes pratiques
- **Respecter la charte visuelle** (palette, typographie, arrondis, transitions)
- **Factoriser les composants** (éviter la duplication de logique/UI)
- **Centraliser la logique métier** dans les hooks/services
- **Utiliser les hooks React** pour la gestion d’état et les effets
- **Commentaires et documentation** : commenter tout code complexe, documenter les nouveaux composants/pages dans le doc interne
- **Suppression des doublons** : toute nouvelle page doit être validée comme non-redondante
- **Tests UI/UX** : valider le responsive et l’accessibilité (a11y)

---

## 6. Contribution
- **Branches** : créer une branche par fonctionnalité/bugfix
- **Commits** : messages clairs, en français, format : `[TYPE] Description courte`
- **Pull Requests** : description détaillée, capture d’écran si UI, lier à une issue si possible
- **Revue de code** : relire les impacts sur la navigation, la cohérence visuelle et la logique métier
- **Documentation** : mettre à jour ce fichier et le doc interne à chaque évolution majeure

---

## 7. Points de vigilance
- **Navigation** : ne pas multiplier les pages de listing, préférer l’extension des pages existantes
- **Player vidéo** : fusionner les pages si la logique est identique
- **Recommandations IA** : ne jamais casser la chaîne de scoring/contextualisation
- **Sécurité** : ne jamais exposer d’API key ou donnée sensible dans le frontend

---

## 8. Contact
Pour toute question ou évolution majeure, contacter l’équipe technique ou référer à la documentation interne.

---

*Document généré automatiquement (avril 2025) — à maintenir à jour lors de toute évolution technique majeure.*
