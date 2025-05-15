# Configuration DNS pour FloDrama

## Enregistrements DNS à configurer dans Cloudflare

| Type | Nom | Contenu | Proxy | TTL |
|------|-----|---------|-------|-----|
| CNAME | flodrama.com | a924a863.flodrama-frontend.pages.dev | ✅ | Auto |
| CNAME | www | a924a863.flodrama-frontend.pages.dev | ✅ | Auto |
| CNAME | api-media | flodrama-api-worker.florifavi.workers.dev | ✅ | Auto |
| CNAME | images | flodrama-images.imagedelivery.net | ✅ | Auto |

## Variables d'environnement Workers

### Worker Media Gateway
```
CLOUDFLARE_ACCOUNT_ID=42fc982266a2c31b942593b18097e4b3
CLOUDFLARE_API_TOKEN=votre_token_secret_ici
CORS_ORIGINS=https://flodrama.com,https://www.flodrama.com
STREAMING_EXPIRY_HOURS=24
```

## Page Rules

| URL Pattern | Action |
|-------------|--------|
| flodrama.com/* | Cache Level: Cache Everything |
| api-media.flodrama.com/* | Cache Level: Bypass |

## Firewall Rules

| Nom | Description | Action |
|-----|-------------|--------|
| Limiter API Media | Limite à 100 requêtes par minute | Rate Limit |
| Bloquer Pays Non Autorisés | Bloquer les pays hors zone autorisée | Block |
