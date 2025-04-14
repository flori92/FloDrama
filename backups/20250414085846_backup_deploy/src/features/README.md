# Architecture des Fonctionnalités FloDrama

## Structure du Projet

```
features/
├── scraping/               # Scraping intelligent et agrégation de contenu
│   ├── services/          # Services de scraping et proxy
│   ├── components/        # Composants UI liés au scraping
│   ├── hooks/            # Hooks personnalisés
│   └── types/            # Types TypeScript
├── social/                # Fonctionnalités sociales et Watch Party
│   ├── services/         # Services de chat et synchronisation
│   ├── components/       # Composants UI sociaux
│   ├── hooks/           # Hooks de gestion d'état social
│   └── types/           # Types pour les features sociales
├── recommendations/       # Système de recommandations IA
│   ├── services/         # Services d'analyse et recommandation
│   ├── components/       # Composants UI de recommandation
│   ├── hooks/           # Hooks de personnalisation
│   └── types/           # Types pour le système de recommandation
├── player/               # Lecteur vidéo et streaming
│   ├── services/         # Services de lecture et adaptation
│   ├── components/       # Composants UI du lecteur
│   ├── hooks/           # Hooks de contrôle vidéo
│   └── types/           # Types pour le lecteur
└── auth/                 # Authentification et autorisation
    ├── services/         # Services d'authentification
    ├── components/       # Composants UI auth
    ├── hooks/           # Hooks de gestion auth
    └── types/           # Types pour l'auth
```

## Principes d'Architecture

1. **Modularité**
   - Chaque feature est indépendante
   - Communication via interfaces définies
   - Réutilisation maximale des composants

2. **Performance**
   - Chargement différé des features
   - Optimisation par plateforme
   - Cache intelligent

3. **Maintenabilité**
   - Documentation complète
   - Tests automatisés
   - Code type-safe

## Guide de Développement

1. **Nouveaux Composants**
   - Utiliser les hooks Lynx
   - Suivre les patterns React
   - Documenter en français

2. **Services**
   - Hériter de LynxService
   - Implémenter la gestion d'erreurs
   - Supporter le mode hors-ligne

3. **Types**
   - Définir des interfaces claires
   - Utiliser des types stricts
   - Documenter les contrats
