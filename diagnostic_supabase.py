#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de diagnostic pour la connexion Supabase
Ce script teste différents aspects de la connexion à Supabase :
- Connectivité réseau
- Versions des librairies
- Accès à l'API Supabase
- Accès au Storage (buckets)
- Accès à la base de données PostgreSQL
"""

import os
import sys
import json
import time
import platform
import traceback
from datetime import datetime

# Affichage des informations système
print("="*80)
print(f"DIAGNOSTIC SUPABASE - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("="*80)
print(f"Système: {platform.system()} {platform.release()}")
print(f"Python: {platform.python_version()}")
print("-"*80)

# Test des dépendances
print("\n1. VÉRIFICATION DES DÉPENDANCES")
print("-"*80)

dependencies = ["requests", "supabase", "psycopg2", "dotenv"]
missing_deps = []

for dep in dependencies:
    try:
        module = __import__(dep)
        if dep == "supabase":
            version = getattr(module, "__version__", "Version inconnue")
            print(f"✅ {dep} installé (version: {version})")
        else:
            print(f"✅ {dep} installé")
    except ImportError:
        print(f"❌ {dep} NON installé")
        missing_deps.append(dep)

if missing_deps:
    print(f"\n⚠️ Dépendances manquantes: {', '.join(missing_deps)}")
    print("Installez-les avec: pip install " + " ".join(missing_deps))
    sys.exit(1)

# Import des modules nécessaires
import requests
from supabase import create_client
import psycopg2
from dotenv import load_dotenv

# Chargement des variables d'environnement
load_dotenv()

# Configuration Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://fffgoqubrbgppcqqkyod.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZmdvcXVicmJncHBjcXFreW9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTY4MzUwNCwiZXhwIjoyMDYxMjU5NTA0fQ.0ahlAEbmf3eK-utoUTuBEFSOpO_2qPN6k_YdxQzL4XI')
POSTGRES_URL = os.getenv('POSTGRES_URL', 'postgresql://postgres:Apollonf@vi92@db.fffgoqubrbgppcqqkyod.supabase.co:5432/postgres')

# Configuration des buckets
STORAGE_BUCKET = os.getenv('SUPABASE_STORAGE_BUCKET', 'flodrama-images')
CONTENT_BUCKET = os.getenv('SUPABASE_CONTENT_BUCKET', 'flodrama-content')
ASSETS_BUCKET = os.getenv('SUPABASE_ASSETS_BUCKET', 'flodrama-assets')
VIDEO_BUCKET = os.getenv('SUPABASE_VIDEO_BUCKET', 'flodrama-video-cache')

print("\n2. CONFIGURATION")
print("-"*80)
print(f"URL Supabase: {SUPABASE_URL}")
print(f"Clé Supabase: {SUPABASE_KEY[:10]}...{SUPABASE_KEY[-5:]}")
print(f"URL PostgreSQL: {POSTGRES_URL.replace('Apollonf@vi92', '********')}")
print(f"Bucket principal: {STORAGE_BUCKET}")

# Test de connectivité réseau
print("\n3. TEST DE CONNECTIVITÉ RÉSEAU")
print("-"*80)

try:
    print("Test de connexion HTTP simple...")
    start_time = time.time()
    response = requests.get("https://www.google.com", timeout=5)
    elapsed = time.time() - start_time
    print(f"✅ Connexion Internet OK (ping: {elapsed:.2f}s, status: {response.status_code})")
except Exception as e:
    print(f"❌ Problème de connexion Internet: {str(e)}")

try:
    print("\nTest de connexion à l'API Supabase...")
    start_time = time.time()
    response = requests.get(f"{SUPABASE_URL}/rest/v1/?apikey={SUPABASE_KEY}", timeout=5)
    elapsed = time.time() - start_time
    print(f"✅ Connexion à Supabase OK (ping: {elapsed:.2f}s, status: {response.status_code})")
    print(f"Headers: {dict(response.headers)}")
except Exception as e:
    print(f"❌ Problème de connexion à Supabase: {str(e)}")

# Test du client Supabase
print("\n4. TEST DU CLIENT SUPABASE")
print("-"*80)

try:
    print("Initialisation du client Supabase...")
    start_time = time.time()
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    elapsed = time.time() - start_time
    print(f"✅ Client Supabase initialisé (en {elapsed:.2f}s)")
except Exception as e:
    print(f"❌ Erreur lors de l'initialisation du client Supabase: {str(e)}")
    traceback.print_exc()
    sys.exit(1)

# Test de Supabase Storage
print("\n5. TEST DE SUPABASE STORAGE")
print("-"*80)

try:
    print("Récupération de la liste des buckets...")
    start_time = time.time()
    buckets = client.storage.list_buckets()
    elapsed = time.time() - start_time
    print(f"✅ Liste des buckets récupérée (en {elapsed:.2f}s)")
    
    if buckets:
        print(f"Nombre de buckets: {len(buckets)}")
        for bucket in buckets:
            print(f"  - {bucket['name']} (id: {bucket['id']})")
            
        # Vérification des buckets attendus
        bucket_names = [b["name"] for b in buckets]
        expected_buckets = [STORAGE_BUCKET, CONTENT_BUCKET, ASSETS_BUCKET, VIDEO_BUCKET]
        
        for expected in expected_buckets:
            if expected in bucket_names:
                print(f"✅ Bucket {expected} trouvé")
            else:
                print(f"⚠️ Bucket {expected} NON trouvé")
    else:
        print("⚠️ Aucun bucket trouvé")
except Exception as e:
    print(f"❌ Erreur lors de l'accès à Supabase Storage: {str(e)}")
    traceback.print_exc()

# Test de la base de données PostgreSQL
print("\n6. TEST DE LA BASE DE DONNÉES POSTGRESQL")
print("-"*80)

try:
    print("Connexion à PostgreSQL via psycopg2...")
    start_time = time.time()
    conn = psycopg2.connect(POSTGRES_URL)
    elapsed = time.time() - start_time
    print(f"✅ Connexion PostgreSQL établie (en {elapsed:.2f}s)")
    
    # Récupération de la liste des tables
    cursor = conn.cursor()
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    """)
    tables = cursor.fetchall()
    
    print(f"Nombre de tables: {len(tables)}")
    for table in tables:
        print(f"  - {table[0]}")
    
    # Vérification de la table dramas
    if ('dramas',) in tables:
        print("\n✅ Table 'dramas' trouvée")
        
        # Récupération du nombre d'enregistrements
        cursor.execute("SELECT COUNT(*) FROM dramas")
        count = cursor.fetchone()[0]
        print(f"Nombre d'enregistrements dans 'dramas': {count}")
        
        # Récupération d'un exemple
        if count > 0:
            cursor.execute("SELECT id, title, source FROM dramas LIMIT 1")
            row = cursor.fetchone()
            print(f"Exemple d'enregistrement: {row}")
    else:
        print("\n⚠️ Table 'dramas' NON trouvée")
    
    conn.close()
