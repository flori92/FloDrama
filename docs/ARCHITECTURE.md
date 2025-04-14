# Architecture FloDrama - Approche Hybride Lynx/React

## Philosophie

FloDrama adopte une approche "Lynx-first" avec React comme support complémentaire. Cette stratégie permet de :
- Maintenir la compatibilité multiplateforme via Lynx
- Bénéficier de l'écosystème React quand nécessaire
- Faciliter la migration progressive vers Lynx

## Structure du Projet

### 1. Composants Hybrides

Tous les composants suivent une architecture hybride :
```typescript
src/
  ├── adapters/
  │   ├── hybrid-component.tsx     // Composant de base hybride
  │   └── component-registry.ts    // Registre des composants disponibles
  ├── composants/
  │   ├── base/                    // Composants de base hybrides
  │   ├── lecteur/                 // Composants vidéo
  │   └── carousels/              // Composants carousel
  └── hooks/
      └── hybrid-hooks.ts         // Hooks hybrides Lynx/React
```

### 2. Stratégie d'Implémentation

#### Priorité des Frameworks
1. **Lynx First** : Toujours tenter d'utiliser les composants Lynx en premier
2. **React Fallback** : Utiliser React uniquement quand :
   - Un composant Lynx n'est pas disponible
   - Une fonctionnalité spécifique est nécessaire
   - Une librairie React apporte une valeur ajoutée significative

#### Exemples de Cas d'Utilisation
- **Lecteur Vidéo** : Lynx pour le lecteur de base, React-Player pour les fonctionnalités avancées
- **Carousel** : Lynx pour l'interface, React-Slick pour les animations complexes
- **Modales** : Lynx pour les dialogues simples, React-Modal pour les cas complexes

### 3. Gestion des Dépendances

```json
{
  "dependencies": {
    "@lynx/core": "^1.0.0",
    "@lynx/react": "^1.0.0",
    "react": "^18.0.0",
    // Dépendances React spécifiques selon les besoins
  }
}
```

## Bonnes Pratiques

### 1. Développement de Composants
- Toujours créer des composants hybrides via `createHybridComponent`
- Documenter clairement les raisons du choix React vs Lynx
- Maintenir une interface cohérente quel que soit le framework utilisé

### 2. Tests
- Tester les composants dans leurs deux modes (Lynx et React)
- Utiliser les utilitaires de test appropriés selon le mode
- Vérifier la cohérence du comportement entre les deux modes

### 3. Performance
- Charger les dépendances React de manière dynamique
- Optimiser le tree-shaking pour minimiser la taille du bundle
- Monitorer les performances des deux implémentations

## Migration Future

Cette architecture facilite la migration future vers Lynx :
1. Identifier les composants utilisant React
2. Attendre la disponibilité des fonctionnalités dans Lynx
3. Migrer progressivement vers l'implémentation Lynx
4. Supprimer les fallbacks React devenus inutiles

## Maintenance

### 1. Revue de Code
- Vérifier la pertinence de l'utilisation de React
- S'assurer que les composants restent maintenables
- Documenter les choix techniques

### 2. Mises à Jour
- Suivre les évolutions de Lynx
- Mettre à jour les dépendances React
- Migrer vers Lynx dès que possible
