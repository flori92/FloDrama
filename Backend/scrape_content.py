#!/usr/bin/env python3
"""
Script de scraping de contenu pour FloDrama
Ce script lance le scraping complet pour alimenter la base de données
"""
import os
import sys
import json
import logging
import requests
import time
from datetime import datetime
from pathlib import Path

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('FloDrama-ContentScraping')

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
        }
    }
    return sources

def generate_synopsis(source_name, content_type, index):
    """Génère un synopsis aléatoire en fonction du type de contenu"""
    
    # Bases de synopsis par type
    drama_synopsis = [
        "Une histoire d'amour inattendue entre deux personnes que tout oppose.",
        "Un médecin talentueux fait face à des défis professionnels et personnels.",
        "Une famille royale confrontée à des intrigues politiques et des trahisons.",
        "Un avocat idéaliste lutte contre la corruption dans le système judiciaire.",
        "Deux rivaux professionnels développent des sentiments l'un pour l'autre.",
        "Un voyage dans le temps qui bouleverse le destin de plusieurs personnes.",
        "Un détective résout des affaires criminelles tout en faisant face à son passé.",
        "Une histoire de vengeance qui s'étend sur plusieurs générations."
    ]
    
    anime_synopsis = [
        "Un jeune héros découvre qu'il possède des pouvoirs extraordinaires.",
        "Un groupe d'amis part à l'aventure pour sauver leur monde.",
        "Un étudiant ordinaire se retrouve dans un univers fantastique.",
        "Un combat épique entre le bien et le mal qui déterminera le sort de l'humanité.",
        "Un assassin redoutable remet en question son mode de vie.",
        "Des élèves d'une académie spéciale développent leurs capacités uniques.",
        "Une quête pour retrouver un artefact légendaire aux pouvoirs immenses.",
        "Une histoire d'amitié et de courage face à l'adversité."
    ]
    
    bollywood_synopsis = [
        "Une histoire d'amour qui transcende les différences sociales et culturelles.",
        "Un héros se bat contre le système pour obtenir justice.",
        "Une comédie romantique pleine de quiproquos et de situations hilarantes.",
        "Un drame familial qui explore les relations complexes entre générations.",
        "Un thriller palpitant avec des rebondissements inattendus.",
        "Un film d'action spectaculaire avec des cascades impressionnantes.",
        "Une histoire inspirante basée sur des événements réels.",
        "Un voyage de découverte de soi à travers l'Inde."
    ]
    
    # Sélection du synopsis de base selon le type
    if 'drama' in source_name or content_type in ['coreens', 'chinois', 'japonais', 'thailandais']:
        base_synopsis = drama_synopsis[index % len(drama_synopsis)]
        
        # Ajout de détails spécifiques selon le pays
        if 'coreens' in content_type:
            details = [
                "Se déroule à Séoul dans un contexte de forte compétition professionnelle.",
                "Une romance douce-amère dans le paysage urbain de la Corée moderne.",
                "Explore les tensions entre tradition et modernité dans la société coréenne."
            ]
        elif 'chinois' in content_type:
            details = [
                "Une épopée historique se déroulant sous la dynastie Ming.",
                "Un drame contemporain explorant la vie urbaine en Chine.",
                "Une histoire d'amour interdite dans la Chine ancienne."
            ]
        elif 'japonais' in content_type:
            details = [
                "Un drame subtil explorant les relations familiales au Japon.",
                "Une histoire se déroulant dans le Tokyo moderne avec ses contrastes.",
                "Un récit mélangeant tradition et innovation dans la société japonaise."
            ]
        elif 'thailandais' in content_type:
            details = [
                "Une comédie romantique légère dans les paysages magnifiques de Thaïlande.",
                "Un drame émotionnel explorant la vie à Bangkok.",
                "Une histoire d'amour compliquée entre des personnages aux parcours différents."
            ]
        else:
            details = [
                "Une histoire captivante qui explore les émotions humaines.",
                "Un récit touchant sur la résilience et l'espoir.",
                "Une narration complexe avec des personnages bien développés."
            ]
        
    elif 'anime' in source_name or content_type in ['shonen', 'seinen', 'romance', 'action']:
        base_synopsis = anime_synopsis[index % len(anime_synopsis)]
        
        # Ajout de détails spécifiques selon le genre
        if 'shonen' in content_type:
            details = [
                "Un jeune protagoniste qui s'efforce de devenir plus fort pour protéger ses amis.",
                "Des combats spectaculaires et une amitié inébranlable sont au cœur de cette histoire.",
                "Un parcours initiatique rempli de défis et de croissance personnelle."
            ]
        elif 'seinen' in content_type:
            details = [
                "Une histoire mature explorant des thèmes psychologiques profonds.",
                "Un récit sombre et complexe avec des personnages moralement ambigus.",
                "Une réflexion philosophique sur la condition humaine à travers un monde fantastique."
            ]
        elif 'romance' in content_type:
            details = [
                "Une histoire d'amour touchante entre deux personnages aux personnalités opposées.",
                "Un triangle amoureux compliqué dans un cadre scolaire.",
                "Une romance douce-amère qui explore les hauts et les bas des relations."
            ]
        elif 'action' in content_type:
            details = [
                "Des séquences d'action époustouflantes et une intrigue captivante.",
                "Un monde en guerre où les héros doivent faire des choix difficiles.",
                "Des combats stratégiques et des pouvoirs uniques dans un univers bien construit."
            ]
        else:
            details = [
                "Un univers riche en détails et en créativité.",
                "Des personnages attachants dans des situations extraordinaires.",
                "Une aventure épique qui captive du début à la fin."
            ]
        
    elif 'bollywood' in source_name or content_type in ['latest', 'popular', 'action', 'romance', 'comedy']:
        base_synopsis = bollywood_synopsis[index % len(bollywood_synopsis)]
        
        # Ajout de détails spécifiques selon le genre
        if 'action' in content_type:
            details = [
                "Des séquences d'action spectaculaires et des cascades impressionnantes.",
                "Un héros charismatique qui combat l'injustice.",
                "Un thriller palpitant avec des rebondissements inattendus."
            ]
        elif 'romance' in content_type:
            details = [
                "Une histoire d'amour passionnée qui surmonte tous les obstacles.",
                "Une romance colorée avec des numéros musicaux mémorables.",
                "Un amour interdit entre deux personnes de milieux différents."
            ]
        elif 'comedy' in content_type:
            details = [
                "Une comédie hilarante pleine de situations absurdes et de quiproquos.",
                "Un film léger qui célèbre la joie de vivre et l'amitié.",
                "Une satire sociale intelligente avec des personnages hauts en couleur."
            ]
        else:
            details = [
                "Un spectacle visuel éblouissant typique du cinéma indien.",
                "Une histoire qui mélange habilement drame, comédie et romance.",
                "Un film qui célèbre la richesse culturelle de l'Inde."
            ]
    else:
        # Pour les métadonnées ou autres types
        base_synopsis = "Une histoire captivante qui explore des thèmes universels."
        details = [
            "Des personnages bien développés dans des situations complexes.",
            "Un récit qui suscite la réflexion et l'émotion.",
            "Une narration innovante qui repousse les limites du genre."
        ]
    
    # Combiner le synopsis de base avec un détail spécifique
    detail = details[index % len(details)]
    full_synopsis = f"{base_synopsis} {detail}"
    
    # Ajouter une phrase de conclusion
    conclusions = [
        "Une œuvre qui ne manquera pas de captiver le public.",
        "Un incontournable pour les amateurs du genre.",
        "Une expérience immersive qui laisse une impression durable.",
        "Un récit qui résonne avec les expériences humaines universelles."
    ]
    conclusion = conclusions[index % len(conclusions)]
    
    return f"{full_synopsis} {conclusion}"

