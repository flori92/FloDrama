# Instructions pour remplacer les images FloDrama

## Images à remplacer

Voici la correspondance entre les images originales et les nouvelles images thématiques asiatiques :

| Image originale | Remplacement | Description |
|-----------------|--------------|-------------|
| `WelcomePageBanner.jpg` | Image 3 | Bannière avec tour de Séoul, acteurs K-drama et personnages anime |
| `WelcomePageImage1.png` | Image 1 | Smartphone avec interface FloDrama montrant des K-dramas |
| `WelcomePageImage2.png` | Image 2 | Collection d'appareils affichant différents contenus asiatiques |
| `WelcomePageImage3.png` | Image 5 | Appareils multiples avec K-drama, anime, C-drama et Bollywood |
| `WelcomePageImage4.png` | Image 4 | Famille regardant une scène de danse Bollywood |

## Étapes de remplacement

1. **Copier les nouvelles images**
   - Enregistrez les 5 images que vous avez partagées dans le dossier `/Users/floriace/FLO_DRAMA/FloDrama/New-FloDrama/public/images/`
   - Renommez-les selon le tableau de correspondance ci-dessus

2. **Mettre à jour les références dans le code**
   - Les composants utilisent des importations relatives comme :
     ```javascript
     import WelcomePageBanner from "../images/WelcomePageBanner.jpg";
     ```
   - Modifiez ces références pour utiliser le dossier public :
     ```javascript
     // Ancien import
     import WelcomePageBanner from "../images/WelcomePageBanner.jpg";
     
     // Nouvel import - Option 1 (garder l'import)
     import WelcomePageBanner from "/images/WelcomePageBanner.jpg";
     
     // Nouvel import - Option 2 (utiliser directement dans src)
     <img src="/images/WelcomePageBanner.jpg" alt="FloDrama Banner" />
     ```

3. **Vérifier les composants à mettre à jour**
   - Pages/SignIn.jsx
   - Pages/SignUp.jsx
   - Pages/Welcome.jsx (page d'accueil principale qui utilise les images)

4. **Recompiler le projet**
   ```bash
   cd /Users/floriace/FLO_DRAMA/FloDrama/New-FloDrama
   npm run build
   ```

5. **Redéployer sur Cloudflare Pages**
   ```bash
   npx wrangler pages deploy dist --project-name=flodrama
   ```

## Conseil pour l'optimisation des images

Ces images étant utilisées sur le web, assurez-vous qu'elles sont correctement optimisées :

1. Format optimal : JPEG pour photos, PNG pour illustrations avec transparence
2. Taille raisonnable : ~500-800KB max pour les grandes images, ~200KB pour les plus petites
3. Dimensions adaptées : redimensionnez selon les besoins réels d'affichage

Vous pouvez utiliser des outils comme ImageOptim, TinyPNG ou Squoosh pour cette optimisation.
