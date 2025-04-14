# Migration vers les services unifiés FloDrama

Ce document explique comment migrer du code utilisant les anciens services vers les nouveaux services unifiés.

## Services unifiés

- `unifiedScrapingService` : Remplace ScrapingService, SmartScrapingService, AdaptiveScraperService et videoScraper
- `unifiedImageService` : Centralise toutes les fonctionnalités de gestion d'images

## Comment migrer

### Ancien code

```javascript
import ScrapingService from './services/ScrapingService';
// ou
import SmartScrapingService from './services/SmartScrapingService';
// ou
import AdaptiveScraperService from './services/AdaptiveScraperService';
// ou
import videoScraper from './services/videoScraper';

// Utilisation
const metadata = await ScrapingService.getContentMetadata(id);
const videoLinks = await videoScraper.getVideoLinks(id);
```

### Nouveau code

```javascript
import { unifiedScrapingService } from './services';

// Utilisation
const metadata = await unifiedScrapingService.getContentMetadata(id);
const videoLinks = await unifiedScrapingService.getVideoLinks(id);
```

## Identité visuelle FloDrama

Assurez-vous de respecter l'identité visuelle de FloDrama dans tous les composants:

- Bleu signature : #3b82f6
- Fuchsia accent : #d946ef
- Dégradé signature : linear-gradient(to right, #3b82f6, #d946ef)
- Fond principal : #121118 (noir profond)
- Fond secondaire : #1A1926
- Police principale : SF Pro Display
- Coins arrondis : 8px
- Transitions : 0.3s ease