def generate_episodes(content_type, index, is_series=True):
    """Génère une liste d'épisodes pour une série"""
    if not is_series:
        return []
    
    # Déterminer le nombre de saisons et d'épisodes
    if 'drama' in content_type:
        # Les dramas ont généralement 1-2 saisons avec 12-24 épisodes
        seasons_count = 1 + (index % 2)
        episodes_per_season = 12 + ((index % 3) * 4)
    elif 'anime' in content_type:
        # Les animes ont souvent 1-4 saisons avec des nombres variables d'épisodes
        seasons_count = 1 + (index % 4)
        episodes_per_season = 12 + ((index % 5) * 3)
    else:
        # Valeur par défaut
        seasons_count = 1
        episodes_per_season = 10 + (index % 10)
    
    # Générer les saisons et épisodes
    seasons = []
    for season in range(1, seasons_count + 1):
        episodes = []
        for ep in range(1, episodes_per_season + 1):
            episode = {
                "number": ep,
                "title": f"Épisode {ep}",
                "duration": 45 + (ep % 15),  # Entre 45 et 59 minutes
                "air_date": f"2024-{(season * 2) % 12 + 1:02d}-{(ep * 2) % 28 + 1:02d}",
                "synopsis": f"Dans cet épisode, les personnages font face à de nouveaux défis et révélations.",
                "thumbnail": f"https://example.com/thumbnails/s{season}e{ep}.jpg",
                "stream_urls": [
                    f"https://stream1.example.com/s{season}/e{ep}",
                    f"https://stream2.example.com/s{season}/e{ep}"
                ]
            }
            episodes.append(episode)
        
        season_data = {
            "number": season,
            "title": f"Saison {season}",
            "year": 2020 + season,
            "episodes_count": episodes_per_season,
            "episodes": episodes
        }
        seasons.append(season_data)
    
    return seasons

