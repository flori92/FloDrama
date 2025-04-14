# Configuration de Cloudflare pour FloDrama

## Pourquoi Cloudflare ?

Cloudflare offre plusieurs avantages pour FloDrama :
- Certificats SSL gratuits
- CDN mondial pour des performances optimales
- Protection contre les attaques DDoS
- En-têtes de sécurité configurables
- Facile à configurer avec GitHub Pages

## Étapes de configuration

### 1. Créer un compte Cloudflare

1. Rendez-vous sur [cloudflare.com](https://www.cloudflare.com)
2. Créez un compte ou connectez-vous
3. Suivez les instructions pour ajouter le domaine flodrama.com

### 2. Configurer les DNS

Une fois le domaine ajouté, configurez les enregistrements DNS suivants :

| Type | Nom | Contenu | Proxy activé |
|------|-----|---------|-------------|
| CNAME | @ | flori92.github.io | Oui |
| CNAME | www | flori92.github.io | Oui |

### 3. Configurer les serveurs de noms

Cloudflare vous fournira des serveurs de noms à configurer chez votre registraire de domaine.
Généralement, ils ressemblent à :
- ns1.cloudflare.com
- ns2.cloudflare.com

### 4. Configurer les règles de Page

Dans l'onglet "Rules" > "Page Rules", créez les règles suivantes :

1. **Toujours utiliser HTTPS**
   - URL: http://flodrama.com/*
   - Paramètre: Always Use HTTPS
   
2. **Cache Everything** (optionnel)
   - URL: flodrama.com/*.jpg*
   - Paramètre: Cache Level: Cache Everything
   
3. **Redirection www vers non-www** (ou l'inverse selon votre préférence)
   - URL: https://www.flodrama.com/*
   - Paramètre: Forwarding URL (301) to https://flodrama.com/$1

### 5. Configurer les en-têtes de sécurité

Dans l'onglet "SSL/TLS" > "Edge Certificates", activez :
- HSTS (Strict-Transport-Security)
- TLS 1.3
- Automatic HTTPS Rewrites

Dans l'onglet "Security" > "Settings", configurez :
- Security Level: Medium ou High
- Bot Fight Mode: On
- Challenge Passage: 30 Minutes

### 6. Optimisations de performance

Dans l'onglet "Speed" > "Optimization", activez :
- Auto Minify (HTML, CSS, JavaScript)
- Brotli Compression
- Rocket Loader (optionnel)
- Early Hints
- HTTP/3 (QUIC)

## Vérification

Une fois configuré, attendez que les DNS se propagent (généralement 24-48h) puis vérifiez :
1. Que https://flodrama.com fonctionne correctement
2. Que la connexion est sécurisée (cadenas dans le navigateur)
3. Testez sur [securityheaders.com](https://securityheaders.com) et [ssllabs.com](https://www.ssllabs.com/ssltest/)

## Maintenance

Cloudflare gère automatiquement le renouvellement des certificats SSL et les mises à jour de sécurité.
