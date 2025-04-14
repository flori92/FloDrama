# Guide d'Identité Visuelle FloDrama

## Présentation
Ce document décrit les éléments essentiels de l'identité visuelle de FloDrama, une plateforme de streaming dédiée aux dramas et films asiatiques. Il sert de référence pour maintenir une cohérence visuelle à travers toutes les interfaces de l'application.

## Palette de Couleurs

### Couleurs Principales
- **Bleu signature** : `#3b82f6` (blue-500)
- **Fuchsia accent** : `#d946ef` (fuchsia-500)
- **Dégradé signature** : `linear-gradient(to right, #3b82f6, #d946ef)`

### Couleurs de Fond
- **Fond principal** : `#121118` (noir profond)
- **Fond secondaire** : `#1A1926` (noir légèrement plus clair)
- **Fond tertiaire** : `#1a1923` (pour les cartes et éléments d'interface)

### Couleurs de Texte
- **Texte principal** : `#FFFFFF` (blanc)
- **Texte secondaire** : `#94A1B2` (gris clair)
- **Texte tertiaire** : `#6c7293` (gris bleuté)

## Typographie
- **Police principale** : `SF Pro Display`, avec fallbacks système
- **Hiérarchie** :
  - Titres : 24-32px, semi-bold/bold
  - Sous-titres : 18-20px, medium/semi-bold
  - Corps de texte : 14-16px, regular
  - Texte secondaire : 12-14px, light/regular

## Éléments Distinctifs

### Logo
- Texte "FloDrama" avec le dégradé signature bleu-fuchsia
- Utilisation de la classe CSS `.logo` avec les propriétés :
  ```css
  .logo {
    background-image: var(--color-accent-gradient);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: bold;
  }
  ```

### Boutons
- **Boutons primaires** : Fond avec dégradé signature, texte blanc, coins arrondis
- **Boutons secondaires** : Fond transparent avec bordure blanche ou grise, texte blanc
- **Boutons d'action** : Forme circulaire avec icône centrée

### Cartes et Conteneurs
- Coins légèrement arrondis (8px)
- Ombre légère pour effet de profondeur
- Effet de survol avec légère augmentation d'échelle
- Transition fluide (0.3s ease)

### Animations et Transitions
- Transitions douces pour tous les changements d'état (0.3s ease)
- Animation de pulsation pour les éléments de chargement
- Effet de fondu pour les apparitions/disparitions

## Implémentation Technique

### Variables CSS
Les variables CSS suivantes doivent être définies et utilisées dans toute l'application :

```css
:root {
  --color-background: #121118;
  --color-background-secondary: #1A1926;
  --color-accent-blue: #3b82f6;
  --color-accent-fuchsia: #d946ef;
  --color-accent-gradient: linear-gradient(to right, #3b82f6, #d946ef);
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #94A1B2;
  --transition-default: all 0.3s ease;
}
```

### Fichiers CSS Principaux
- `theme.css` : Définition des variables et styles globaux
- `index.css` : Styles spécifiques aux composants principaux

### Déploiement
Pour garantir que l'identité visuelle soit correctement appliquée lors du déploiement :

1. Les fichiers `theme.css` et `index.css` doivent être inclus dans le build
2. Le script de déploiement doit copier ces fichiers dans le répertoire approprié
3. Le HTML principal doit inclure des liens vers ces fichiers CSS

## Validation
Pour vérifier que l'identité visuelle est correctement appliquée :

1. Le dégradé signature bleu-fuchsia doit être visible sur le logo et les éléments interactifs
2. Les couleurs de fond doivent correspondre à la palette définie
3. Les transitions et animations doivent être fluides
4. La typographie doit respecter la hiérarchie définie

## Maintenance
Ce guide doit être mis à jour lorsque des modifications sont apportées à l'identité visuelle. Toute modification doit être approuvée par l'équipe de design et documentée dans ce fichier.

---

Dernière mise à jour : 31 mars 2025
