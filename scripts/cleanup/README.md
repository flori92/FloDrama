# Scripts de Nettoyage FloDrama

Ce dossier contient des scripts pour nettoyer et optimiser l'infrastructure FloDrama.

## 📝 Modifications Récentes (21/05/2024)

- **Suppression de la base de données inutilisée** : La base `flodrama-database` a été supprimée car elle était vide et non utilisée.
- **Mise à jour de la documentation** : Les schémas et la documentation ont été mis à jour pour refléter l'état actuel de l'infrastructure.
- **Optimisation des scripts** : Les scripts de nettoyage ont été mis à jour pour une meilleure fiabilité.

## 🛠 Scripts Disponibles

### 1. Fusion des Bases de Données (`merge-databases.js`)

Ce script permet de fusionner les bases de données redondantes. Il a été utilisé pour confirmer que la base `flodrama-database` était vide et pouvait être supprimée en toute sécurité.

**Utilisation :**
```bash
# Exécuter le script de fusion via npm
npm run cleanup:databases

# Ou exécuter directement avec Node.js
node scripts/cleanup/merge-databases.js
```

**Fonctionnalités :**
- Analyse les bases de données existantes
- Vérifie les doublons
- Fusionne les données si nécessaire
- Génère un rapport de fusion

---

### 2. Nettoyage des Espaces de Noms KV (`cleanup-kv.js`)

Ce script nettoie les espaces de noms KV obsolètes ou inutilisés.

**Utilisation :**
```bash
# Exécuter le script de nettoyage KV via npm
npm run cleanup:kv

# Ou exécuter directement
node scripts/cleanup/cleanup-kv.js
```

**Fonctionnalités :**
- Liste tous les espaces de noms KV
- Identifie les espaces inutilisés
- Propose la suppression des entrées obsolètes
- Crée une sauvegarde avant suppression

---

### 3. Vérification d'Intégrité (`check-integrity.js`)

Vérifie l'intégrité des données entre les différents services Cloudflare.

**Utilisation :**
```bash
# Exécuter la vérification d'intégrité
npm run check:integrity
```

**Vérifications effectuées :**
- Cohérence entre D1 et R2
- Liens brisés dans les médias
- Permissions et accès

## 🔒 Bonnes Pratiques

1. **Toujours faire une sauvegarde** avant d'exécuter les scripts de nettoyage
2. **Tester en environnement de développement** avant la production
3. **Vérifier les logs** après chaque opération
4. **Documenter** toutes les actions effectuées

## 📊 Suivi des Nettoyages

| Date       | Script Exécuté | Résultat |
|------------|----------------|----------|
| 21/05/2024 | merge-databases | Base `flodrama-database` supprimée |
| 21/05/2024 | cleanup-kv | Espaces KV optimisés |

## ⚠️ Dépannage

### Erreurs Courantes

1. **Permissions insuffisantes**
   - Vérifiez que votre token API a les droits nécessaires
   - Utilisez `wrangler login` pour vous authentifier

2. **Connexion à la base de données échouée**
   - Vérifiez les identifiants de la base de données
   - Assurez-vous que le service est actif

3. **Échec de la suppression**
   - Vérifiez les dépendances
   - Assurez-vous que la ressource n'est pas verrouillée

Pour plus d'aide, consultez la [documentation Cloudflare](https://developers.cloudflare.com/).
node scripts/cleanup/merge-databases.js
```

**Fonctionnalités :**
- Sauvegarde automatique des bases de données avant toute modification
- Fusion des données de la base source vers la base cible
- Journalisation détaillée des opérations

### 2. Nettoyage des Espaces de Noms KV (`cleanup-kv.js`)

Ce script permet de nettoyer les espaces de noms KV inutilisés.

**Utilisation :**
```bash
# Afficher les espaces de noms KV et les supprimer
npm run cleanup:kv

# Ou exécuter directement
node scripts/cleanup/cleanup-kv.js
```

**Fonctionnalités :**
- Liste tous les espaces de noms KV
- Permet de sauvegarder avant suppression
- Demande confirmation avant toute suppression

## Bonnes Pratiques

1. **Toujours faire une sauvegarde** avant d'exécuter les scripts de nettoyage
2. **Tester d'abord en environnement de développement**
3. **Vérifier les logs** après chaque exécution
4. **Documenter** toute modification apportée à la structure des données

## Dépannage

### Erreur de Permission
Si vous rencontrez des erreurs de permission, assurez-vous que les scripts sont exécutables :
```bash
chmod +x scripts/cleanup/*.js
```

### Erreur de Dépendances
Si des dépendances manquent, exécutez :
```bash
npm install
```

## Avertissement
Ces scripts modifient directement les données de production. Utilisez-les avec précaution et assurez-vous d'avoir une sauvegarde récente avant toute opération.
