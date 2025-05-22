# API Worker Cloudflare pour FloDrama

Ce dossier contient le Worker Cloudflare qui sert de pont entre le frontend FloDrama et les données stockées dans Cloudflare KV.

## Fonctionnalités

- Exposition d'une API REST pour accéder aux données
- Gestion automatique des CORS
- Endpoints pour accéder aux différentes catégories de contenu
- Monitoring de santé de l'API

## Endpoints disponibles

| Endpoint | Description |
|----------|-------------|
| `/health` | Vérifier l'état de l'API |
| `/keys` | Lister toutes les clés disponibles dans KV |
| `/data/{key}` | Récupérer les données pour une clé spécifique |
| `/all` | Récupérer toutes les données (équivalent à `/data/global`) |
| `/drama` | Récupérer les données des dramas |
| `/anime` | Récupérer les données des animes |
| `/film` | Récupérer les données des films |
| `/bollywood` | Récupérer les données de Bollywood |

## Déploiement

Pour déployer le Worker, utilisez la commande suivante :

```bash
cd /Users/floriace/FLO_DRAMA/FloDrama/cloudflare/workers
npx wrangler deploy
```

## Configuration

La configuration du Worker se trouve dans le fichier `wrangler.toml`. Assurez-vous que les identifiants suivants sont corrects :

- `account_id` : ID de votre compte Cloudflare
- `kv_namespaces.id` : ID du namespace KV contenant les données
- `routes.zone_id` : ID de la zone Cloudflare pour FloDrama

## Intégration avec le frontend

Pour intégrer ce Worker avec le frontend FloDrama, vous devez modifier les appels API dans le code frontend pour pointer vers les endpoints de ce Worker.

Exemple d'utilisation dans le frontend :

```javascript
// Récupérer les données des dramas
fetch('https://api.flodrama.com/drama')
  .then(response => response.json())
  .then(data => {
    console.log('Données des dramas:', data);
    // Traiter les données...
  })
  .catch(error => {
    console.error('Erreur lors de la récupération des données:', error);
  });
```
