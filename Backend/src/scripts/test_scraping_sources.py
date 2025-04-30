"""
Script de test des sources de scraping
"""
import os
import sys
import asyncio
import aiohttp
import jinja2
from datetime import datetime
from pathlib import Path

# Ajout du chemin du projet pour l'import des modules
sys.path.append(str(Path(__file__).parent.parent.parent))
from src.config.scraping_config import STREAMING_SOURCES, HTTP_HEADERS

async def test_source(session, name, config):
    """Teste une source de scraping"""
    try:
        base_url = config['base_url']
        search_url = config['search_url'].format(base_url=base_url)
        
        # Test de l'URL de base
        async with session.get(base_url, headers=HTTP_HEADERS) as response:
            base_status = response.status
            
        # Test de l'URL de recherche
        async with session.get(search_url, headers=HTTP_HEADERS) as response:
            search_status = response.status
            
        return {
            'name': name,
            'type': config['type'],
            'base_url': base_url,
            'status': 'success',
            'response': f'Base: {base_status}, Search: {search_status}'
        }
    except Exception as e:
        return {
            'name': name,
            'type': config['type'],
            'base_url': base_url,
            'status': 'error',
            'error': str(e)
        }

async def test_all_sources():
    """Teste toutes les sources de scraping"""
    async with aiohttp.ClientSession() as session:
        tasks = []
        for name, config in STREAMING_SOURCES.items():
            tasks.append(test_source(session, name, config))
        return await asyncio.gather(*tasks)

def generate_html_report(results):
    """Génère un rapport HTML des résultats des tests"""
    template = """
<!DOCTYPE html>
<html>
<head>
    <title>Rapport de Test des Sources de Scraping</title>
    <meta charset="utf-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }
        .source {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .source h2 {
            margin-top: 0;
            color: #444;
        }
        .success {
            color: #28a745;
            border-left: 4px solid #28a745;
        }
        .error {
            color: #dc3545;
            border-left: 4px solid #dc3545;
        }
        .warning {
            color: #ffc107;
            border-left: 4px solid #ffc107;
        }
        pre {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
        }
        .metadata {
            color: #666;
            font-size: 0.9em;
            margin-bottom: 10px;
        }
        .test-summary {
            margin: 20px 0;
            padding: 15px;
            background: #e9ecef;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Rapport de Test des Sources de Scraping</h1>
        <div class="metadata">
            Généré le {{ timestamp }}
        </div>
        <div class="test-summary">
            <h3>Résumé des Tests</h3>
            <p>Total des sources testées : {{ total_sources }}</p>
            <p>Sources en succès : {{ success_count }}</p>
            <p>Sources en erreur : {{ error_count }}</p>
        </div>
        {% for result in results %}
        <div class="source {{ result.status }}">
            <h2>{{ result.name }}</h2>
            <p><strong>Type:</strong> {{ result.type }}</p>
            <p><strong>Base URL:</strong> {{ result.base_url }}</p>
            <p><strong>Status:</strong> {{ result.status }}</p>
            {% if result.error %}
            <p><strong>Erreur:</strong></p>
            <pre>{{ result.error }}</pre>
            {% endif %}
            {% if result.response %}
            <p><strong>Réponse:</strong></p>
            <pre>{{ result.response }}</pre>
            {% endif %}
        </div>
        {% endfor %}
    </div>
</body>
</html>
"""
    
    # Calcul des statistiques
    total_sources = len(results)
    success_count = len([r for r in results if r['status'] == 'success'])
    error_count = len([r for r in results if r['status'] == 'error'])
    
    # Génération du rapport
    env = jinja2.Environment()
    template = env.from_string(template)
    html = template.render(
        results=results,
        timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        total_sources=total_sources,
        success_count=success_count,
        error_count=error_count
    )
    
    # Création du dossier reports s'il n'existe pas
    reports_dir = Path(__file__).parent.parent.parent / 'reports'
    reports_dir.mkdir(exist_ok=True)
    
    # Sauvegarde du rapport
    report_path = reports_dir / f'scraping_test_{datetime.now().strftime("%Y%m%d_%H%M%S")}.html'
    report_path.write_text(html, encoding='utf-8')
    return str(report_path)

async def main():
    """Fonction principale"""
    print("\n╔════════════════════════════════════════════════╗")
    print("║                                                ║")
    print("║   Test des sources de scraping pour FloDrama   ║")
    print("║                                                ║")
    print("╚════════════════════════════════════════════════╝\n")
    
    print("Sources testées :")
    for name in STREAMING_SOURCES.keys():
        print(f"- {name.title()}")
    print("\nLe script va tester chaque source et générer un rapport HTML.\n")
    
    results = await test_all_sources()
    report_path = generate_html_report(results)
    
    print(f"\nRapport généré : {report_path}\n")
    
    # Affichage du résumé
    total_sources = len(results)
    success_count = len([r for r in results if r['status'] == 'success'])
    error_count = len([r for r in results if r['status'] == 'error'])
    
    print("Résumé des tests :")
    print(f"Total des sources : {total_sources}")
    print(f"Sources en succès : {success_count}")
    print(f"Sources en erreur : {error_count}")

if __name__ == '__main__':
    asyncio.run(main())
