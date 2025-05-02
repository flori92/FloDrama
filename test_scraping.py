#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de test pour vérifier le fonctionnement du scraping avec Supabase
Ce script teste l'insertion d'un contenu simple dans Supabase
"""

import os
import json
import time
import uuid
from datetime import datetime
from dotenv import load_dotenv

# Chargement des variables d'environnement
load_dotenv()

# Import des modules Supabase
from supabase import create_client

# Configuration Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

print(f"URL Supabase: {SUPABASE_URL}")
print(f"Clé Supabase: {SUPABASE_KEY[:10]}...{SUPABASE_KEY[-5:]}")

# Initialisation du client Supabase
client = create_client(SUPABASE_URL, SUPABASE_KEY)
print("✅ Client Supabase initialisé")

# Test de l'accès au bucket via API REST
try:
    import requests
    
    bucket_name = os.getenv('SUPABASE_STORAGE_BUCKET', 'flodrama-images')
    print(f"Test d'accès au bucket: {bucket_name}")
    
    response = requests.get(
        f"{SUPABASE_URL}/storage/v1/bucket/{bucket_name}",
        headers={
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "apikey": SUPABASE_KEY
        }
    )
    
    print(f"Statut de la réponse: {response.status_code}")
    if response.status_code == 200:
        print(f"✅ Bucket {bucket_name} accessible")
        print(f"Détails: {response.json()}")
    else:
        print(f"❌ Bucket {bucket_name} non accessible")
        print(f"Erreur: {response.text}")
except Exception as e:
    print(f"❌ Erreur lors du test d'accès au bucket: {str(e)}")

# Test d'insertion dans la table dramas
try:
    print("\nTest d'insertion dans la table dramas")
    
    # Création d'un drama de test avec les champs corrects selon le schéma
    test_drama = {
        "id": str(uuid.uuid4()),
        "title": f"Test Drama {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "original_title": "테스트 드라마",
        "poster": "https://example.com/test-drama.jpg",  # Champ correct: poster (pas poster_url)
        "backdrop": "https://example.com/test-drama-backdrop.jpg",  # Champ correct: backdrop (pas backdrop_url)
        "year": 2025,
        "rating": 8.5,
        "language": "Coréen",
        "description": "Un drama de test pour vérifier l'insertion dans Supabase",
        "genres": ["Test", "Comédie"],
        "episodes_count": 16,  # Champ correct: episodes_count (pas episodes)
        "duration": 60,
        "country": "Corée du Sud",
        "source_url": "https://example.com/test-drama",  # Champ correct: source_url (pas url)
        "trailer_url": "https://example.com/test-drama-trailer",
        "watch_url": "https://example.com/test-drama-watch",
        "status": "Terminé",
        "actors": ["Acteur Test 1", "Actrice Test 2"],
        "director": "Directeur Test",
        "studio": "Studio Test",
        "tags": ["Test", "Drame", "Romance"],
        "popularity": 100,
        "season": 1,
        "related_content": [],
        "similar_content": [],
        "age_rating": "16+",
        "has_subtitles": True,
        "is_featured": False,
        "is_trending": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "source": "test_script",
        "synopsis": "Un drama de test pour vérifier l'insertion dans Supabase",
        "image_url": "https://example.com/test-drama.jpg",
        "scraped_at": datetime.now().isoformat()
    }
    
    # Insertion dans la table dramas
    start_time = time.time()
    result = client.table("dramas").insert(test_drama).execute()
    elapsed = time.time() - start_time
    
    if result.data:
        print(f"✅ Insertion réussie (en {elapsed:.2f}s)")
        print(f"ID créé: {result.data[0]['id']}")
        
        # Vérification que le drama a bien été inséré
        check = client.table("dramas").select("*").eq("id", test_drama["id"]).execute()
        if check.data:
            print(f"✅ Vérification réussie: le drama est bien présent dans la base")
        else:
            print(f"❌ Vérification échouée: le drama n'est pas trouvé dans la base")
    else:
        print(f"❌ Insertion échouée")
        print(f"Erreur: {result}")
except Exception as e:
    print(f"❌ Erreur lors de l'insertion: {str(e)}")

# Test de récupération des dramas existants
try:
    print("\nTest de récupération des dramas existants")
    
    # Récupération des dramas
    start_time = time.time()
    result = client.table("dramas").select("id", "title", "source").limit(5).execute()
    elapsed = time.time() - start_time
    
    if result.data:
        print(f"✅ Récupération réussie (en {elapsed:.2f}s)")
        print(f"Nombre de dramas récupérés: {len(result.data)}")
        for drama in result.data:
            print(f"  - {drama['title']} (source: {drama['source']})")
    else:
        print(f"❌ Aucun drama trouvé")
except Exception as e:
    print(f"❌ Erreur lors de la récupération: {str(e)}")

print("\n✅ Tests terminés")
