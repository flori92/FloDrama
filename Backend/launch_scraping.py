#!/usr/bin/env python3
"""
Script de lancement du scraping pour FloDrama
Version légère sans dépendances externes
"""
import os
import sys
import json
import logging
import subprocess
from datetime import datetime
from pathlib import Path

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('FloDrama-Scraping')

# Chargement de la configuration depuis .env
def load_env():
    """Charge les variables d'environnement depuis .env"""
    env_vars = {}
    env_path = Path(__file__).parent / '.env'
    
    if env_path.exists():
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                key, value = line.split('=', 1)
                env_vars[key.strip()] = value.strip()
    
    # Définir les variables d'environnement
    for key, value in env_vars.items():
        os.environ[key] = value
    
    return env_vars

# Charger les sources de scraping
def load_scraping_sources():
    """Charge les sources de scraping depuis la configuration"""
    sources = {
        'vostfree': {
            'base_url': 'https://vostfree.ws',
            'fallback_urls': [
                'https://vostfree.cx',
                'https://vostfree.tv'
            ],
            'type': 'drama'
        },
        'dramacool': {
            'base_url': 'https://dramacool.com.tr',
            'fallback_urls': [
                'https://dramacoolhd.mom'
            ],
            'type': 'drama'
        },
        'myasiantv': {
            'base_url': 'https://myasiantv.com.lv',
            'type': 'drama'
        },
        'voirdrama': {
            'base_url': 'https://voirdrama.org',
            'type': 'drama'
        },
        'mydramalist': {
            'base_url': 'https://mydramalist.com',
            'type': 'metadata'
        },
        'gogoanime': {
            'base_url': 'https://ww5.gogoanime.co.cz',
            'fallback_urls': [
                'https://gogoanime.by',
                'https://ww27.gogoanimes.fi',
                'https://gogoanime.org.vc'
            ],
            'type': 'anime'
        },
        'voiranime': {
            'base_url': 'https://v6.voiranime.com',
            'type': 'anime'
        },
        'neko-sama': {
            'base_url': 'https://neko-sama.to',
            'type': 'anime'
        },
        'zee5': {
            'base_url': 'https://www.zee5.com/global',
            'fallback_urls': [
                'https://www.zee5.com'
            ],
            'type': 'bollywood'
        },
        'hotstar': {
            'base_url': 'https://www.hotstar.com',
            'type': 'bollywood'
        },
        'viki': {
            'base_url': 'https://www.viki.com',
            'type': 'drama'
        },
        'wetv': {
            'base_url': 'https://wetv.vip',
            'type': 'drama'
        },
        'iqiyi': {
            'base_url': 'https://www.iq.com',
            'type': 'drama'
        },
        'kocowa': {
            'base_url': 'https://www.kocowa.com',
            'type': 'drama'
        },
        'coflix': {
            'base_url': 'https://coflix.mov',
            'type': 'drama'
        },
        'top-stream': {
            'base_url': 'https://top-stream.io',
            'type': 'drama'
        },
        'onetouchtv': {
            'base_url': 'https://onetouchtv.xyz',
            'type': 'drama'
        },
        'filmapik': {
            'base_url': 'https://filmapik.bio',
            'type': 'drama'
        }
    }
    return sources

def test_scraping_source(source_name, config):
    """Teste une source de scraping"""
    try:
        base_url = config['base_url']
        
        # Utiliser curl pour tester l'URL
        curl_cmd = [
            'curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', 
            '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            base_url
        ]
        
        result = subprocess.run(curl_cmd, capture_output=True, text=True)
        status_code = result.stdout.strip()
        
        return {
            'name': source_name,
            'type': config['type'],
            'base_url': base_url,
            'status': 'success' if status_code.startswith('2') else 'error',
            'response': f'HTTP Status: {status_code}'
        }
    except Exception as e:
        return {
            'name': source_name,
            'type': config['type'],
            'base_url': base_url,
            'status': 'error',
            'error': str(e)
        }

def generate_report(results):
    """Génère un rapport des résultats"""
    # Calcul des statistiques
    total_sources = len(results)
    success_count = len([r for r in results if r['status'] == 'success'])
    error_count = len([r for r in results if r['status'] == 'error'])
    
    # Création du rapport
    report = []
    report.append("╔════════════════════════════════════════════════╗")
    report.append("║                                                ║")
    report.append("║   Rapport de Scraping FloDrama                 ║")
    report.append("║                                                ║")
    report.append("╚════════════════════════════════════════════════╝")
    report.append("")
    report.append(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report.append("")
    report.append("Résumé:")
    report.append(f"- Total des sources: {total_sources}")
    report.append(f"- Sources en succès: {success_count}")
    report.append(f"- Sources en erreur: {error_count}")
    report.append("")
    report.append("Détails des sources:")
    
    for result in results:
        report.append(f"- {result['name']} ({result['type']}): {result['status']}")
        report.append(f"  URL: {result['base_url']}")
        if 'response' in result:
            report.append(f"  Réponse: {result['response']}")
        if 'error' in result:
            report.append(f"  Erreur: {result['error']}")
        report.append("")
    
    # Sauvegarde du rapport
    reports_dir = Path(__file__).parent / 'reports'
    reports_dir.mkdir(exist_ok=True)
    
    report_path = reports_dir / f"scraping_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    with open(report_path, 'w') as f:
        f.write('\n'.join(report))
    
    return report_path

def export_data_for_frontend():
    """Exporte les données pour le frontend"""
    print("\n📦 Exportation des données pour le frontend...")
    
    # Exécuter le script d'exportation
    script_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'scripts', 'export_content_for_frontend.py')
    
    if not os.path.exists(script_path):
        print(f"❌ Script d'exportation non trouvé: {script_path}")
        return False
    
    try:
        subprocess.run([sys.executable, script_path], check=True)
        print("✅ Données exportées avec succès")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur lors de l'exportation des données: {e}")
        return False

