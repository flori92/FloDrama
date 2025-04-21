#!/usr/bin/env python3
"""
Adaptateur Python pour le SmartScrapingService de FloDrama
Ce module permet d'utiliser le service JavaScript de scraping intelligent depuis Python
"""
import os
import json
import logging
import subprocess
import tempfile
import hashlib
from pathlib import Path

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SmartScrapingAdapter:
    """
    Adaptateur Python pour le service de scraping JavaScript SmartScrapingService.
    Permet d'utiliser les fonctionnalités du service de scraping JavaScript depuis Python.
    """
    
    def __init__(self, js_service_path=None):
        """
        Initialise l'adaptateur avec le chemin vers le service JavaScript.
        
        Args:
            js_service_path (str, optional): Chemin vers le fichier SmartScrapingService.js.
                Si non spécifié, tente de trouver le fichier automatiquement.
        """
        self.js_service_path = js_service_path
        
        # Si le chemin n'est pas spécifié, tenter de le trouver
        if not self.js_service_path:
            self._find_js_service()
        
        # Vérifier que le fichier existe
        if not os.path.exists(self.js_service_path):
            raise FileNotFoundError(f"SmartScrapingService.js introuvable. Veuillez spécifier le chemin manuellement.")
        
        logger.info(f"SmartScrapingAdapter initialisé avec {self.js_service_path}")
    
    def _find_js_service(self):
        """
        Tente de trouver le fichier SmartScrapingService.js dans différents emplacements courants.
        """
        # Liste des emplacements possibles
        possible_paths = [
            # Chemin relatif au répertoire courant
            os.path.join(os.getcwd(), "SmartScrapingService.js"),
            # Chemin relatif au répertoire du script
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "SmartScrapingService.js"),
            # Chemin absolu typique dans une structure de projet
            "/var/task/SmartScrapingService.js",  # Pour AWS Lambda
            # Autres chemins possibles
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "features", "scraping", "services", "SmartScrapingService.js"),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "Frontend", "src", "features", "scraping", "services", "SmartScrapingService.js"),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "services", "SmartScrapingService.js"),
            # Rechercher dans le répertoire courant et ses sous-répertoires
            *self._find_file_in_directory(os.getcwd(), "SmartScrapingService.js"),
            # Rechercher dans /tmp pour AWS Lambda
            *self._find_file_in_directory("/tmp", "SmartScrapingService.js")
        ]
        
        # Vérifier chaque chemin
        for path in possible_paths:
            if os.path.exists(path):
                self.js_service_path = path
                logger.info(f"SmartScrapingService.js trouvé à {path}")
                return
        
        # Si on arrive ici, le fichier n'a pas été trouvé
        self.js_service_path = None
    
    def _find_file_in_directory(self, directory, filename, max_depth=3):
        """
        Recherche récursivement un fichier dans un répertoire.
        
        Args:
            directory (str): Répertoire de départ
            filename (str): Nom du fichier à rechercher
            max_depth (int): Profondeur maximale de recherche
            
        Returns:
            list: Liste des chemins trouvés
        """
        found_paths = []
        
        try:
            for root, dirs, files in os.walk(directory):
                # Vérifier la profondeur
                depth = root[len(directory):].count(os.sep)
                if depth > max_depth:
                    continue
                
                if filename in files:
                    found_paths.append(os.path.join(root, filename))
        except Exception as e:
            logger.warning(f"Erreur lors de la recherche de {filename} dans {directory}: {e}")
        
        return found_paths
    
    def _create_node_bridge(self):
        """Crée un script Node.js pour faire le pont avec le SmartScrapingService"""
        bridge_content = """
const fs = require('fs');
const path = require('path');

// Importer le SmartScrapingService
const servicePath = process.argv[2];
const { SmartScrapingService } = require(servicePath);

// Initialiser le service
const scrapingService = new SmartScrapingService();

// Lire les arguments
const inputFile = process.argv[3];
const outputFile = process.argv[4];

// Lire les données d'entrée
const input = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
const { action, params } = input;

// Exécuter l'action demandée
async function executeAction() {
    try {
        await scrapingService.configure(input.config || {});
        
        let result;
        switch (action) {
            case 'searchContent':
                result = await scrapingService.searchContent(params.query, params.options);
                break;
            case 'getContentDetails':
                result = await scrapingService.getContentDetails(params.contentId, params.source);
                break;
            case 'getStreamingLinks':
                result = await scrapingService.getStreamingLinks(params.episodeId, params.source);
                break;
            case 'updateContentDatabase':
                result = await scrapingService.updateContentDatabase();
                break;
            case 'scrapeSource':
                result = await scrapingService.scrapeSource(params.source, params.query, params.options);
                break;
            default:
                throw new Error(`Action non supportée: ${action}`);
        }
        
        // Écrire le résultat
        fs.writeFileSync(outputFile, JSON.stringify({ success: true, data: result }));
        process.exit(0);
    } catch (error) {
        fs.writeFileSync(outputFile, JSON.stringify({ 
            success: false, 
            error: error.message,
            stack: error.stack
        }));
        process.exit(1);
    }
}

executeAction();
"""
        
        # Créer un fichier temporaire pour le bridge
        fd, bridge_path = tempfile.mkstemp(suffix='.js', prefix='smart_scraping_bridge_')
        with os.fdopen(fd, 'w') as f:
            f.write(bridge_content)
        
        return bridge_path
    
    def execute_service_action(self, action, params, config=None):
        """
        Exécute une action du SmartScrapingService via Node.js
        
        Args:
            action: Nom de l'action à exécuter
            params: Paramètres de l'action
            config: Configuration du service (optionnel)
            
        Returns:
            dict: Résultat de l'action
        """
        # Créer les fichiers temporaires pour l'entrée et la sortie
        fd_in, input_file = tempfile.mkstemp(suffix='.json', prefix='smart_scraping_input_')
        fd_out, output_file = tempfile.mkstemp(suffix='.json', prefix='smart_scraping_output_')
        
        try:
            # Écrire les données d'entrée
            with os.fdopen(fd_in, 'w') as f:
                json.dump({
                    'action': action,
                    'params': params,
                    'config': config or {}
                }, f)
            
            # Exécuter le bridge Node.js
            cmd = ['node', self._create_node_bridge(), self.js_service_path, input_file, output_file]
            logger.info(f"Exécution de la commande: {' '.join(cmd)}")
            
            process = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=False
            )
            
            # Vérifier si l'exécution a réussi
            if process.returncode != 0:
                logger.error(f"Erreur lors de l'exécution du bridge Node.js: {process.stderr}")
                return {
                    'success': False,
                    'error': f"Erreur d'exécution: {process.stderr}"
                }
            
            # Lire le résultat
            with os.fdopen(fd_out, 'r') as f:
                result = json.load(f)
            
            return result
        
        finally:
            # Nettoyer les fichiers temporaires
            try:
                os.unlink(input_file)
                os.unlink(output_file)
            except Exception as e:
                logger.warning(f"Erreur lors du nettoyage des fichiers temporaires: {e}")
    
    def search_content(self, query, options=None):
        """
        Recherche du contenu via le SmartScrapingService
        
        Args:
            query: Terme de recherche
            options: Options de recherche (optionnel)
            
        Returns:
            list: Résultats de la recherche
        """
        result = self.execute_service_action('searchContent', {
            'query': query,
            'options': options or {}
        })
        
        if result.get('success'):
            return result.get('data', [])
        else:
            logger.error(f"Erreur lors de la recherche: {result.get('error')}")
            return []
    
    def scrape_source(self, source, query=None, options=None):
        """
        Scrape une source spécifique
        
        Args:
            source: Nom de la source à scraper
            query: Terme de recherche (optionnel)
            options: Options de scraping (optionnel)
            
        Returns:
            list: Résultats du scraping
        """
        result = self.execute_service_action('scrapeSource', {
            'source': source,
            'query': query or '',
            'options': options or {}
        })
        
        if result.get('success'):
            return result.get('data', [])
        else:
            logger.error(f"Erreur lors du scraping de {source}: {result.get('error')}")
            return []
    
    def update_content_database(self):
        """
        Met à jour la base de données de contenu
        
        Returns:
            dict: Résultat de la mise à jour
        """
        result = self.execute_service_action('updateContentDatabase', {})
        
        if result.get('success'):
            return result.get('data', {})
        else:
            logger.error(f"Erreur lors de la mise à jour de la base de données: {result.get('error')}")
            return {}
    
    def get_content_details(self, content_id, source):
        """
        Récupère les détails d'un contenu
        
        Args:
            content_id: ID du contenu
            source: Source du contenu
            
        Returns:
            dict: Détails du contenu
        """
        result = self.execute_service_action('getContentDetails', {
            'contentId': content_id,
            'source': source
        })
        
        if result.get('success'):
            return result.get('data', {})
        else:
            logger.error(f"Erreur lors de la récupération des détails: {result.get('error')}")
            return {}

