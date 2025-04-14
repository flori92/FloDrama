# Architecture FloDrama avec Lynx.js

## Vue d'Ensemble

FloDrama est maintenant une application cross-plateforme unifiée construite avec Lynx.js, offrant une expérience native sur Web, iOS et Android. Cette migration depuis Flutter permet une base de code unique tout en conservant les performances natives.

## Structure du Projet

```
flodrama-react-lynx/
├── src/
│   ├── features/           # Fonctionnalités principales
│   │   ├── scraping/      # Scraping intelligent
│   │   ├── social/        # Watch Party et fonctionnalités sociales
│   │   ├── recommendations/ # Système de recommandations IA
│   │   ├── player/        # Lecteur vidéo optimisé
│   │   └── auth/         # Authentification
│   ├── shared/           # Services et composants partagés
│   ├── platform/         # Code spécifique par plateforme
│   └── core/            # Noyau de l'application
```

## Fonctionnalités Principales

### 1. Scraping Intelligent
- Sources multiples (dramacool, myasiantv, etc.)
- Rotation intelligente des proxies
- Catégorisation automatique
- Cache adaptatif
- Support multi-langues

### 2. Watch Party
- Synchronisation en temps réel
- Chat intégré
- Contrôles partagés
- Invitations et notifications
- Support multi-régions

### 3. Recommandations IA
- Apprentissage automatique
- Profils utilisateurs
- Analyse des tendances
- Recommandations contextuelles
- Historique de visionnage

### 4. Lecteur Vidéo
- Support HLS/DASH
- Qualité adaptative
- Sous-titres multilingues
- Mode hors-ligne
- Contrôles personnalisés

## Migration depuis Flutter

### Avantages de Lynx.js
1. **Base de Code Unifiée**
   - Un seul code pour toutes les plateformes
   - Maintenance simplifiée
   - Déploiement unifié

2. **Performance Native**
   - Rendu optimisé par plateforme
   - Gestion efficace de la mémoire
   - Support matériel natif

3. **Développement Optimisé**
   - Hot Reload sur toutes les plateformes
   - Outils de débogage unifiés
   - Tests cross-platform

### Composants Migrés

1. **Interface Utilisateur**
   ```typescript
   // Avant (Flutter)
   class DramaCard extends StatelessWidget {
     build(BuildContext context) {
       return Container(...);
     }
   }

   // Après (Lynx)
   const DramaCard: React.FC<DramaCardProps> = (props) => {
     return <LynxContainer>...</LynxContainer>;
   };
   ```

2. **Services Backend**
   ```typescript
   // Migration des services
   class ScrapingService extends LynxService {
     // Même logique, nouvelle implémentation
   }
   ```

## Performance et Optimisation

### 1. Cache Intelligent
- Mise en cache adaptative
- Préchargement intelligent
- Gestion de la mémoire optimisée

### 2. Réseau
- Requêtes optimisées
- Gestion des erreurs robuste
- Support hors-ligne

### 3. Rendu
- Virtualisation des listes
- Chargement différé des images
- Animations optimisées

## Sécurité

1. **Protection des Données**
   - Chiffrement des données sensibles
   - Stockage sécurisé par plateforme
   - Validation des entrées

2. **Authentification**
   - Support multi-fournisseurs
   - Tokens sécurisés
   - Refresh automatique

## Tests et Qualité

### 1. Tests Automatisés
```typescript
// Tests unitaires
describe('ScrapingService', () => {
  it('extrait correctement le contenu', async () => {
    // Tests...
  });
});
```

### 2. Tests E2E
- Scénarios cross-platform
- Tests de performance
- Validation visuelle

## Déploiement

### 1. Build System
```json
{
  "scripts": {
    "build:all": "lynx-cli build --all-platforms",
    "build:web": "lynx-cli build --platform web",
    "build:ios": "lynx-cli build --platform ios",
    "build:android": "lynx-cli build --platform android"
  }
}
```

### 2. CI/CD
- Pipeline unifié
- Tests automatisés
- Déploiement par plateforme

## Guide de Développement

### 1. Conventions
- TypeScript strict
- Documentation en français
- Tests obligatoires

### 2. Workflow
- Feature branches
- Code review
- Tests automatisés

## Prochaines Étapes

1. **Optimisations**
   - Amélioration des performances
   - Réduction de la taille du bundle
   - Optimisation du cache

2. **Nouvelles Fonctionnalités**
   - Support du picture-in-picture
   - Mode multi-fenêtres
   - Téléchargements intelligents

3. **Améliorations UX**
   - Transitions fluides
   - Gestes personnalisés
   - Mode sombre amélioré
