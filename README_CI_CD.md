# 🚀 Automatisation CI/CD pour FloDrama

## 1. Scraping & Synchronisation Supabase

Le workflow `.github/workflows/scraping.yml` automatise le scraping quotidien des contenus et la synchronisation avec Supabase.

- **Déclenchement** :
  - Tous les jours à 3h du matin (cron)
  - Ou manuellement depuis GitHub Actions
- **Étapes principales** :
  1. Checkout du code
  2. Installation de Python 3.11 et des dépendances (`requirements.txt`)
  3. Injection des secrets Supabase (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`)
  4. Exécution des scripts de scraping (ajuster selon les sources)
  5. Commit & push des éventuelles modifications de données (optionnel)

**Secrets à configurer dans GitHub** :
- `SUPABASE_URL` : URL de votre instance Supabase
- `SUPABASE_SERVICE_KEY` : Clé service role Supabase

---

## 2. CI/CD Frontend (Vercel)

Le workflow `.github/workflows/frontend.yml` vérifie automatiquement le build et les tests du frontend à chaque push ou pull request sur `main`.

- **Étapes principales** :
  1. Checkout du code
  2. Installation de Node.js 20.x
  3. Installation des dépendances (`npm ci`)
  4. Build (`npm run build`) et tests (`npm test`)

> **Remarque** :
> Le déploiement sur Vercel est géré automatiquement par Vercel lors des pushs sur `main`. Si besoin de forcer un redeploy après scraping, utiliser l’API Vercel ou le dashboard.

---

## 3. Variables d’environnement à définir

### Sur Vercel (Frontend)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Sur GitHub (pour les workflows)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

---

## 4. Conseils & Bonnes pratiques
- **Sécurisez vos secrets** : ne jamais commit de clés dans le code.
- **Surveillez les logs GitHub Actions** pour détecter rapidement les erreurs de scraping ou de build.
- **Testez la chaîne complète** (scraping → Supabase → Frontend) après chaque évolution majeure.

---

## 5. Extensions et intégrations utiles
- **Supabase Auth** : pour la gestion des utilisateurs (connexion, favoris, historique…)
- **Supabase Storage** : pour héberger images, posters, etc.
- **Vercel Analytics** : pour monitorer l’utilisation de la plateforme.
- **Vercel ↔ Supabase Integration** : pour synchroniser triggers/events si besoin.

---

Pour toute évolution ou question, documentez vos choix dans ce fichier et dans le changelog du projet.
