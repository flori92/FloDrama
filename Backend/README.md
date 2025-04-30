# FloDrama Backend (Render Architecture)

## Présentation
Backend Node.js/Express pour la plateforme FloDrama. Déployé sur Render, il sert d’API REST, gère le scraping, et stocke les contenus sur S3/MongoDB Atlas.

---

## Fonctionnalités principales
- **API REST** :
  - `/api/content/:category` : retourne les contenus par catégorie (MongoDB → S3 fallback)
  - `/api/carousels` : retourne les carrousels (MongoDB → S3 fallback)
  - `/api/health` : healthcheck
  - `/api/scrape` : déclenche le scraping (sécurisé)
- **Scraping automatisé** : worker Render (`src/worker.js`)
- **Stockage** : S3 pour les fichiers, MongoDB Atlas pour les métadonnées
- **CORS** : autorise Surge.sh et localhost

---

## Déploiement Render
1. **Variables d’environnement à configurer** (voir `.env.example`) :
   - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET`
   - `MONGODB_URI`
   - `SCRAPING_SECRET` (pour sécuriser l’endpoint scraping)
2. **Services Render** :
   - Service Web (API) : `src/index.js`
   - Background Worker (scraping) : `src/worker.js`
3. **CI/CD** :
   - Ajoute la clé API Render dans les secrets GitHub (`RENDER_API_KEY`)
   - Le workflow `.github/workflows/deploy_render.yml` déploie automatiquement à chaque push sur `main`

---

## Lancement local
```bash
npm install
cp .env.example .env # puis complète les variables
npm start # API sur http://localhost:3000
npm run worker # pour lancer le scraping manuellement
```

---

## Sécurité
- **Ne jamais exposer les clés privées**
- **SCRAPING_SECRET** obligatoire pour déclencher `/api/scrape`

---

## Documentation continue
- Voir le changelog et le journal d’architecture pour l’historique des choix techniques.
- Pour toute modification majeure, mettre à jour ce README et les scripts associés.