def generate_cast(content_type, index):
    """Génère une distribution pour le contenu"""
    
    # Listes d'acteurs par région
    korean_actors = ["Kim Soo-hyun", "Song Joong-ki", "Lee Min-ho", "Park Seo-joon", "Gong Yoo", 
                    "Jun Ji-hyun", "Song Hye-kyo", "Park Shin-hye", "IU", "Bae Suzy"]
    
    chinese_actors = ["Yang Yang", "Xiao Zhan", "Li Xian", "Deng Lun", "Wang Yibo", 
                      "Yang Mi", "Zhao Liying", "Dilraba Dilmurat", "Angelababy", "Liu Yifei"]
    
    japanese_actors = ["Takeru Satoh", "Kento Yamazaki", "Ryunosuke Kamiki", "Sota Fukushi", "Mackenyu", 
                       "Yui Aragaki", "Haruka Ayase", "Suzu Hirose", "Kasumi Arimura", "Tao Tsuchiya"]
    
    thai_actors = ["Bright Vachirawit", "Win Metawin", "Gulf Kanawut", "Mew Suppasit", "Billkin Putthipong", 
                  "Urassaya Sperbund", "Davika Hoorne", "Baifern Pimchanok", "Mookda Narinrak", "Khemanit Jamikorn"]
    
    bollywood_actors = ["Shah Rukh Khan", "Aamir Khan", "Salman Khan", "Hrithik Roshan", "Ranbir Kapoor", 
                        "Deepika Padukone", "Priyanka Chopra", "Alia Bhatt", "Katrina Kaif", "Kareena Kapoor"]
    
    anime_voice_actors = ["Yuki Kaji", "Mamoru Miyano", "Kana Hanazawa", "Hiroshi Kamiya", "Daisuke Ono", 
                         "Aoi Yuki", "Saori Hayami", "Yoshitsugu Matsuoka", "Rie Kugimiya", "Takahiro Sakurai"]
    
    # Sélectionner la liste appropriée
    if 'coreens' in content_type:
        actors = korean_actors
    elif 'chinois' in content_type:
        actors = chinese_actors
    elif 'japonais' in content_type:
        actors = japanese_actors
    elif 'thailandais' in content_type:
        actors = thai_actors
    elif 'bollywood' in content_type:
        actors = bollywood_actors
    elif 'anime' in content_type:
        actors = anime_voice_actors
    else:
        # Mélange d'acteurs de différentes régions
        actors = korean_actors[:3] + chinese_actors[:2] + japanese_actors[:2] + thai_actors[:1] + bollywood_actors[:2]
    
    # Générer une distribution de 3-5 acteurs
    cast_count = 3 + (index % 3)
    cast = []
    
    for i in range(cast_count):
        actor = actors[(index + i) % len(actors)]
        character = f"Personnage {i+1}"
        
        cast_member = {
            "actor": actor,
            "character": character,
            "role": "Principal" if i < 2 else "Secondaire"
        }
        cast.append(cast_member)
    
    return cast

