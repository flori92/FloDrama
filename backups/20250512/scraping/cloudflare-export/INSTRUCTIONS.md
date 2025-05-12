# Instructions pour importer les données dans Cloudflare Workers KV

Date de préparation: 10/05/2025 16:45:43

## Étapes à suivre:

1. Connectez-vous à votre compte Cloudflare: https://dash.cloudflare.com
2. Allez dans Workers & Pages > KV
3. Sélectionnez le namespace "FLODRAMA_METADATA"
4. Pour chaque fichier ci-dessous, cliquez sur "Add entry" et:
   - Dans le champ "Key", entrez le nom de la clé (sans .json)
   - Sélectionnez "Text" comme type de valeur
   - Copiez-collez le contenu du fichier JSON correspondant
   - Cliquez sur "Save"

## Fichiers à importer:

- **anime-index**: 17.96 KB
- **bollystream**: 17.30 KB
- **bollywood-index**: 1.86 KB
- **drama-index**: 3.51 KB
- **film-index**: 121.52 KB
- **global-index**: 144.80 KB
- **mydramalist**: 9.50 KB
- **nekosama**: 125.08 KB
- **streamingdivx**: 189.83 KB
- **tmdb-films**: 1.43 MB
- **voiranime**: 4.08 KB
- **voirdrama**: 4.52 KB

## Après l'importation:

1. Vérifiez que toutes les clés ont été importées correctement
2. Testez l'application FloDrama pour vous assurer que les données sont accessibles
