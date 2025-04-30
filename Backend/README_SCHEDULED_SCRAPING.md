# Configuration de l'exécution régulière du scraping FloDrama

Ce document explique comment configurer et gérer l'exécution régulière du système de scraping FloDrama sur AWS Lambda.

## Architecture du système

Le système de scraping FloDrama utilise les composants AWS suivants :

- **AWS Lambda** : Exécute le code de scraping
- **Amazon EventBridge** : Déclenche la fonction Lambda à intervalles réguliers
- **Amazon S3** : Stocke les fichiers média et les résultats du scraping
- **Amazon CloudWatch** : Surveille l'exécution et enregistre les logs

## Prérequis

- Compte AWS avec les autorisations nécessaires
- AWS CLI configuré avec le profil `flodrama-scraping`
- Python 3.8+ avec boto3 installé

## Configuration de l'exécution régulière

### 1. Utilisation du script automatique

Le script `configure_scheduled_scraping.py` permet de configurer automatiquement l'exécution régulière :

```bash
cd /Users/floriace/FLO_DRAMA/FloDrama/Backend
python3 configure_scheduled_scraping.py
```

Le script vous proposera plusieurs options de planification :
- Toutes les heures
- Toutes les 3 heures
- Toutes les 6 heures (recommandé)
- Toutes les 12 heures
- Une fois par jour
- À heures fixes (00:00, 06:00, 12:00, 18:00)

### 2. Configuration manuelle via la console AWS

Si vous préférez configurer manuellement l'exécution régulière :

1. Accédez à la console AWS EventBridge : https://console.aws.amazon.com/events
2. Créez une nouvelle règle :
   - Nom : `FloDrama-Scraping-Schedule`
   - Description : `Règle pour déclencher le scraping FloDrama à intervalles réguliers`
   - Type de règle : `Règle avec un calendrier`
   - Modèle de calendrier : `Expression cron ou rate`
   - Expression : `rate(6 hours)` (pour exécuter toutes les 6 heures)
3. Ajoutez une cible :
   - Type de cible : `Service AWS` > `Lambda`
   - Fonction : `flodrama-scraper`
   - Configurer l'entrée : `Constant (JSON text)`
   - JSON :
     ```json
     {
       "source": "scheduled",
       "category": "all",
       "action": "scrape_all"
     }
     ```

## Surveillance et maintenance

### Surveillance des exécutions

Pour surveiller les exécutions du scraping :

1. Accédez à CloudWatch Logs : https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups
2. Recherchez le groupe de logs `/aws/lambda/flodrama-scraper`
3. Consultez les logs pour vérifier le bon fonctionnement du scraping

### Modification de la planification

Pour modifier la fréquence d'exécution :

1. Exécutez à nouveau le script `configure_scheduled_scraping.py` et choisissez une nouvelle option
2. Ou modifiez manuellement la règle EventBridge dans la console AWS

### Désactivation temporaire

Pour désactiver temporairement l'exécution régulière :

1. Accédez à la console AWS EventBridge
2. Sélectionnez la règle `FloDrama-Scraping-Schedule`
3. Cliquez sur `Désactiver`

## Dépannage

### Problèmes courants

1. **La fonction Lambda échoue** :
   - Vérifiez les logs CloudWatch pour identifier l'erreur
   - Assurez-vous que les sources de scraping sont toujours accessibles
   - Vérifiez que les identifiants AWS sont valides

2. **La règle EventBridge ne déclenche pas la fonction** :
   - Vérifiez que la règle est activée
   - Vérifiez que les permissions sont correctement configurées
   - Testez la règle manuellement via la console AWS

3. **Dépassement du timeout Lambda** :
   - Augmentez la valeur du timeout dans la configuration de la fonction Lambda
   - Optimisez le code de scraping pour réduire le temps d'exécution

## Ressources utiles

- [Documentation AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
- [Documentation Amazon EventBridge](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-what-is.html)
- [Expressions cron et rate pour EventBridge](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-create-rule-schedule.html)