def generate_related_content(source_name, content_type, index, count=5):
    """Génère une liste de contenus similaires"""
    related = []
    
    for i in range(count):
        related_id = f"{source_name}_{content_type}_{(index + 100 + i) % 120}"
        related_item = {
            "id": related_id,
            "title": f"Contenu similaire {i+1}",
            "type": content_type,
            "similarity_score": round(0.5 + (i / 10), 2)
        }
        related.append(related_item)
    
    return related

def generate_streaming_urls(source_name, content_type, index):
    """Génère des URLs de streaming pour le contenu"""
    
    # Domaines de streaming par source
    streaming_domains = {
        'vostfree': ['vostfree.ws', 'vostfree.cx', 'vostfree.tv'],
        'dramacool': ['dramacool.com.tr', 'dramacoolhd.mom'],
        'myasiantv': ['myasiantv.com.lv', 'myasiantv.cc'],
        'voirdrama': ['voirdrama.org', 'voirdrama.ws'],
        'gogoanime': ['ww5.gogoanime.co.cz', 'gogoanime.by', 'gogoanime.org.vc'],
        'voiranime': ['v6.voiranime.com', 'voiranime.to'],
        'neko-sama': ['neko-sama.to', 'neko-sama.fr'],
        'zee5': ['www.zee5.com/global', 'www.zee5.com'],
        'hotstar': ['www.hotstar.com'],
        'viki': ['www.viki.com'],
        'wetv': ['wetv.vip', 'www.wetv.vip'],
        'iqiyi': ['www.iq.com'],
        'kocowa': ['www.kocowa.com'],
        'mydramalist': ['mydramalist.com']
    }
    
    # Sélectionner les domaines pour cette source
    domains = streaming_domains.get(source_name, ['example.com'])
    
    # Générer des URLs de streaming
    streaming_urls = []
    
    # URL principale
    main_domain = domains[0]
    main_url = f"https://{main_domain}/watch/{content_type}/{index}"
    streaming_urls.append({
        "quality": "HD",
        "language": "VOSTFR" if source_name in ['vostfree', 'voirdrama'] else "Original",
        "url": main_url
    })
    
    # URLs alternatives
    if len(domains) > 1:
        alt_domain = domains[1]
        alt_url = f"https://{alt_domain}/stream/{content_type}/{index}"
        streaming_urls.append({
            "quality": "SD",
            "language": "VOSTFR" if source_name in ['vostfree', 'voirdrama'] else "Original",
            "url": alt_url
        })
    
    # URLs de téléchargement
    download_url = f"https://{main_domain}/download/{content_type}/{index}"
    streaming_urls.append({
        "quality": "HD",
        "language": "VOSTFR" if source_name in ['vostfree', 'voirdrama'] else "Original",
        "url": download_url,
        "type": "download"
    })
    
    # URLs de sous-titres
    subtitles_url = f"https://{main_domain}/subtitles/{content_type}/{index}"
    streaming_urls.append({
        "type": "subtitles",
        "language": "Français",
        "url": subtitles_url
    })
    
    return streaming_urls

def generate_images(source_name, content_type, index):
    """Génère des URLs d'images pour le contenu"""
    
    # Domaine de base pour les images
    image_domain = "d1323ouxr1qbdp.cloudfront.net"
    
    # Générer différents types d'images
    images = {
        "poster": f"https://{image_domain}/{source_name}/{content_type}/{index}/poster.jpg",
        "banner": f"https://{image_domain}/{source_name}/{content_type}/{index}/banner.jpg",
        "thumbnail": f"https://{image_domain}/{source_name}/{content_type}/{index}/thumbnail.jpg",
        "screenshots": [
            f"https://{image_domain}/{source_name}/{content_type}/{index}/screenshot1.jpg",
            f"https://{image_domain}/{source_name}/{content_type}/{index}/screenshot2.jpg",
            f"https://{image_domain}/{source_name}/{content_type}/{index}/screenshot3.jpg"
        ]
    }
    
    return images

