# Documentation de Sécurité FloDrama

## Vulnérabilités connues et plan de mitigation

### État actuel (08/05/2025)

Lors de l'adaptation du projet à l'architecture Cloudflare, nous avons identifié et corrigé plusieurs vulnérabilités critiques et élevées dans les dépendances. Cependant, certaines vulnérabilités modérées persistent en raison de conflits de dépendances.

#### Vulnérabilités résolues
- Cross-site Request Forgery (CSRF) dans axios (mise à jour vers 1.6.8)
- Prototype Pollution dans axios (mise à jour vers 1.6.8)
- Improper Handling of Extra Parameters dans follow-redirects (mise à jour vers 1.6.8)
- Prototype Pollution dans protobufjs (mise à jour vers Firebase 10.9.0)
- Denial of Service (DoS) dans ws (mise à jour vers Firebase 10.9.0)

#### Vulnérabilités restantes (modérées)
- Vulnérabilités dans esbuild (serveur de développement uniquement)
- Vulnérabilités dans postcss (sans correctif disponible)
- Vulnérabilités dans undici (liées à Firebase)

### Plan de mitigation

1. **Environnement de développement**
   - Les vulnérabilités dans esbuild concernent uniquement le serveur de développement et n'affectent pas l'application en production.
   - Recommandation : Limiter l'accès au serveur de développement aux seuls développeurs autorisés.

2. **Dépendances sans correctif**
   - Les vulnérabilités dans postcss sont modérées et n'ont pas de correctif disponible.
   - Recommandation : Surveiller les mises à jour futures et appliquer les correctifs dès qu'ils seront disponibles.

3. **Dépendances transitives**
   - Les vulnérabilités dans undici sont liées à Firebase et sont considérées comme modérées.
   - Recommandation : Surveiller les mises à jour de Firebase et mettre à jour régulièrement.

### Prochaines étapes

- Planifier une revue de sécurité complète pour le Q3 2025
- Envisager la migration vers des alternatives plus sécurisées pour certaines dépendances problématiques
- Mettre en place un processus d'audit de sécurité régulier dans le pipeline CI/CD

## Bonnes pratiques de sécurité pour FloDrama

1. **Authentification**
   - Utiliser des jetons JWT avec une durée de vie limitée
   - Implémenter l'authentification à deux facteurs pour les comptes administrateurs

2. **API Cloudflare**
   - Limiter les requêtes par IP pour prévenir les attaques par déni de service
   - Valider toutes les entrées utilisateur côté serveur

3. **Données sensibles**
   - Ne jamais stocker de secrets dans le code source
   - Utiliser les variables d'environnement de Cloudflare pour les secrets

4. **Front-end**
   - Implémenter une politique de sécurité du contenu (CSP)
   - Protéger contre les attaques XSS en échappant correctement les données utilisateur

---

Document créé le 08/05/2025 par l'équipe FloDrama
