# Gestion des Ressources AWS Lambda pour FloDrama

Ce document décrit les outils et procédures pour gérer efficacement les ressources AWS Lambda utilisées par FloDrama.

## 📋 Scripts de Gestion

FloDrama dispose de plusieurs scripts pour faciliter la gestion des ressources AWS Lambda :

### 1. Listage des Ressources

Le script `aws-lambda-list-resources.sh` permet de lister toutes les ressources Lambda associées au projet :

```bash
./scripts/aws-lambda-list-resources.sh [options]
```

Options disponibles :
- `--region REGION` : Région AWS à utiliser (défaut: us-east-1)
- `--prefix PREFIX` : Préfixe pour filtrer les ressources (défaut: FloDrama)
- `--output FORMAT` : Format de sortie: table, json, text (défaut: table)
- `--type TYPE` : Type de ressource à lister: functions, layers, logs, all (défaut: all)

Exemple :
```bash
./scripts/aws-lambda-list-resources.sh --region eu-west-3 --prefix Prod
```

### 2. Nettoyage des Ressources Inutilisées

Le script `aws-lambda-cleanup.sh` analyse et nettoie les ressources Lambda inutilisées :

```bash
./scripts/aws-lambda-cleanup.sh
```

Ce script interactif vous guidera pour :
- Identifier les fonctions Lambda inutilisées
- Repérer les versions obsolètes
- Nettoyer les logs CloudWatch
- Optimiser les coûts AWS

### 3. Suppression Sélective des Ressources

Le script `aws-lambda-delete-resources.sh` permet de supprimer de manière sélective les ressources Lambda :

```bash
./scripts/aws-lambda-delete-resources.sh [options]
```

Options disponibles :
- `--region REGION` : Région AWS à utiliser (défaut: us-east-1)
- `--prefix PREFIX` : Préfixe pour filtrer les ressources (défaut: FloDrama)
- `--days DAYS` : Nombre de jours d'inactivité (défaut: 30)
- `--force` : Supprimer sans confirmation (défaut: false)
- `--execute` : Exécuter réellement les suppressions (défaut: dry-run)
- `--type TYPE` : Type de ressource à supprimer: functions, versions, layers, logs, all (défaut: all)

Exemple (simulation) :
```bash
./scripts/aws-lambda-delete-resources.sh --type versions
```

Exemple (exécution réelle) :
```bash
./scripts/aws-lambda-delete-resources.sh --execute --type versions
```

### 4. Surveillance des Performances

Le script `lambda-monitoring.sh` surveille les performances des fonctions Lambda :

```bash
./scripts/lambda-monitoring.sh
```

Ce script fournit des informations sur :
- Nombre d'invocations
- Erreurs
- Durée d'exécution
- Utilisation de la mémoire
- Limitations
- Recommandations d'optimisation

## 🔍 Bonnes Pratiques

### Nettoyage Régulier

Il est recommandé d'exécuter les scripts de nettoyage régulièrement :
- Hebdomadaire : `aws-lambda-list-resources.sh` pour surveiller la croissance des ressources
- Mensuel : `aws-lambda-cleanup.sh` pour nettoyer les ressources inutilisées
- Trimestriel : `aws-lambda-delete-resources.sh --execute --type all` pour un nettoyage complet

### Optimisation des Coûts

Pour optimiser les coûts AWS Lambda :
1. Supprimez les fonctions inutilisées
2. Conservez uniquement les 2-3 dernières versions de chaque fonction
3. Configurez une politique de rétention des logs (30 jours recommandé)
4. Ajustez la mémoire allouée aux fonctions en fonction de leur utilisation réelle

### Sécurité

- Vérifiez régulièrement les politiques IAM associées aux fonctions Lambda
- Utilisez des secrets AWS pour stocker les informations sensibles
- Limitez les permissions au minimum nécessaire

## 📊 Surveillance et Alertes

Pour une surveillance continue, vous pouvez configurer une tâche cron qui exécute `lambda-monitoring.sh` quotidiennement :

```bash
0 9 * * * cd /chemin/vers/FloDrama && ./scripts/lambda-monitoring.sh > /var/log/lambda-monitoring.log 2>&1
```

## 🔧 Dépannage

### Problèmes Courants

1. **Erreur "The security token included in the request is invalid"** :
   - Vérifiez que vos identifiants AWS sont à jour
   - Exécutez `aws configure` pour reconfigurer vos identifiants

2. **Fonctions Lambda qui échouent** :
   - Vérifiez les logs CloudWatch pour identifier la cause
   - Utilisez `lambda-monitoring.sh` pour obtenir des recommandations

3. **Coûts AWS élevés** :
   - Exécutez `aws-lambda-cleanup.sh` pour identifier les ressources coûteuses
   - Supprimez les anciennes versions avec `aws-lambda-delete-resources.sh --type versions --execute`

## 📝 Notes Importantes

- Toujours exécuter les scripts en mode simulation (`--dry-run` ou sans `--execute`) avant de supprimer des ressources
- Conserver au moins 2 versions récentes de chaque fonction Lambda pour permettre un rollback rapide
- Documenter toutes les modifications apportées aux ressources AWS