except Exception as e:
    print(f"❌ Erreur lors de l'accès à PostgreSQL: {str(e)}")
    traceback.print_exc()

# Test d'insertion via le client Supabase
print("\n7. TEST D'INSERTION VIA LE CLIENT SUPABASE")
print("-"*80)

try:
    print("Test d'insertion dans la table 'scraping_logs'...")
    start_time = time.time()
    
    # Données de test
    test_data = {
        "source": "diagnostic_script",
        "content_type": "test",
        "started_at": datetime.now().isoformat(),
        "items_count": 0,
        "errors_count": 0,
        "success": True,
        "details": json.dumps({"test": True, "timestamp": time.time()})
    }
    
    # Insertion
    result = client.table("scraping_logs").insert(test_data).execute()
    elapsed = time.time() - start_time
    
    if result.data:
        print(f"✅ Insertion réussie (en {elapsed:.2f}s)")
        print(f"ID créé: {result.data[0]['id']}")
    else:
        print(f"⚠️ Insertion sans erreur mais pas de données retournées (en {elapsed:.2f}s)")
except Exception as e:
    print(f"❌ Erreur lors de l'insertion via Supabase: {str(e)}")
    traceback.print_exc()

print("\n"+"="*80)
print("DIAGNOSTIC TERMINÉ")
print("="*80)
