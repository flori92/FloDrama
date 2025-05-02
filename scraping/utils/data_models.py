#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Modèles de données pour le scraping
Ce module définit les structures de données communes utilisées par tous les scripts de scraping
"""

import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional, Union

def create_drama_model(
    title: str,
    source: str,
    source_url: str = "",
    original_title: str = "",
    poster: str = "",
    backdrop: str = "",
    year: Optional[int] = None,
    rating: Optional[float] = None,
    language: str = "",
    description: str = "",
    genres: List[str] = None,
    episodes_count: Optional[int] = None,
    duration: Optional[int] = None,
    country: str = "",
    trailer_url: str = "",
    watch_url: str = "",
    status: str = "",
    actors: List[str] = None,
    director: str = "",
    studio: str = "",
    tags: List[str] = None,
    popularity: Optional[int] = None,
    season: Optional[int] = None,
    age_rating: str = "",
    has_subtitles: bool = False,
    is_featured: bool = False,
    is_trending: bool = False,
    synopsis: str = "",
    image_url: str = ""
) -> Dict[str, Any]:
    """
    Crée un modèle de données pour un drama conforme au schéma de la table dramas dans Supabase
    
    Args:
        title (str): Titre du drama
        source (str): Source du drama (ex: 'mydramalist', 'voirdrama')
        source_url (str, optional): URL source du drama
        original_title (str, optional): Titre original du drama
        poster (str, optional): URL de l'affiche du drama
        backdrop (str, optional): URL de l'image de fond du drama
        year (int, optional): Année de sortie
        rating (float, optional): Note sur 10
        language (str, optional): Langue originale
        description (str, optional): Description courte
        genres (List[str], optional): Liste des genres
        episodes_count (int, optional): Nombre d'épisodes
        duration (int, optional): Durée en minutes
        country (str, optional): Pays d'origine
        trailer_url (str, optional): URL de la bande-annonce
        watch_url (str, optional): URL pour regarder
        status (str, optional): Statut (ex: 'En cours', 'Terminé')
        actors (List[str], optional): Liste des acteurs
        director (str, optional): Réalisateur
        studio (str, optional): Studio de production
        tags (List[str], optional): Tags associés
        popularity (int, optional): Score de popularité
        season (int, optional): Numéro de saison
        age_rating (str, optional): Classification par âge
        has_subtitles (bool, optional): Disponibilité des sous-titres
        is_featured (bool, optional): Mis en avant
        is_trending (bool, optional): Tendance actuelle
        synopsis (str, optional): Synopsis détaillé
        image_url (str, optional): URL de l'image principale
        
    Returns:
        Dict[str, Any]: Modèle de données conforme au schéma Supabase
    """
    # Initialisation des listes vides si None
    if genres is None:
        genres = []
    if actors is None:
        actors = []
    if tags is None:
        tags = []
    
    # Timestamp actuel
    now = datetime.now().isoformat()
    
    # Création du modèle
    return {
        "id": str(uuid.uuid4()),
        "title": title,
        "original_title": original_title,
        "poster": poster,
        "backdrop": backdrop,
        "year": year,
        "rating": rating,
        "language": language,
        "description": description,
        "genres": genres,
        "episodes_count": episodes_count,
        "duration": duration,
        "country": country,
        "source_url": source_url,
        "trailer_url": trailer_url,
        "watch_url": watch_url,
        "status": status,
        "actors": actors,
        "director": director,
        "studio": studio,
        "tags": tags,
        "popularity": popularity,
        "season": season,
        "related_content": [],
        "similar_content": [],
        "age_rating": age_rating,
        "has_subtitles": has_subtitles,
        "is_featured": is_featured,
        "is_trending": is_trending,
        "created_at": now,
        "updated_at": now,
        "source": source,
        "synopsis": synopsis,
        "image_url": image_url,
        "scraped_at": now
    }

def create_anime_model(
    title: str,
    source: str,
    source_url: str = "",
    original_title: str = "",
    poster: str = "",
    backdrop: str = "",
    year: Optional[int] = None,
    rating: Optional[float] = None,
    language: str = "Japonais",
    description: str = "",
    genres: List[str] = None,
    episodes_count: Optional[int] = None,
    duration: Optional[int] = None,
    country: str = "Japon",
    trailer_url: str = "",
    watch_url: str = "",
    status: str = "",
    actors: List[str] = None,
    director: str = "",
    studio: str = "",
    tags: List[str] = None,
    popularity: Optional[int] = None,
    season: Optional[int] = None,
    age_rating: str = "",
    has_subtitles: bool = True,
    is_featured: bool = False,
    is_trending: bool = False,
    synopsis: str = "",
    image_url: str = ""
) -> Dict[str, Any]:
    """
    Crée un modèle de données pour un anime conforme au schéma de la table animes dans Supabase
    Utilise les mêmes champs que le modèle drama avec des valeurs par défaut adaptées aux animes
    """
    # Utiliser le modèle drama avec des valeurs par défaut pour les animes
    return create_drama_model(
        title=title,
        source=source,
        source_url=source_url,
        original_title=original_title,
        poster=poster,
        backdrop=backdrop,
        year=year,
        rating=rating,
        language=language,
        description=description,
        genres=genres,
        episodes_count=episodes_count,
        duration=duration,
        country=country,
        trailer_url=trailer_url,
        watch_url=watch_url,
        status=status,
        actors=actors,
        director=director,
        studio=studio,
        tags=tags,
        popularity=popularity,
        season=season,
        age_rating=age_rating,
        has_subtitles=has_subtitles,
        is_featured=is_featured,
        is_trending=is_trending,
        synopsis=synopsis,
        image_url=image_url
    )

def create_movie_model(
    title: str,
    source: str,
    source_url: str = "",
    original_title: str = "",
    poster: str = "",
    backdrop: str = "",
    year: Optional[int] = None,
    rating: Optional[float] = None,
    language: str = "",
    description: str = "",
    genres: List[str] = None,
    duration: Optional[int] = None,
    country: str = "",
    trailer_url: str = "",
    watch_url: str = "",
    status: str = "Terminé",
    actors: List[str] = None,
    director: str = "",
    studio: str = "",
    tags: List[str] = None,
    popularity: Optional[int] = None,
    age_rating: str = "",
    has_subtitles: bool = False,
    is_featured: bool = False,
    is_trending: bool = False,
    synopsis: str = "",
    image_url: str = ""
) -> Dict[str, Any]:
    """
    Crée un modèle de données pour un film conforme au schéma de la table films dans Supabase
    Utilise les mêmes champs que le modèle drama avec des valeurs par défaut adaptées aux films
    """
    # Utiliser le modèle drama avec des valeurs par défaut pour les films
    return create_drama_model(
        title=title,
        source=source,
        source_url=source_url,
        original_title=original_title,
        poster=poster,
        backdrop=backdrop,
        year=year,
        rating=rating,
        language=language,
        description=description,
        genres=genres,
        episodes_count=1,  # Un film est considéré comme un seul épisode
        duration=duration,
        country=country,
        trailer_url=trailer_url,
        watch_url=watch_url,
        status=status,
        actors=actors,
        director=director,
        studio=studio,
        tags=tags,
        popularity=popularity,
        season=None,  # Les films n'ont pas de saison
        age_rating=age_rating,
        has_subtitles=has_subtitles,
        is_featured=is_featured,
        is_trending=is_trending,
        synopsis=synopsis,
        image_url=image_url
    )
