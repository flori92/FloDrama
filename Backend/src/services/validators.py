"""
Validateurs pour les données du service de scraping
"""

from typing import Dict, List, Optional
from datetime import datetime
import re
from urllib.parse import urlparse

from .exceptions import MetadataValidationError
from ..config.scraping_config import (
    METADATA_VALIDATION,
    ALLOWED_STREAMING_DOMAINS,
    GENRES_MAPPING
)

class ContentValidator:
    """Validateur pour les métadonnées de contenu"""

    @staticmethod
    def validate_metadata(metadata: Dict) -> Dict:
        """Valide et nettoie les métadonnées du contenu"""
        errors = {}

        # Validation des champs requis
        for field in METADATA_VALIDATION['required_fields']:
            if not metadata.get(field):
                errors[field] = f"Le champ {field} est requis"

        # Validation du titre
        title = metadata.get('title', '')
        if title:
            if len(title) < METADATA_VALIDATION['min_title_length']:
                errors['title'] = f"Le titre doit contenir au moins {METADATA_VALIDATION['min_title_length']} caractères"
            elif len(title) > METADATA_VALIDATION['max_title_length']:
                errors['title'] = f"Le titre ne doit pas dépasser {METADATA_VALIDATION['max_title_length']} caractères"

        # Validation de la description
        description = metadata.get('description', '')
        if description and len(description) < METADATA_VALIDATION['min_description_length']:
            errors['description'] = f"La description doit contenir au moins {METADATA_VALIDATION['min_description_length']} caractères"

        # Validation des URLs de streaming
        streaming_urls = metadata.get('streaming_urls', [])
        if streaming_urls:
            valid_urls = []
            for url_data in streaming_urls:
                if ContentValidator.validate_streaming_url(url_data.get('url', '')):
                    valid_urls.append(url_data)
            if not valid_urls:
                errors['streaming_urls'] = "Aucune URL de streaming valide trouvée"
            metadata['streaming_urls'] = valid_urls

        # Validation du score de qualité
        quality_score = metadata.get('quality_score', 0)
        if quality_score < METADATA_VALIDATION['min_quality_score']:
            errors['quality_score'] = f"Le score de qualité ({quality_score}) est inférieur au minimum requis ({METADATA_VALIDATION['min_quality_score']})"

        # Si des erreurs sont trouvées, lever une exception
        if errors:
            raise MetadataValidationError(
                "Validation des métadonnées échouée",
                validation_errors=errors,
                source=metadata.get('source')
            )

        # Nettoyage et normalisation des données
        cleaned_metadata = ContentValidator.clean_metadata(metadata)
        return cleaned_metadata

    @staticmethod
    def validate_streaming_url(url: str) -> bool:
        """Valide une URL de streaming"""
        if not url:
            return False

        try:
            parsed_url = urlparse(url)
            if not parsed_url.scheme or not parsed_url.netloc:
                return False
            
            # Vérification du domaine
            domain = parsed_url.netloc.lower()
            return any(allowed_domain in domain for allowed_domain in ALLOWED_STREAMING_DOMAINS)
        except:
            return False

    @staticmethod
    def clean_metadata(metadata: Dict) -> Dict:
        """Nettoie et normalise les métadonnées"""
        cleaned = metadata.copy()

        # Nettoyage du titre
        if 'title' in cleaned:
            cleaned['title'] = cleaned['title'].strip()

        # Nettoyage de la description
        if 'description' in cleaned:
            cleaned['description'] = cleaned['description'].strip()

        # Normalisation des genres
        if 'genres' in cleaned and cleaned['genres']:
            normalized_genres = []
            for genre in cleaned['genres']:
                genre_lower = genre.lower()
                for main_genre, aliases in GENRES_MAPPING.items():
                    if genre_lower in aliases or genre_lower == main_genre:
                        normalized_genres.append(main_genre)
                        break
            cleaned['genres'] = list(set(normalized_genres))

        # Normalisation de l'année
        if 'year' in cleaned and cleaned['year']:
            try:
                year = int(cleaned['year'])
                current_year = datetime.now().year
                if 1900 <= year <= current_year:
                    cleaned['year'] = year
                else:
                    del cleaned['year']
            except (ValueError, TypeError):
                del cleaned['year']

        # Normalisation du rating
        if 'rating' in cleaned and cleaned['rating'] is not None:
            try:
                rating = float(cleaned['rating'])
                cleaned['rating'] = min(max(rating, 0.0), 10.0)
            except (ValueError, TypeError):
                del cleaned['rating']

        # Normalisation des épisodes
        if 'episodes' in cleaned and cleaned['episodes']:
            try:
                episodes = int(cleaned['episodes'])
                if episodes > 0:
                    cleaned['episodes'] = episodes
                else:
                    del cleaned['episodes']
            except (ValueError, TypeError):
                del cleaned['episodes']

        # Normalisation de la durée
        if 'duration' in cleaned and cleaned['duration']:
            duration_str = cleaned['duration']
            # Conversion en minutes si nécessaire
            if isinstance(duration_str, str):
                minutes = ContentValidator.parse_duration(duration_str)
                if minutes:
                    cleaned['duration'] = f"{minutes} min"
                else:
                    del cleaned['duration']

        # Ajout de la date de mise à jour
        cleaned['last_updated'] = datetime.now().isoformat()

        return cleaned

    @staticmethod
    def parse_duration(duration_str: str) -> Optional[int]:
        """Convertit une chaîne de durée en minutes"""
        try:
            # Recherche des heures et minutes
            hours_match = re.search(r'(\d+)\s*h', duration_str.lower())
            minutes_match = re.search(r'(\d+)\s*min', duration_str.lower())
            
            total_minutes = 0
            if hours_match:
                total_minutes += int(hours_match.group(1)) * 60
            if minutes_match:
                total_minutes += int(minutes_match.group(1))
                
            return total_minutes if total_minutes > 0 else None
        except:
            return None
