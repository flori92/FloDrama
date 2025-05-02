#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de test pour l'insertion de données dans Supabase
Ce script crée et insère un drama de test dans la base de données
"""

import os
import time
import uuid
from datetime import datetime
from dotenv import load_dotenv

# Chargement des variables d'environnement
load_dotenv()

# Import des modules Supabase
try:
    from scraping.utils.supabase_database import supabase_db
    from scraping.utils.data_models import create_drama_model
except ImportError:
    # En cas d'import direct depuis le dossier racine
    import sys
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from scraping.utils.supabase_database import supabase_db
    from scraping.utils.data_models import create_drama_model

print("🔍 Test d'insertion d'un drama dans Supabase")
print("-" * 50)

# Création d'un drama de test
test_drama = create_drama_model(
    title=f"Drama de Test {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
    source="test_script",
    source_url="https://example.com/test-drama",
    original_title="테스트 드라마",
    poster="https://via.placeholder.com/300x450.png?text=Test+Drama",
    backdrop="https://via.placeholder.com/1280x720.png?text=Test+Drama+Backdrop",
    year=2025,
    rating=8.5,
    language="Coréen",
    description="Un drama de test pour vérifier l'insertion dans Supabase",
    genres=["Test", "Comédie", "Romance"],
    episodes_count=16,
    duration=60,
    country="Corée du Sud",
    trailer_url="https://example.com/test-drama-trailer",
    watch_url="https://example.com/test-drama-watch",
    status="En cours",
    actors=["Acteur Test 1", "Actrice Test 2"],
    director="Directeur Test",
    studio="Studio Test",
    tags=["Test", "Drame", "Romance"],
    popularity=100,
    season=1,
    age_rating="16+",
    has_subtitles=True,
    is_featured=False,
    is_trending=True,
    synopsis="Un drama de test créé pour vérifier que l'insertion dans Supabase fonctionne correctement. Ce drama n'existe pas réellement et est uniquement utilisé à des fins de test."
)

print(f"Drama de test créé: {test_drama['title']}")

# Enregistrement de la session de scraping
session_id = supabase_db.log_scraping_start('dramas', 'test_script')
print(f"Session de scraping créée avec l'ID: {session_id}")

# Insertion du drama dans Supabase
start_time = time.time()
result = supabase_db.store_content('dramas', test_drama)
elapsed = time.time() - start_time

if result and result.get('id'):
    print(f"✅ Drama inséré avec succès en {elapsed:.2f}s")
    print(f"ID créé: {result.get('id')}")
    
    # Vérification que le drama a bien été inséré
    check = supabase_db.client.table("dramas").select("*").eq("id", result.get('id')).execute()
    if check.data:
        print(f"✅ Vérification réussie: le drama est bien présent dans la base")
    else:
        print(f"❌ Vérification échouée: le drama n'est pas trouvé dans la base")
else:
    print(f"❌ Erreur lors de l'insertion: {result}")

# Mise à jour du log de scraping
update_result = supabase_db.update_scraping_log(session_id, {
    'items_count': 1,
    'errors_count': 0,
    'duration': elapsed
})

if update_result:
    print(f"✅ Log de scraping mis à jour avec succès")
else:
    print(f"❌ Erreur lors de la mise à jour du log de scraping")

print("\n✅ Test terminé")
