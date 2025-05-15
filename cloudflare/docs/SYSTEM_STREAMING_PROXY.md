# Documentation du Système de Proxy de Streaming FloDrama

## Vue d'ensemble

Le système de proxy de streaming de FloDrama permet la diffusion de contenu vidéo sans stockage direct des fichiers médias. Cette approche respecte les droits d'auteur tout en offrant une expérience utilisateur fluide et réactive.

## Architecture

![Architecture du Système de Proxy](https://mermaid.ink/img/pako:eNqNksFOwzAMhl_FyoETSO0GBySEQOLECcGhXLzGWxYlaZW4iDHtJXgZHou4ZVPLNgYckth_vj-243tQVmPQUDvsFRt6G9GiCWgF9oaqk1xMVNYLUfbGZUxF8Ehxr4S7wIRGtMaJ5MnYqBzGCEfqvAc_iI-VwqEVlSeBSXoD1m6lXYONMpUVdS4aG_bWL6FzdCu0E4YnOD1JUSLj3mNdpNCIWVPjU3Y9wLvjCc4Dcp8DblM46MZiCvfkpRfr4jXUHrM_DnnhfFUoNx4rYFIXkM6CUQlE5kkbZbHJA5_mWWt8sXgJNvvKJzHqvBPkZDw2YnQ9IceX5V4Mq1o37CzjPJI5gXE6k57dM2Gvg8PEd_DGh4_HQxQB0cUCRYuKYKuaPswmj_MLzq6HL7dlWpRlWa5KKMwSXA9NCbP52XRWwiIUMLdEpCo0J9NLqNnpHzxbQ02ehFtomOFbULRD-_sATW83Lsbe-A8_iQJ-AZs6n2w)

### Composants principaux

1. **Client Frontend** : Application React avec le composant `StreamingPlayer`
2. **Worker Media Gateway** : Service Cloudflare Workers pour la gestion des requêtes proxy
3. **Base de données D1** : Stockage des références de streaming et métadonnées
4. **Module d'extraction** : Système de scraping pour récupérer les URLs de streaming

## Flux de données

1. L'utilisateur demande à visionner un contenu via l'interface de FloDrama
2. Le composant `StreamingPlayer` envoie une requête au Worker Media Gateway
3. Le Worker vérifie si une référence de streaming existe et est valide
   - Si oui, il renvoie l'URL de streaming au client
   - Si non, il déclenche l'extraction d'une nouvelle URL
4. L'extracteur récupère l'URL et la stocke dans la base D1
5. Le lecteur vidéo charge le contenu directement depuis la source

## Gestion de la sécurité

- Authentification et autorisation pour les requêtes au Worker
- Limitation de débit pour éviter les abus (rate limiting)
- Filtrage géographique pour respecter les restrictions régionales
- Protection contre le scraping malveillant

## Worker Media Gateway

### Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/stream/:contentId` | GET | Récupère les informations de streaming pour un contenu |
| `/refresh-stream/:contentId` | GET | Force le rafraîchissement d'une URL expirée |
| `/metadata/:contentId` | GET | Récupère les métadonnées d'un contenu |

### Schéma de la réponse

```json
{
  "status": "success",
  "streaming_url": "https://source.example.com/video.mp4",
  "quality": "720p",
  "source": "dramacool",
  "expires_at": "2025-05-12T15:21:31+02:00",
  "subtitles": [
    {
      "language": "fr",
      "url": "https://source.example.com/subtitles/fr.vtt"
    }
  ],
  "referrer_policy": "no-referrer"
}
```

## Base de données D1

### Schema

```sql
CREATE TABLE streaming_references (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  streaming_url TEXT NOT NULL,
  source TEXT NOT NULL,
  quality TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(content_id, source)
);

CREATE TABLE content_episodes (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  episode_number INTEGER NOT NULL,
  season_number INTEGER DEFAULT 1,
  title TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  UNIQUE(content_id, season_number, episode_number)
);
```

## Module d'extraction des URLs

Le module `streaming-extractor.js` fournit les fonctionnalités suivantes :

- Détection automatique de la source basée sur l'URL
- Extraction du contenu des iframes pour obtenir les URLs de streaming
- Contournement des protections anti-bot (Cloudflare, etc.)
- Détection de la qualité vidéo et de la date d'expiration
- Gestion des redirections et des URL encodées

## Composant StreamingPlayer

Le composant React `StreamingPlayer.jsx` offre :

- Gestion complète du cycle de vie de lecture
- Support des sous-titres
- Contrôles personnalisés (lecture, pause, volume, plein écran)
- Gestion des erreurs et rafraîchissement automatique des URLs expirées
- Interface utilisateur responsive et moderne

## Maintenance et surveillance

### Surveillance des sources

Un système de monitoring vérifie régulièrement la disponibilité des sources :

```js
// Exemple de vérification de santé des sources
async function checkSourceHealth(source) {
  try {
    const testUrl = getTestUrlForSource(source);
    const result = await testExtraction(testUrl);
    return {
      source,
      status: result ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      source,
      status: 'down',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
```

### Tableau de bord Admin

Un tableau de bord d'administration permet de surveiller les métriques clés :

- Disponibilité des sources de streaming
- Taux de réussite des extractions
- Temps moyen d'extraction par source
- Nombre de requêtes par minute
- Nombre d'URLs expirées par jour

## Résolution des problèmes courants

| Problème | Cause possible | Solution |
|----------|----------------|----------|
| URL expirée | Limite de temps dépassée | Utiliser le endpoint `/refresh-stream/:contentId` |
| Source non disponible | Serveur source en panne | Basculer vers une source alternative |
| Erreur 403 | Protection anti-bot | Mettre à jour le module de contournement Cloudflare |
| Erreur 429 | Trop de requêtes | Implémenter un système de file d'attente |

## Prochaines améliorations

1. **Cache intelligent** : Mise en cache adaptative basée sur la popularité des contenus
2. **Multi-sources** : Support de sources multiples pour chaque contenu
3. **Fallback automatique** : Basculement automatique vers d'autres sources en cas d'échec
4. **Intégration WebRTC** : Support du P2P pour réduire la charge sur les sources

---

Document créé le 11 mai 2025  
Dernière mise à jour : 11 mai 2025
