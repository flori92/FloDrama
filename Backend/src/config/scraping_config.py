"""
Configuration pour le service de scraping de FloDrama
"""

# Configuration des sources de streaming
STREAMING_SOURCES = {
    'vostfree': {
        'base_url': 'https://vostfree.ws',
        'fallback_urls': [
            'https://vostfree.cx',
            'https://vostfree.tv'
        ],
        'search_url': '{base_url}/recherche',
        'latest_url': '{base_url}/derniers-episodes',
        'popular_url': '{base_url}/populaire',
        'type': 'drama',
        'selectors': {
            'title': 'h1.title',
            'poster': 'div.poster img',
            'info': 'div.info',
            'player': 'div.player',
            'episodes': 'div.episodes-list'
        }
    },
    'dramacool': {
        'base_url': 'https://dramacool.com.tr',
        'fallback_urls': [
            'https://dramacoolhd.mom'
        ],
        'search_url': '{base_url}/search',
        'latest_url': '{base_url}/recently-added',
        'popular_url': '{base_url}/most-popular-drama',
        'type': 'drama',
        'selectors': {
            'title': 'h1.title',
            'poster': 'div.poster img',
            'info': 'div.info',
            'player': 'div#player',
            'episodes': 'div.episodes'
        }
    },
    'myasiantv': {
        'base_url': 'https://myasiantv.com.lv',
        'search_url': '{base_url}/search',
        'latest_url': '{base_url}/recently-added',
        'popular_url': '{base_url}/most-popular',
        'type': 'drama',
        'selectors': {
            'title': 'h1.title',
            'poster': 'div.poster img',
            'info': 'div.info',
            'player': 'div#video-player',
            'episodes': 'div.episodes'
        }
    },
    'dramaday': {
        'base_url': 'http://dramaday.net',
        'search_url': '{base_url}',
        'latest_url': '{base_url}/latest',
        'popular_url': '{base_url}/popular',
        'type': 'drama',
        'selectors': {
            'title': 'h1.entry-title',
            'poster': 'div.poster img',
            'info': 'div.info',
            'player': 'div.player',
            'episodes': 'div.episodes'
        }
    },
    'mydramalist': {
        'base_url': 'https://mydramalist.com',
        'search_url': '{base_url}/search',
        'latest_url': '{base_url}/new',
        'popular_url': '{base_url}/popular',
        'type': 'metadata',  # Cette source est utilisée uniquement pour les métadonnées
        'selectors': {
            'title': 'h1.title',
            'poster': 'div.poster img',
            'info': 'div.box-body',
            'rating': 'div.score',
            'details': 'div.show-details'
        }
    },
    'gogoanime': {
        'base_url': 'https://ww5.gogoanime.co.cz',
        'fallback_urls': [
            'https://gogoanime.by',
            'https://ww27.gogoanimes.fi',
            'https://gogoanime.org.vc'
        ],
        'search_url': '{base_url}/search.html',
        'latest_url': '{base_url}/new-season.html',
        'popular_url': '{base_url}/popular.html',
        'type': 'anime',
        'selectors': {
            'title': 'div.anime_info_body h1',
            'poster': 'div.anime_info_body_bg img',
            'info': 'div.anime_info_body',
            'player': 'div#player',
            'episodes': 'ul#episode_page'
        }
    },
    'voiranime': {
        'base_url': 'https://v6.voiranime.com',
        'search_url': '{base_url}/recherche',
        'latest_url': '{base_url}/dernier-episodes',
        'popular_url': '{base_url}/populaire',
        'type': 'anime',
        'selectors': {
            'title': 'h1.title',
            'poster': 'div.poster img',
            'info': 'div.info',
            'player': 'div#player',
            'episodes': 'div.episodes'
        }
    },
    'neko-sama': {
        'base_url': 'https://neko-sama.to',
        'search_url': '{base_url}/recherche',
        'latest_url': '{base_url}/dernier',
        'popular_url': '{base_url}/populaire',
        'type': 'anime',
        'selectors': {
            'title': 'h1.title',
            'poster': 'div.poster img',
            'info': 'div.info',
            'player': 'div#player',
            'episodes': 'div.episodes'
        }
    },
    'zee5': {
        'base_url': 'https://www.zee5.com/global',
        'fallback_urls': [
            'https://www.zee5.com'
        ],
        'search_url': '{base_url}/search',
        'latest_url': '{base_url}/movies/latest',
        'popular_url': '{base_url}/collections/free-bollywood-movies/0-8-2429',
        'type': 'bollywood',
        'api_path': '/collections/free-bollywood-movies/0-8-2429',
        'selectors': {
            'title': 'h1.title',
            'poster': 'div.poster img',
            'info': 'div.info',
            'player': 'div#player',
            'episodes': 'div.episodes'
        }
    },
    'hotstar': {
        'base_url': 'https://www.hotstar.com',
        'search_url': '{base_url}/in/search',
        'latest_url': '{base_url}/in/movies/latest',
        'popular_url': '{base_url}/in/movies/popular',
        'type': 'bollywood',
        'selectors': {
            'title': 'h1.title',
            'poster': 'div.poster img',
            'info': 'div.info',
            'player': 'div#player',
            'episodes': 'div.episodes'
        }
    }
}

