# FloDrama API Backend (Flask + S3 + Zappa)

## Lancement local

1. Placez vos credentials AWS dans `~/.aws/credentials` (profil `[default]` ou `[flotv]`).
2. Placez le dump JSON dans un bucket S3 (ex : `flodrama-dump/content.json`).
3. Depuis le dossier Backend :

```bash
chmod +x start_api_server.sh
./start_api_server.sh
```

- L'API sera accessible sur http://localhost:5000/api/content

## Déploiement Cloud AWS Lambda (Zappa)

1. Installez les dépendances :
   ```bash
   pip install -r requirements.txt
   pip install zappa
   ```
2. Configurez/modifiez `zappa_settings.json` si besoin (région, profil, bucket, clé S3).
3. Déployez :
   ```bash
   zappa deploy production
   ```
4. Notez l'URL publique fournie par Zappa (API Gateway).

## Variables d'environnement importantes

- `FLODRAMA_S3_BUCKET` : nom du bucket S3 où se trouve le dump JSON
- `FLODRAMA_S3_KEY` : nom du fichier JSON dans le bucket

## Sécurité
- Ne JAMAIS commiter vos credentials AWS dans le code source.
- Utilisez des rôles IAM restreints pour la production.

## Points d'API exposés
- `GET /api/content?category=...` : liste filtrée par catégorie
- `GET /api/content/<content_id>` : détail d'un contenu
- `GET /api/content/<content_id>/stream` : URL de streaming d'un contenu

---

Pour toute évolution (auth, pagination, recherche avancée), adapter `api_server.py`.
