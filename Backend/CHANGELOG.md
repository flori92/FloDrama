# Changelog FloDrama Backend

## [2025-04-26]
### ✨ FEAT : Architecture Render complète
- Création de la structure backend Express (API REST, worker scraping)
- Intégration S3 (lecture/écriture contenus, carrousels)
- Intégration MongoDB Atlas (contenus, carrousels)
- Sécurisation endpoint scraping
- Mise en place du workflow CI/CD GitHub Actions pour Render
- Documentation initiale (README, .env.example)

### ♻️ REFACTOR : Nettoyage package.json
- Suppression des dépendances inutiles (TypeScript, superflu pour backend JS)
- Scripts adaptés (start, worker, dev)

---

## Historique antérieur
- Voir les README_API.md et README_SCRAPING.md pour l’ancienne architecture AWS/Lambda
