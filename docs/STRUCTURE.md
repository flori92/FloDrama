# Structure du Projet FloDrama

## Organisation Générale
```
flodrama-react-lynx/
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # Composants réutilisables
│   │   │   ├── layout/          # Composants de mise en page
│   │   │   ├── player/          # Lecteur vidéo et contrôles
│   │   │   ├── navigation/      # Navigation et menus
│   │   │   └── features/        # Composants spécifiques aux fonctionnalités
│   │   ├── hooks/              # Hooks personnalisés
│   │   ├── services/           # Services (API, authentification, etc.)
│   │   ├── store/              # Gestion d'état (Context, Redux, etc.)
│   │   ├── styles/             # Styles globaux et thèmes
│   │   ├── utils/              # Utilitaires et helpers
│   │   ├── types/              # Types TypeScript
│   │   └── adapters/           # Adaptateurs Lynx/React
│   ├── public/                 # Assets statiques
│   ├── tests/                  # Tests unitaires et d'intégration
│   └── config/                 # Configuration du Frontend
├── Backend/
│   ├── src/
│   │   ├── controllers/        # Contrôleurs REST
│   │   ├── models/             # Modèles de données
│   │   ├── services/           # Services métier
│   │   ├── middleware/         # Middleware personnalisé
│   │   └── utils/              # Utilitaires
│   ├── config/                 # Configuration du Backend
│   └── tests/                  # Tests Backend
└── docs/                       # Documentation du projet
```

## Migration des Composants React Existants

### Composants à Migrer en Priorité
1. **Lecteur Vidéo**
   - Contrôles personnalisés
   - Gestion des sous-titres
   - Support multi-format

2. **Navigation**
   - Menu principal
   - Navigation par catégories
   - Recherche intégrée

3. **Système de Recommandation**
   - Carrousel dynamique
   - Suggestions personnalisées
   - Historique de visionnage

### Adaptations Nécessaires

#### 1. Components React → Lynx/React
- Utilisation prioritaire des composants Lynx
- Fallback vers React quand nécessaire
- Adaptation des props et événements

#### 2. Gestion d'État
- Migration vers le système de state Lynx
- Conservation du Context React si nécessaire
- Optimisation des performances

#### 3. Styles et Thèmes
- Adaptation au système de style Lynx
- Support des thèmes sombre/clair
- Variables CSS globales

## Standards de Développement

### Frontend
- TypeScript strict
- Tests unitaires obligatoires
- Documentation des composants
- Performance monitoring

### Backend
- API RESTful
- Documentation OpenAPI/Swagger
- Tests d'intégration
- Logging centralisé

## Workflow de Développement
1. Développement local
2. Tests automatisés
3. Review de code
4. Déploiement staging
5. Tests QA
6. Déploiement production