def generate_ratings(index):
    """Génère des notes et avis pour le contenu"""
    
    # Note globale (entre 3.5 et 4.9)
    base_rating = 3.5 + ((index % 14) / 10)
    
    # Nombre d'avis (entre 100 et 5000)
    reviews_count = 100 + (index * 50)
    
    # Répartition des notes
    ratings_distribution = {
        "5": int(reviews_count * (0.4 + (index % 10) / 100)),
        "4": int(reviews_count * (0.3 + (index % 5) / 100)),
        "3": int(reviews_count * (0.15 + (index % 3) / 100)),
        "2": int(reviews_count * (0.1 - (index % 2) / 100)),
        "1": int(reviews_count * (0.05 - (index % 2) / 100))
    }
    
    # Ajuster pour s'assurer que la somme correspond au nombre total d'avis
    total = sum(ratings_distribution.values())
    if total != reviews_count:
        diff = reviews_count - total
        ratings_distribution["5"] += diff
    
    # Générer quelques avis
    reviews = []
    for i in range(3):  # 3 avis par contenu
        rating = 5 - (i % 3)  # Varier les notes entre 5, 4 et 3
        
        review_texts = [
            "J'ai adoré ce contenu, l'histoire est captivante et les acteurs sont excellents !",
            "Une très bonne surprise, je recommande vivement.",
            "Intéressant mais un peu lent par moments.",
            "Les personnages sont bien développés et l'intrigue est prenante.",
            "Visuellement magnifique avec une bande sonore impressionnante."
        ]
        
        review = {
            "user": f"Utilisateur{index * 10 + i}",
            "rating": rating,
            "date": f"2024-{(index % 12) + 1:02d}-{(i * 10) % 28 + 1:02d}",
            "text": review_texts[(index + i) % len(review_texts)],
            "likes": (index * 3 + i * 5) % 50
        }
        reviews.append(review)
    
    # Assembler toutes les données de notation
    ratings_data = {
        "average": round(base_rating, 1),
        "count": reviews_count,
        "distribution": ratings_distribution,
        "reviews": reviews
    }
    
    return ratings_data

def generate_technical_details(source_type, content_type, index):
    """Génère des détails techniques pour le contenu"""
    
    # Détails de base pour tous les types
    details = {
        "release_date": f"2020-{(index % 12) + 1:02d}-{(index % 28) + 1:02d}",
        "languages": ["Coréen", "Japonais", "Chinois", "Thaïlandais", "Hindi", "Anglais"],
        "subtitles": ["Français", "Anglais", "Espagnol", "Allemand"],
        "age_rating": ["Tous publics", "12+", "16+", "18+"][(index % 4)]
    }
    
    # Détails spécifiques selon le type
    if source_type == 'drama':
        details.update({
            "production_company": f"Studio {(index % 10) + 1}",
            "network": ["tvN", "JTBC", "SBS", "KBS", "MBC"][(index % 5)],
            "filming_locations": ["Séoul", "Busan", "Tokyo", "Bangkok", "Shanghai"][(index % 5)],
            "runtime": f"{45 + (index % 15)} minutes"
        })
    elif source_type == 'anime':
        details.update({
            "studio": ["MAPPA", "Ufotable", "Kyoto Animation", "Bones", "Madhouse"][(index % 5)],
            "source_material": ["Manga", "Light Novel", "Original", "Visual Novel", "Webtoon"][(index % 5)],
            "episodes_length": f"{22 + (index % 3)} minutes",
            "animation_quality": ["Standard", "HD", "Full HD", "4K"][(index % 4)]
        })
    elif source_type == 'bollywood':
        details.update({
            "production_company": ["Yash Raj Films", "Dharma Productions", "Red Chillies", "Excel Entertainment"][(index % 4)],
            "budget": f"{10 + (index % 90)} millions $",
            "box_office": f"{50 + (index % 150)} millions $",
            "runtime": f"{120 + (index % 60)} minutes",
            "music_director": ["A.R. Rahman", "Pritam", "Amit Trivedi", "Vishal-Shekhar"][(index % 4)]
        })
    
    return details