# Fonction principale pour tester l'adaptateur
def main():
    """Fonction de test pour l'adaptateur SmartScrapingService"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test de l'adaptateur SmartScrapingService")
    parser.add_argument('--action', choices=['search', 'scrape', 'update'], default='scrape',
                      help='Action à exécuter')
    parser.add_argument('--source', default='dramacool',
                      help='Source à scraper')
    parser.add_argument('--query', default='',
                      help='Terme de recherche')
    parser.add_argument('--limit', type=int, default=10,
                      help='Nombre maximum de résultats')
    
    args = parser.parse_args()
    
    try:
        adapter = SmartScrapingAdapter()
        
        if args.action == 'search':
            logger.info(f"Recherche de '{args.query}' dans toutes les sources...")
            results = adapter.search_content(args.query, {'limit': args.limit})
            logger.info(f"Résultats: {len(results)} éléments trouvés")
            
        elif args.action == 'scrape':
            logger.info(f"Scraping de la source '{args.source}'...")
            results = adapter.scrape_source(args.source, args.query, {'limit': args.limit})
            logger.info(f"Résultats: {len(results)} éléments scrapés")
            
        elif args.action == 'update':
            logger.info("Mise à jour de la base de données de contenu...")
            result = adapter.update_content_database()
            logger.info(f"Mise à jour terminée: {result}")
        
        # Afficher un échantillon des résultats
        if 'results' in locals() and results:
            print("\nÉchantillon des résultats:")
            for i, item in enumerate(results[:3]):
                print(f"\n--- Élément {i+1} ---")
                for key, value in item.items():
                    if isinstance(value, (list, dict)):
                        print(f"{key}: {json.dumps(value, ensure_ascii=False)[:100]}...")
                    else:
                        print(f"{key}: {value}")
    
    except Exception as e:
        logger.error(f"Erreur lors de l'exécution: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
