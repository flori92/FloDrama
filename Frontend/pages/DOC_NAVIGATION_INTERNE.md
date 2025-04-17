# Documentation interne — Navigation & Architecture des pages FloDrama (avril 2025)

## 1. Structure des pages principales

### Pages de section/listing
- `DramasPage.jsx`, `FilmsPage.jsx`, `AnimesPage.jsx`, `BollywoodPage.jsx` : listent les contenus par catégorie principale (utilisent carrousels, grilles dynamiques, filtres simples).
- `HomePage.jsx` : page d’accueil immersive, carrousels mixtes et recommandations personnalisées.
- `LandingPage.jsx` : page d’atterrissage (pré-login ou accès public).

### Pages de navigation avancée
- `BrowsePage.jsx` : **référence principale** pour la navigation avancée sur tout le catalogue. Filtres multiples (type, catégorie, langue, pays, année, tri, recherche). Grille responsive avec `ContentCard`.
- `CategoryPage.jsx` : navigation éditoriale par univers (drama, anime, bollywood, etc.), gestion des sous-catégories, filtres contextuels. Utilise `ContentGrid`.

### Pages de détail
- `DetailPage.jsx` et/ou `ContentPage.jsx` : page(s) générique(s) pour afficher la fiche détaillée d’un contenu (drama, film, anime…).

### Pages spécifiques
- `VideosPage.tsx` : page dédiée à la lecture vidéo (player intégré, monitoring, filtres vidéo).
- `AppDownload.jsx` : page unique pour le téléchargement de l’application (iOS/Android).

### Pages utilitaires/support
- `SettingsPage.jsx`, `ProfilePage.jsx`, `AccountPage.jsx`, `MyListPage.jsx`, `SubscriptionPage.jsx`, `ErrorPage.jsx`, `NotFoundPage.jsx`, etc.
- Dossier `support/` : pages d’aide, FAQ, CGU, confidentialité…

### Pages IA & recommandations
- `RecommendationCarousel.jsx`, `RecommendationsDemo.jsx`, `RecommendationAdmin.jsx`, hooks IA dédiés.

---

## 2. Règles d’architecture et de maintenance
- **Chaque usage a une page de référence unique** (éviter les doublons).
- **Navigation claire** : distinction entre pages de section (listing), pages de navigation avancée, pages de détail.
- **Identité visuelle FloDrama** : respecter la charte (bleu #3b82f6, fuchsia #d946ef, dégradés, fond sombre, SF Pro Display, arrondis, transitions fluides).
- **Suppression des doublons** : toute nouvelle page doit être validée comme non-redondante avant intégration.
- **Factorisation** : privilégier les composants réutilisables (`ContentCard`, `ContentGrid`, `Navbar`, etc.).
- **Documentation** : toute modification majeure doit être documentée dans ce fichier.

---

## 3. Historique des nettoyages récents (avril 2025)
- Suppression de tous les doublons de pages de détail (`DramaPage.jsx`, `MoviePage.jsx`…)
- Suppression des pages de galerie redondantes (`ContentGalleryPage.jsx`, `DownloadAppPage.jsx`…)
- Centralisation des pages de navigation avancée (`BrowsePage.jsx`, `CategoryPage.jsx`)
- Unification de la logique de téléchargement d’app (`AppDownload.jsx`)

---

## 4. Points de vigilance
- Toute nouvelle page de navigation/liste doit être comparée à `BrowsePage.jsx` et `CategoryPage.jsx`.
- Les pages de player vidéo doivent être fusionnées si la logique est identique.
- Les composants d’UI doivent respecter la charte visuelle.

---

## 5. Contact & contribution
Pour toute modification structurelle, contacter l’équipe technique ou référer à ce document avant merge.

---

*Document généré automatiquement (avril 2025) — à maintenir à jour lors de toute évolution majeure.*