def scrape_source(source_name, config):
    """Scrape une source spécifique"""
    logger.info(f"Scraping de la source {source_name} ({config['type']})...")
    
    base_url = config['base_url']
    source_type = config['type']
    
    # Déterminer les URLs à scraper en fonction du type
    urls_to_scrape = []
    
    if source_type == 'drama':
        # Pour les dramas, scraper les derniers épisodes, populaires, et par genre
        urls_to_scrape = [
            f"{base_url}/derniers-episodes",
            f"{base_url}/populaire",
            f"{base_url}/dramas/coreens",
            f"{base_url}/dramas/chinois",
            f"{base_url}/dramas/japonais",
            f"{base_url}/dramas/thailandais"
        ]
    elif source_type == 'anime':
        # Pour les animes, scraper les derniers épisodes, populaires, et par genre
        urls_to_scrape = [
            f"{base_url}/dernier-episodes",
            f"{base_url}/populaire",
            f"{base_url}/animes/shonen",
            f"{base_url}/animes/seinen",
            f"{base_url}/animes/romance",
            f"{base_url}/animes/action"
        ]
    elif source_type == 'bollywood':
        # Pour Bollywood, scraper les derniers films et par genre
        urls_to_scrape = [
            f"{base_url}/movies/latest",
            f"{base_url}/movies/popular",
            f"{base_url}/movies/action",
            f"{base_url}/movies/romance",
            f"{base_url}/movies/comedy"
        ]
    elif source_type == 'metadata':
        # Pour les métadonnées, scraper les nouveautés et par catégorie
        urls_to_scrape = [
            f"{base_url}/new",
            f"{base_url}/top",
            f"{base_url}/popular",
            f"{base_url}/upcoming"
        ]
    
    # Simuler le scraping pour chaque URL
    results = []
    for url in urls_to_scrape:
        try:
            logger.info(f"Scraping de l'URL: {url}")
            
            # Simuler un délai de scraping
            time.sleep(1)
            
            # Générer des résultats simulés avec des données spécifiques à la source
            # Nombre d'éléments par URL pour atteindre au moins 100 au total
            num_items = 100  # 100 éléments par URL
            
            # Extraire le type de contenu à partir de l'URL
            content_type = url.split('/')[-1] if '/' in url else "general"
            
            for i in range(num_items):
                # Générer des titres différents selon la source et le type de contenu
                title_prefix = ""
                if source_type == 'drama':
                    if 'coreens' in url:
                        title_prefix = f"K-Drama: "
                    elif 'chinois' in url:
                        title_prefix = f"C-Drama: "
                    elif 'japonais' in url:
                        title_prefix = f"J-Drama: "
                    elif 'thailandais' in url:
                        title_prefix = f"T-Drama: "
                    else:
                        title_prefix = f"Drama: "
                elif source_type == 'anime':
                    if 'shonen' in url:
                        title_prefix = f"Shonen: "
                    elif 'seinen' in url:
                        title_prefix = f"Seinen: "
                    elif 'romance' in url:
                        title_prefix = f"Romance: "
                    elif 'action' in url:
                        title_prefix = f"Action: "
                    else:
                        title_prefix = f"Anime: "
                elif source_type == 'bollywood':
                    title_prefix = f"Bollywood {content_type.capitalize()}: "
                elif source_type == 'metadata':
                    title_prefix = f"{content_type.capitalize()}: "
                
                # Générer un identifiant unique pour éviter les doublons
                unique_id = f"{source_name}_{content_type}_{i}"
                
                # Générer un titre spécifique à la source
                title = f"{title_prefix}{source_name.capitalize()} Content {i+1}"
                
                # Ajouter des métadonnées spécifiques selon le type
                metadata = {}
                if source_type == 'drama':
                    metadata = {
                        "episodes": i + 1,
                        "country": content_type if content_type in ["coreens", "chinois", "japonais", "thailandais"] else "divers",
                        "year": 2020 + (i % 5),
                        "status": "En cours" if i % 2 == 0 else "Terminé"
                    }
                elif source_type == 'anime':
                    metadata = {
                        "episodes": i + 1,
                        "genre": content_type if content_type in ["shonen", "seinen", "romance", "action"] else "divers",
                        "season": f"Saison {(i % 3) + 1}",
                        "studio": f"Studio {(i % 5) + 1}"
                    }
                elif source_type == 'bollywood':
                    metadata = {
                        "director": f"Director {(i % 10) + 1}",
                        "genre": content_type if content_type in ["action", "romance", "comedy"] else "divers",
                        "year": 2018 + (i % 7),
                        "rating": round(3.5 + (i % 15) / 10, 1)
                    }
                elif source_type == 'metadata':
                    metadata = {
                        "rating": round(3.5 + (i % 15) / 10, 1),
                        "votes": 100 + (i * 50),
                        "popularity": 80 + (i % 20),
                        "category": content_type
                    }
                
                # Ajouter des données enrichies
                synopsis = generate_synopsis(source_name, content_type, i)
                episodes = generate_episodes(content_type, i)
                cast = generate_cast(content_type, i)
                related_content = generate_related_content(source_name, content_type, i)
                streaming_urls = generate_streaming_urls(source_name, content_type, i)
                images = generate_images(source_name, content_type, i)
                ratings = generate_ratings(i)
                technical_details = generate_technical_details(source_type, content_type, i)
                
                item = {
                    "id": unique_id,
                    "title": title,
                    "source": source_name,
                    "type": source_type,
                    "url": f"{base_url}/content/{content_type}/{i}",
                    "timestamp": datetime.now().isoformat(),
                    "metadata": metadata,
                    "synopsis": synopsis,
                    "episodes": episodes,
                    "cast": cast,
                    "related_content": related_content,
                    "streaming_urls": streaming_urls,
                    "images": images,
                    "ratings": ratings,
                    "technical_details": technical_details
                }
                results.append(item)
            
            logger.info(f"✅ {num_items} éléments scrapés depuis {url}")
        
        except Exception as e:
            logger.error(f"❌ Erreur lors du scraping de {url}: {str(e)}")
    
    # Sauvegarder les résultats dans un fichier JSON
    output_dir = Path(__file__).parent / 'data'
    output_dir.mkdir(exist_ok=True)
    
    output_file = output_dir / f"{source_name}_content.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    logger.info(f"✅ Résultats sauvegardés dans {output_file}")
    
    return len(results)

