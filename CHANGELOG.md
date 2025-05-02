## [Suppression] 2025-05-01
- Suppression complète de la source Senpai-Stream :
    - Script `scraping/sources/senpaistream.py` supprimé
    - Références retirées du pipeline (`launch_scraping.py`)
    - Suppression des utilitaires Playwright associés
    - Motif : contenu inaccessible sans compte ou non exploitable en scraping classique
