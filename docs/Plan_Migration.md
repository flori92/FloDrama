# Plan de migration de l'infrastructure FloDrama

## Contexte actuel

FloDrama utilise actuellement plusieurs services Cloudflare avec une architecture distribuée :
- Plusieurs Workers pour différentes fonctionnalités (API, authentification)
- Multiples URL et points d'entrée
- Configuration dispersée dans différents fichiers

## Objectifs

1. **Simplification de l'architecture**
2. **Réduction des coûts d'infrastructure**
3. **Amélioration de la maintenabilité**
4. **Standardisation des pratiques de développement**

## Plan d'action

### Phase 1 : Unification des configurations (Immédiat)

1. **Centraliser les URL des API**
   - Standardiser sur `flodrama-api-prod.florifavi.workers.dev` comme API principale
   - Rediriger toutes les références dans le code frontend

2. **Créer un fichier de configuration unique**
   - Centraliser les variables d'environnement
   - Documenter chaque variable et son utilisation

3. **Nettoyer le code existant**
   - Supprimer les références aux anciennes URLs
   - Éliminer le code redondant

### Phase 2 : Migration des services (Court terme - 2 semaines)

1. **Migrer le service d'authentification**
   - Transférer les fonctionnalités de `flodrama-backend.florifavi.workers.dev` vers l'API principale
   - Maintenir les deux services actifs pendant la transition
   - Rediriger progressivement le trafic vers le nouveau service

2. **Standardiser les endpoints API**
   - Adopter un format `/api/[ressource]/[action]`
   - Documenter chaque endpoint avec son comportement attendu

3. **Mettre à jour la documentation**
   - Créer une documentation OpenAPI pour tous les endpoints
   - Documenter les flux d'authentification

### Phase 3 : Décommissionnement (Moyen terme - 1 mois)

1. **Décommissionner les services obsolètes**
   - Désactiver les anciens Workers une fois la migration complète
   - Nettoyer les ressources inutilisées

2. **Mettre en place une surveillance**
   - Configurer des alertes pour les erreurs
   - Mettre en place des métriques de performance

## Artefacts à produire

1. **Documentation technique**
   - Architecture cible détaillée
   - Liste complète des endpoints API
   - Diagrammes de flux pour l'authentification

2. **Scripts de migration**
   - Scripts pour transférer les données si nécessaire
   - Tests de validation pour chaque service migré

## Risques et mitigation

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Interruption de service | Élevé | Faible | Maintenir les services en parallèle pendant la migration |
| Perte de données | Élevé | Très faible | Sauvegarder toutes les données avant migration |
| Problèmes de performance | Moyen | Moyen | Tests de charge avant mise en production |
| Résistance au changement | Faible | Faible | Documentation claire et communication avec l'équipe |

## Calendrier prévisionnel

- **Semaine 1** : Configuration et préparation
- **Semaine 2-3** : Migration progressive des services
- **Semaine 4** : Tests et validation
- **Semaine 5** : Décommissionnement des anciens services
- **Semaine 6** : Documentation finale et formation