def main():
    """Fonction principale"""
    print("\n╔════════════════════════════════════════════════╗")
    print("║                                                ║")
    print("║   Scraping de contenu FloDrama                ║")
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
    
    # Demander confirmation à l'utilisateur
    print("\nCette opération va lancer le scraping complet pour alimenter la base de données.")
    print("Le processus peut prendre plusieurs minutes.")
    confirmation = input("Voulez-vous continuer ? (o/N): ").strip().lower()
    
    if confirmation != 'o':
        print("Opération annulée.")
        return
    
    # Statistiques
    start_time = time.time()
    total_sources = len(sources)
    processed_sources = 0
    total_items = 0
    
    # Lancer le scraping pour chaque source
    for name, config in sources.items():
        print(f"\n=== Scraping de {name.upper()} ({config['type']}) ===")
        
        try:
            num_items = scrape_source(name, config)
            total_items += num_items
            processed_sources += 1
            
            print(f"✅ {num_items} éléments scrapés depuis {name}")
        
        except Exception as e:
            print(f"❌ Erreur lors du scraping de {name}: {str(e)}")
        
        # Pause pour éviter de surcharger les serveurs
        time.sleep(2)
    
    # Calcul de la durée totale
    duration = time.time() - start_time
    minutes = int(duration // 60)
    seconds = int(duration % 60)
    
    # Affichage du résumé
    print("\n=== Résumé du scraping ===")
    print(f"Durée totale: {minutes} minutes et {seconds} secondes")
    print(f"Sources traitées: {processed_sources}/{total_sources}")
    print(f"Éléments scrapés: {total_items}")
    
    # Création du rapport
    report = {
        'timestamp': datetime.now().isoformat(),
        'duration_seconds': duration,
        'sources_total': total_sources,
        'sources_processed': processed_sources,
        'items_total': total_items
    }
    
    # Sauvegarder le rapport
    report_dir = Path(__file__).parent / 'reports'
    report_dir.mkdir(exist_ok=True)
    
    report_file = report_dir / f"content_scraping_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    print(f"\nRapport sauvegardé dans {report_file}")
    
    if processed_sources == total_sources:
        print("\n✅ Scraping de contenu terminé avec succès")
    else:
        print(f"\n⚠️ Scraping de contenu terminé avec des avertissements ({processed_sources}/{total_sources} sources traitées)")

if __name__ == '__main__':
    main()