# Liste des domaines de streaming autorisés
ALLOWED_STREAMING_DOMAINS = [
    'vostfree.ws',
    'vostfree.cx',
    'vostfree.tv',
    'dramacool.com.tr',
    'myasiantv.com.lv',
    'dramacoolhd.mom',
    'ww5.gogoanime.co.cz',
    'v6.voiranime.com',
    'neko-sama.to',
    'gogoanime.by',
    'ww27.gogoanimes.fi',
    'gogoanime.org.vc',
    'dramabus.cx',
    'voirdrama.org',
    'dramaday.net',
    'mydramalist.com',
    'www.zee5.com/global',
    'www.zee5.com',
    'streamtape.com',
    'vidstream.pro',
    'fembed.com',
    'mycloud.to',
    'hydrax.net'
]

# Configuration des headers HTTP
HTTP_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0'
}

# Patterns pour la détection de qualité
QUALITY_PATTERNS = {
    '1080p': r'1080[pP]|FHD|FULLHD|HIGH',
    '720p': r'720[pP]|HD',
    '480p': r'480[pP]|SD',
    '360p': r'360[pP]|LOW'
}

# Configuration de la validation des métadonnées
METADATA_VALIDATION = {
    'required_fields': [
        'title',
        'poster_url',
        'streaming_urls'
    ],
    'min_title_length': 3,
    'max_title_length': 200,
    'min_description_length': 10,
    'min_quality_score': 50.0
}

# Configuration des retries
RETRY_CONFIG = {
    'max_retries': 3,
    'retry_delay': 5,  # secondes
    'retry_codes': [500, 502, 503, 504, 522]  # Ajout du code 522
}

# Configuration des genres
GENRES_MAPPING = {
    'action': ['action', 'martial arts', 'thriller', 'action & adventure'],
    'romance': ['romance', 'romantic comedy', 'melodrama', 'love story'],
    'comedy': ['comedy', 'sitcom', 'humour', 'comédie'],
    'drama': ['drama', 'melodrama', 'drame'],
    'fantasy': ['fantasy', 'supernatural', 'fantastique', 'magic'],
    'historical': ['historical', 'period drama', 'historique', 'saeguk'],
    'horror': ['horror', 'thriller', 'horreur', 'épouvante'],
    'mystery': ['mystery', 'crime', 'mystère', 'detective'],
    'psychological': ['psychological', 'psychologique', 'mind games'],
    'school': ['school', 'campus', 'école', 'college'],
    'sci-fi': ['sci-fi', 'science fiction', 'science-fiction'],
    'slice of life': ['slice of life', 'daily life', 'vie quotidienne'],
    'sports': ['sports', 'sport'],
    'adventure': ['adventure', 'aventure'],
    'anime': ['anime', 'animation japonaise'],
    'bollywood': ['bollywood', 'indian', 'indien'],
    'chinese': ['chinese', 'chinois', 'c-drama'],
    'japanese': ['japanese', 'japonais', 'j-drama'],
    'korean': ['korean', 'coréen', 'k-drama'],
    'taiwanese': ['taiwanese', 'taïwanais', 't-drama'],
    'musical': ['musical', 'musique', 'dance', 'song']
}

# Configuration du cache
CACHE_CONFIG = {
    'metadata_ttl': 86400,  # 24 heures
    'streaming_urls_ttl': 3600,  # 1 heure
    'search_results_ttl': 1800  # 30 minutes
}

# Configuration du rate limiting
RATE_LIMIT = {
    'requests_per_minute': 30,
    'requests_per_hour': 500,
    'concurrent_requests': 5
}

# Configuration des timeouts
TIMEOUT_CONFIG = {
    'connect': 10,  # secondes
    'read': 30,
    'total': 60
}
