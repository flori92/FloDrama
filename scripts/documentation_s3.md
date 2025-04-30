# Documentation de l'infrastructure S3 pour FloDrama

## Inventaire des ressources AWS

### Buckets S3 existants
| Nom du bucket | Date de création | Utilisation |
|---------------|------------------|-------------|
| flodrama-assets | 2025-04-14 | Assets statiques (logo, JS, CSS) |
| flodrama-content | 2025-04-24 | **REDONDANT** - À supprimer |
| flodrama-content-1745484469 | 2025-04-24 | **REDONDANT** - À supprimer |
| flodrama-deployment | 2025-04-14 | Déploiements d'applications |
| flodrama-exported-data | 2025-04-20 | Données exportées |
| flodrama-images | 2025-04-24 | **REDONDANT** - À supprimer |
| images.flodrama.com | 2025-04-17 | Images (posters, backdrops) |
| serverless-framework-deployments-eu-west-3-64b74835-e59d | 2025-03-17 | Déploiements Serverless Framework |

### Distributions CloudFront
| Domaine | ID | Origine | État |
|---------|----|---------|----- |
| d11nnqvjfooahr.cloudfront.net | E275AW2L6UVK2A | images.flodrama.com.s3.amazonaws.com | Activé |
| d1323ouxr1qbdp.cloudfront.net | E5XC74WR62W9Z | flodrama-prod.s3.amazonaws.com | Activé |
| d18lg9vvv7unw2.cloudfront.net | EBE40VWPLFMPH | flodrama-prod.s3.amazonaws.com | Activé |
| d1k0hdg1q5wjpi.cloudfront.net | EIT8NA31RVVWK | flodrama-prod.s3.amazonaws.com | Activé |
| d28f6c3hzvqkgp.cloudfront.net | E2Q1IQGU47SLGM | flodrama-app-bucket.s3.us-east-1.amazonaws.com | Activé |
| d3f5h9d39jukrl.cloudfront.net | E1IG2U5KWWN11Y | flodrama-prod-20250402173726.s3-website-us-east-1.amazonaws.com | Activé |
| dyba0cgavum1j.cloudfront.net | E2TIZZTTLG9R3U | flodrama-video-cache.s3.amazonaws.com | Activé |

### API Gateway
| ID | Nom |
|----|-----|
| 7la2pq33ej | FloDrama-API-Production |

## Structure recommandée

Pour éviter la confusion et optimiser l'infrastructure, nous recommandons de conserver uniquement les buckets suivants :

1. **flodrama-assets** : Pour les assets statiques (logo, JS, CSS)
2. **images.flodrama.com** : Pour les images (posters, backdrops)
3. **flodrama-deployment** : Pour les déploiements d'applications
4. **flodrama-exported-data** : Pour les données exportées

## Scripts de gestion

Plusieurs scripts ont été créés pour faciliter la gestion de l'infrastructure S3 :

1. **inventaire_aws.sh** : Liste toutes les ressources AWS existantes
2. **nettoyer_s3.sh** : Supprime les buckets redondants
3. **verifier_s3.sh** : Vérifie et configure les buckets existants
4. **uploader_contenu.sh** : Facilite l'upload de contenu vers les buckets

## Utilisation des buckets dans l'application

Dans le fichier `contentService.ts`, les URLs des images doivent pointer vers la distribution CloudFront associée au bucket `images.flodrama.com` :

```typescript
const CLOUDFRONT_DOMAIN = 'd11nnqvjfooahr.cloudfront.net';
```

## Recommandations

1. Exécuter le script `nettoyer_s3.sh` pour supprimer les buckets redondants
2. Utiliser le script `inventaire_aws.sh` régulièrement pour surveiller les ressources AWS
3. Configurer correctement les URLs dans l'application pour pointer vers les bonnes ressources
4. Documenter toute modification de l'infrastructure pour éviter la confusion à l'avenir
