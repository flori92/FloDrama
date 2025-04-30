# Journal d’architecture FloDrama Backend

## Choix techniques majeurs

### 1. Migration AWS → Render
- Abandon du couple Lambda/API Gateway pour une API Express déployée sur Render (simplicité, debug, contrôle CORS, CI/CD facile)
- Utilisation de Render pour héberger à la fois l’API REST et un worker scraping autonome

### 2. Stockage externe
- S3 pour les fichiers volumineux (JSON, images)
- MongoDB Atlas pour les métadonnées et requêtes structurées
- Jamais de stockage persistant sur Render (disque éphémère)

### 3. Sécurité
- Secrets gérés uniquement via GitHub et Render (jamais dans le code)
- Endpoint `/api/scrape` protégé par un header secret
- CORS strict (Surge.sh + localhost)

### 4. CI/CD
- Déploiement automatisé via GitHub Actions et clé API Render
- Workflow `.github/workflows/deploy_render.yml`

### 5. Documentation continue
- README, CHANGELOG, ARCHITECTURE.md systématiquement mis à jour

---

## Alternatives considérées
- AWS Lambda/API Gateway (complexité, CORS difficile, logs éclatés)
- Railway, Fly.io, CapRover, Dokku (moins adaptés au workflow CI/CD GitHub natif, quotas ou limitations)

---

## Décisions futures à documenter
- Extension du scraping (nouvelles sources, worker dédié)
- Monitoring avancé (logs Render, alerting)
- Sécurisation renforcée (auth, rate limiting)
- Optimisation des coûts (usage S3, Render, MongoDB Atlas)
