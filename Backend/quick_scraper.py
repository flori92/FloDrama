#!/usr/bin/env python3
"""
Script de scraping rapide pour FloDrama
Collecte des données de base pour analyse statistique
"""
import os
import json
import logging
import requests
import time
import random
from datetime import datetime
from bs4 import BeautifulSoup
from fake_useragent import UserAgent

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('FloDrama-QuickScraping')

# Sources de contenu
SOURCES = {
    'dramacool': {
        'base_url': 'https://dramacool.cr',
        'recent_url': '/recently-added',
        'popular_url': '/most-popular-drama',
        'type': 'drama'
    },
    'kdramahood': {
        'base_url': 'https://kdramahood.com',
        'recent_url': '/latest-kdramas',
        'popular_url': '/popular-kdramas',
        'type': 'drama'
    },
    'asianfilm': {
        'base_url': 'https://asianfilm.to',
        'recent_url': '/latest-movies',
        'popular_url': '/popular-movies',
        'type': 'movie'
    }
}

# Fonction principale de scraping
def quick_scrape(sources=None, limit=30):
    """
    Effectue un scraping rapide des sources spécifiées
    
    Args:
        sources: Liste des sources à scraper (par défaut, toutes)
        limit: Nombre maximum d'éléments à récupérer par source
        
    Returns:
        dict: Statistiques et données collectées
    """
    if not sources:
        sources = list(SOURCES.keys())
    
    ua = UserAgent()
    results = {
        'metadata': {
            'timestamp': datetime.now().isoformat(),
            'sources_count': len(sources),
            'limit_per_source': limit
        },
        'stats': {
            'total_items': 0,
            'by_source': {},
            'by_type': {},
            'by_language': {}
        },
        'data': []
    }
    
    for source_name in sources:
        if source_name not in SOURCES:
            logger.warning(f"Source inconnue: {source_name}")
            continue
            
        source = SOURCES[source_name]
        logger.info(f"Scraping de {source_name}...")
        
        # Initialiser les statistiques pour cette source
        results['stats']['by_source'][source_name] = 0
        
        # Scraping des contenus récents
        recent_url = f"{source['base_url']}{source['recent_url']}"
        headers = {'User-Agent': ua.random}
        
        try:
            response = requests.get(recent_url, headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Logique de scraping spécifique à chaque source
            items = []
            
            if source_name == 'dramacool':
                items = soup.select('.list-episode-item')[:limit]
                
                for item in items:
                    title_elem = item.select_one('.title a')
                    if not title_elem:
                        continue
                        
                    title = title_elem.text.strip()
                    url = title_elem.get('href', '')
                    image = item.select_one('img').get('src', '') if item.select_one('img') else ''
                    
                    # Déterminer la langue (estimation basée sur le titre)
                    language = 'ko'  # Par défaut coréen
                    if 'chinese' in title.lower() or 'chinese drama' in title.lower():
                        language = 'zh'
                    elif 'japanese' in title.lower() or 'japanese drama' in title.lower():
                        language = 'ja'
                    elif 'thai' in title.lower() or 'thai drama' in title.lower():
                        language = 'th'
                        
                    # Ajouter aux statistiques
                    results['stats']['total_items'] += 1
                    results['stats']['by_source'][source_name] += 1
                    
                    content_type = source['type']
                    results['stats']['by_type'][content_type] = results['stats']['by_type'].get(content_type, 0) + 1
                    results['stats']['by_language'][language] = results['stats']['by_language'].get(language, 0) + 1
                    
                    # Ajouter aux données
                    results['data'].append({
                        'title': title,
                        'source': source_name,
                        'url': url,
                        'image': image,
                        'type': content_type,
                        'language': language,
                        'scraped_at': datetime.now().isoformat()
                    })
            
            elif source_name == 'kdramahood':
                items = soup.select('.post-item')[:limit]
                
                for item in items:
                    title_elem = item.select_one('.post-title a')
                    if not title_elem:
                        continue
                        
                    title = title_elem.text.strip()
                    url = title_elem.get('href', '')
                    image = item.select_one('img').get('src', '') if item.select_one('img') else ''
                    
                    # Kdramahood est principalement coréen
                    language = 'ko'
                        
                    # Ajouter aux statistiques
                    results['stats']['total_items'] += 1
                    results['stats']['by_source'][source_name] += 1
                    
                    content_type = source['type']
                    results['stats']['by_type'][content_type] = results['stats']['by_type'].get(content_type, 0) + 1
                    results['stats']['by_language'][language] = results['stats']['by_language'].get(language, 0) + 1
                    
                    # Ajouter aux données
                    results['data'].append({
                        'title': title,
                        'source': source_name,
                        'url': url,
                        'image': image,
                        'type': content_type,
                        'language': language,
                        'scraped_at': datetime.now().isoformat()
                    })
            
            elif source_name == 'asianfilm':
                items = soup.select('.movie-item')[:limit]
                
                for item in items:
                    title_elem = item.select_one('.movie-title a')
                    if not title_elem:
                        continue
                        
                    title = title_elem.text.strip()
                    url = title_elem.get('href', '')
                    image = item.select_one('img').get('src', '') if item.select_one('img') else ''
                    
                    # Déterminer la langue (estimation basée sur le titre)
                    language = 'ko'  # Par défaut coréen
                    if 'chinese' in title.lower() or 'chinese movie' in title.lower():
                        language = 'zh'
                    elif 'japanese' in title.lower() or 'japanese movie' in title.lower():
                        language = 'ja'
                    elif 'thai' in title.lower() or 'thai movie' in title.lower():
                        language = 'th'
                    elif 'bollywood' in title.lower() or 'indian' in title.lower():
                        language = 'hi'
                        
                    # Ajouter aux statistiques
                    results['stats']['total_items'] += 1
                    results['stats']['by_source'][source_name] += 1
                    
                    content_type = source['type']
                    results['stats']['by_type'][content_type] = results['stats']['by_type'].get(content_type, 0) + 1
                    results['stats']['by_language'][language] = results['stats']['by_language'].get(language, 0) + 1
                    
                    # Ajouter aux données
                    results['data'].append({
                        'title': title,
                        'source': source_name,
                        'url': url,
                        'image': image,
                        'type': content_type,
                        'language': language,
                        'scraped_at': datetime.now().isoformat()
                    })
            
            logger.info(f"Récupération de {len(items)} éléments depuis {source_name}")
            
            # Pause pour éviter de surcharger les serveurs
            time.sleep(random.uniform(1, 3))
            
        except Exception as e:
            logger.error(f"Erreur lors du scraping de {source_name}: {str(e)}")
    
    # Générer des données simulées si aucune donnée n'a été récupérée
    if results['stats']['total_items'] == 0:
        logger.warning("Aucune donnée récupérée, génération de données simulées")
        results = generate_simulated_data(sources, limit)
    
    # Sauvegarder les résultats
    output_file = f"scraping_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    logger.info(f"Résultats sauvegardés dans {output_file}")
    return results

def generate_simulated_data(sources, limit):
    """Génère des données simulées pour démonstration"""
    languages = ['ko', 'zh', 'ja', 'th', 'hi']
    types = ['drama', 'movie']
    
    results = {
        'metadata': {
            'timestamp': datetime.now().isoformat(),
            'sources_count': len(sources),
            'limit_per_source': limit,
            'simulated': True
        },
        'stats': {
            'total_items': 0,
            'by_source': {},
            'by_type': {},
            'by_language': {}
        },
        'data': []
    }
    
    # Titres de K-drama populaires
    drama_titles = [
        "Crash Landing on You", "Goblin", "Descendants of the Sun", "Itaewon Class",
        "My Love from the Star", "Hospital Playlist", "Reply 1988", "Signal",
        "Kingdom", "It's Okay to Not Be Okay", "Mr. Sunshine", "Vincenzo",
        "True Beauty", "Start-Up", "The King: Eternal Monarch", "Hotel Del Luna",
        "What's Wrong with Secretary Kim", "Strong Woman Do Bong Soon",
        "Boys Over Flowers", "Heirs", "Moon Lovers: Scarlet Heart Ryeo"
    ]
    
    # Films asiatiques populaires
    movie_titles = [
        "Parasite", "Train to Busan", "The Handmaiden", "Oldboy", "Burning",
        "Your Name", "Spirited Away", "In the Mood for Love", "Chungking Express",
        "Hero", "Crouching Tiger, Hidden Dragon", "Shoplifters", "Drive My Car",
        "The Wailing", "I Saw the Devil", "A Tale of Two Sisters", "Memories of Murder",
        "The Host", "Joint Security Area", "Thirst", "Mother"
    ]
    
    for source_name in sources:
        source_type = 'drama' if 'drama' in source_name.lower() else 'movie'
        results['stats']['by_source'][source_name] = 0
        
        for _ in range(limit):
            # Choisir un type de contenu
            content_type = source_type
            
            # Choisir une langue
            language_weights = {'ko': 0.6, 'zh': 0.15, 'ja': 0.15, 'th': 0.05, 'hi': 0.05}
            language = random.choices(list(language_weights.keys()), 
                                     weights=list(language_weights.values()), 
                                     k=1)[0]
            
            # Choisir un titre
            if content_type == 'drama':
                title = random.choice(drama_titles)
            else:
                title = random.choice(movie_titles)
                
            # Ajouter un suffixe de langue pour diversifier
            if language == 'zh':
                title += " (Chinese Drama)"
            elif language == 'ja':
                title += " (Japanese Version)"
            elif language == 'th':
                title += " (Thai Adaptation)"
            elif language == 'hi':
                title += " (Bollywood Remake)"
            
            # Ajouter aux statistiques
            results['stats']['total_items'] += 1
            results['stats']['by_source'][source_name] += 1
            
            results['stats']['by_type'][content_type] = results['stats']['by_type'].get(content_type, 0) + 1
            results['stats']['by_language'][language] = results['stats']['by_language'].get(language, 0) + 1
            
            # Ajouter aux données
            results['data'].append({
                'title': title,
                'source': source_name,
                'url': f"https://example.com/{source_name}/{title.lower().replace(' ', '-')}",
                'image': f"https://example.com/images/{content_type}_{random.randint(1, 100)}.jpg",
                'type': content_type,
                'language': language,
                'scraped_at': datetime.now().isoformat(),
                'simulated': True
            })
    
    return results

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Script de scraping rapide pour FloDrama")
    parser.add_argument('--sources', nargs='+', help='Sources à scraper')
    parser.add_argument('--limit', type=int, default=30, help='Nombre maximum d\'éléments par source')
    
    args = parser.parse_args()
    
    # Lancer le scraping
    results = quick_scrape(args.sources, args.limit)
    
    # Afficher les statistiques
    print("\n📊 Statistiques du scraping FloDrama")
    print(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📚 Total d'éléments: {results['stats']['total_items']}")
    
    print("\n📊 Répartition par source:")
    for source, count in results['stats']['by_source'].items():
        print(f"  - {source}: {count} éléments")
    
    print("\n📊 Répartition par type:")
    for content_type, count in results['stats']['by_type'].items():
        print(f"  - {content_type}: {count} éléments")
    
    print("\n📊 Répartition par langue:")
    for language, count in results['stats']['by_language'].items():
        print(f"  - {language}: {count} éléments")
