# Documentation FloDrama

## Configuration de l'authentification

### Google OAuth

L'authentification utilise Google OAuth avec les configurations suivantes :

- **URL de redirection API** : https://flodrama-api-prod.florifavi.workers.dev/api/auth/callback
- **Configuration des identifiants** : Voir le fichier `.env`
- **Flux d'authentification** : L'API sert de point de redirection intermédiaire avant de rediriger vers le frontend

### Variables d'environnement requises

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```bash
GOOGLE_CLIENT_ID=votre_client_id
GOOGLE_CLIENT_SECRET=votre_client_secret
```

Ces identifiants sont disponibles dans la console Google Cloud Platform.

### Sécurité

- Les identifiants sensibles ne doivent jamais être commités dans le code
- Utilisez le fichier `.env.example` comme modèle
- Le fichier `.env` est ignoré par Git
