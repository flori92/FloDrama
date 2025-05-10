# Guide de configuration de Cloudflare Images pour FloDrama

Ce guide explique comment configurer Cloudflare Images pour stocker et distribuer les images de l'application FloDrama.

## Prérequis

- Un compte Cloudflare avec accès à Cloudflare Images
- Un token API Cloudflare avec les permissions appropriées
- Accès à la ligne de commande pour exécuter des commandes curl

## Étapes de configuration

### 1. Activer Cloudflare Images

1. Connectez-vous à votre tableau de bord Cloudflare : https://dash.cloudflare.com
2. Sélectionnez votre compte et accédez à "Images"
3. Cliquez sur "Activer Cloudflare Images" si ce n'est pas déjà fait

### 2. Créer un domaine personnalisé pour les images (optionnel mais recommandé)

1. Dans votre tableau de bord Cloudflare, accédez à la section "Domaines"
2. Ajoutez un sous-domaine pour vos images (par exemple, `images.flodrama.com`)
3. Configurez les enregistrements DNS nécessaires pour pointer vers Cloudflare Images

### 3. Générer un token API

1. Dans votre tableau de bord Cloudflare, accédez à "Mon profil" > "Jetons API"
2. Cliquez sur "Créer un jeton"
3. Sélectionnez le modèle "Modifier Cloudflare Images"
4. Définissez les permissions suivantes :
   - Account.Cloudflare Images: Edit
   - Account.Account Settings: Read
5. Définissez les ressources du compte sur "Include - All accounts"
6. Cliquez sur "Continuer pour résumer" puis "Créer un jeton"
7. **Important**: Copiez et conservez le jeton généré dans un endroit sûr

### 4. Configurer les variables d'environnement

Ajoutez les variables d'environnement suivantes à votre projet :

```bash
# Dans votre fichier .env local
CLOUDFLARE_ACCOUNT_ID=votre_id_de_compte_cloudflare
CLOUDFLARE_API_TOKEN=votre_token_api_cloudflare
CLOUDFLARE_IMAGES_DOMAIN=images.flodrama.com
```

Pour les Workers Cloudflare, ajoutez ces variables dans le tableau de bord Cloudflare :

1. Accédez à "Workers & Pages"
2. Sélectionnez votre Worker
3. Cliquez sur "Settings" > "Variables"
4. Ajoutez les variables mentionnées ci-dessus

### 5. Tester la configuration

Vous pouvez tester votre configuration avec la commande curl suivante :

```bash
curl -X POST \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -F "file=@chemin/vers/image.jpg" \
  -F "id=test_image_1" \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/images/v1"
```

Si tout est correctement configuré, vous devriez recevoir une réponse JSON avec `"success": true`.

### 6. Configurer les variants d'images

Les variants permettent de redimensionner automatiquement les images. Configurez les variants suivants :

```bash
curl -X POST \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "variants": {
      "w200": {"options": {"width": 200, "height": 300, "fit": "cover"}},
      "w500": {"options": {"width": 500, "height": 750, "fit": "cover"}},
      "w1000": {"options": {"width": 1000, "height": 1500, "fit": "cover"}},
      "original": {"options": {"metadata": "preserve"}}
    }
  }' \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/images/v1/variants"
```

### 7. Mettre à jour la configuration du scraper d'images

Modifiez le fichier `config.js` dans le dossier `cloudflare-worker/image-scraper/` pour utiliser votre domaine personnalisé :

```javascript
// Remplacer cette ligne
const IMAGE_DELIVERY_URL = 'https://images.flodrama.com';

// Par celle-ci (si vous n'utilisez pas de domaine personnalisé)
const IMAGE_DELIVERY_URL = `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}`;
```

## Utilisation

Une fois la configuration terminée, le scraper d'images pourra :

1. Télécharger automatiquement les images depuis les sources scrapées
2. Les stocker sur Cloudflare Images avec des IDs uniques
3. Générer des URLs optimisées pour différentes tailles d'images
4. Servir les images via le CDN de Cloudflare pour des performances optimales

## Dépannage

### Erreur "Unauthorized"
- Vérifiez que votre token API est valide et possède les bonnes permissions
- Assurez-vous que l'ID de compte est correct

### Erreur "Invalid file type"
- Assurez-vous que le fichier est bien une image dans un format supporté (JPG, PNG, GIF, WebP)
- Vérifiez que la taille du fichier ne dépasse pas 10 MB

### Problèmes de CORS
- Configurez les en-têtes CORS appropriés dans votre Worker Cloudflare
- Assurez-vous que votre domaine personnalisé est correctement configuré
