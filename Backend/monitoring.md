# Monitoring & Alerting Render FloDrama

## Logs
- Utilise la section "Logs" du dashboard Render pour surveiller les erreurs et accès API.
- Ajoute des logs explicites dans les endpoints sensibles (scraping, erreurs S3/MongoDB).

## Healthcheck
- Endpoint `/api/health` prêt pour le monitoring automatisé (UptimeRobot, BetterUptime, etc.)
- Exemple URL à monitorer : https://flodrama-backend.onrender.com/api/health

## Alerting
- Configure UptimeRobot ou BetterUptime pour surveiller l’API Render et recevoir des alertes en cas d’indisponibilité.

## Améliorations futures
- Ajout d’un endpoint `/api/metrics` (statistiques d’usage, logs custom)
- Intégration Sentry ou LogRocket pour le suivi des erreurs frontend/backend
