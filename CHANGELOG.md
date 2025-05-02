## [Suppression] 2025-05-01
- Suppression complète de la source Senpai-Stream :
    - Script `scraping/sources/senpaistream.py` supprimé
    - Références retirées du pipeline (`launch_scraping.py`)
    - Suppression des utilitaires Playwright associés
    - Motif : contenu inaccessible sans compte ou non exploitable en scraping classique

## [Nettoyage Lynx] 2025-05-02
- Suppression complète de tous les scripts, composants, types, styles et dépendances liés à Lynx :
    - Scripts supprimés : `installer-lynx.sh`, `fetch_lynx_repos.py`, `update_lynx_docs.sh`, `corriger-dependances.sh`, `fetch_lynx_documentation.sh`
    - Fichier de types supprimé : `Frontend/src/types/declarations/lynx.d.ts`
    - Suppression du composant `HybridComponentProvider` et de toute logique hybride
    - Réécriture du composant `Navigation` en React pur
    - Nettoyage des utilitaires de styles (`themeUtils.ts`) : plus aucune adaptation Lynx
    - Vérification et nettoyage du `package.json` : aucune dépendance Lynx restante
- Projet désormais 100% React/Supabase, sans code mort ni dépendance obsolète.