def main():
    """Fonction principale"""
    print("\n╔════════════════════════════════════════════════╗")
    print("║                                                ║")
    print("║   Lancement du scraping FloDrama               ║")
    print("║                                                ║")
    print("╚════════════════════════════════════════════════╝\n")
    
    # Charger les variables d'environnement
    env_vars = load_env()
    
    # Vérifier les identifiants AWS
    aws_access_key = env_vars.get('AWS_ACCESS_KEY_ID')
    aws_secret_key = env_vars.get('AWS_SECRET_ACCESS_KEY')
    aws_region = env_vars.get('AWS_REGION')
    
    if not aws_access_key or not aws_secret_key:
        print("❌ Identifiants AWS manquants dans le fichier .env")
        print("Veuillez configurer AWS_ACCESS_KEY_ID et AWS_SECRET_ACCESS_KEY")
        return
    
    print(f"✅ Identifiants AWS configurés")
    print(f"✅ Région AWS: {aws_region or 'us-east-1'}")
    
    # Charger les sources de scraping
    sources = load_scraping_sources()
    
    print("\nSources configurées:")
    for name, config in sources.items():
        print(f"- {name.title()} ({config['type']})")
    
    # Lancer le scraping pour chaque source individuellement
    print("\nLancement du scraping pour chaque source...")
    scraping_results = []
    for name, config in sources.items():
        source_script = None
        # Mapping nom de source -> script python
        script_mapping = {
            'vostfree': 'vostfree.py',
            'dramacool': 'dramacool.py',
            'myasiantv': 'myasiantv.py',
            'voirdrama': 'voirdrama.py',
            'mydramalist': 'mydramalist.py',
            'gogoanime': 'gogoanime.py',
            'voiranime': 'voiranime.py',
            'neko-sama': 'nekosama.py',
            'zee5': 'zee5.py',
            'hotstar': 'hotstar.py',
            'viki': 'asianwiki.py', # à adapter si un script dédié existe
            'wetv': 'filmapik.py',  # à adapter si un script dédié existe
            'iqiyi': 'tmdb.py',     # à adapter si un script dédié existe
            'kocowa': 'bollywood.py', # à adapter si un script dédié existe
            'coflix': 'coflix.py',
            'top-stream': 'topstream.py',
            'onetouchtv': 'onetouchtv.py',
            'filmapik': 'filmapik.py'
        }
        script_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'scraping', 'sources')
        script_name = script_mapping.get(name)
        if script_name:
            source_script = os.path.join(script_dir, script_name)
        
        if not source_script or not os.path.exists(source_script):
            print(f"❌ Script de scraping non trouvé pour la source: {name}")
            scraping_results.append({'name': name, 'type': config['type'], 'status': 'error', 'error': 'Script introuvable'})
            continue
        
        print(f"\n🚀 Lancement du scraping pour {name.title()}...")
        try:
            # Lancer le script de scraping en sous-processus
            result = subprocess.run([sys.executable, source_script], capture_output=True, text=True, timeout=3600)
            output = result.stdout
            error = result.stderr
            # Vérifier la sortie du script pour le quota
            if 'Objectif atteint' in output or '⚠️ Objectif non atteint' in output:
                status = 'success' if 'Objectif atteint' in output else 'warning'
            else:
                status = 'success' if result.returncode == 0 else 'error'
            scraping_results.append({
                'name': name,
                'type': config['type'],
                'status': status,
                'output': output[-2000:],  # Limiter la taille du log
                'error': error[-1000:] if error else None
            })
            print(f"✅ Fin du scraping pour {name.title()} (status: {status})")
        except Exception as e:
            scraping_results.append({'name': name, 'type': config['type'], 'status': 'error', 'error': str(e)})
            print(f"❌ Erreur lors du scraping de {name.title()}: {str(e)}")
    
    # Générer un rapport global
    print("\nGénération du rapport global...")
    global_report = []
    for result in scraping_results:
        global_report.append(f"- {result['name']} ({result['type']}): {result['status']}")
        if result.get('error'):
            global_report.append(f"  Erreur: {result['error']}")
        if result.get('output'):
            global_report.append(f"  Sortie: {result['output'][:500]}")
        global_report.append("")
    reports_dir = Path(__file__).parent / 'reports'
    reports_dir.mkdir(exist_ok=True)
    global_report_path = reports_dir / f"scraping_global_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    with open(global_report_path, 'w') as f:
        f.write('\n'.join(global_report))
    print(f"\n✅ Rapport global généré: {global_report_path}")
    
    # Exporter les données pour le frontend
    export_data_for_frontend()
    
    print("\nRésumé du scraping par source:")
    for result in scraping_results:
        print(f"- {result['name']} ({result['type']}): {result['status']}")
    print("\n🎉 Scraping terminé pour toutes les sources configurées.")

if __name__ == '__main__':
    main()
