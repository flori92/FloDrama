#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script pour vérifier le schéma de la table dramas dans Supabase
"""

import os
import psycopg2
from dotenv import load_dotenv

# Chargement des variables d'environnement
load_dotenv()

# Configuration PostgreSQL
POSTGRES_URL = os.getenv('POSTGRES_URL')

print(f"URL PostgreSQL: {POSTGRES_URL.replace('Apollonf%40vi92', '********')}")

try:
    # Connexion à PostgreSQL
    conn = psycopg2.connect(POSTGRES_URL)
    cursor = conn.cursor()
    
    # Récupération du schéma de la table dramas
    cursor.execute("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'dramas'
        ORDER BY ordinal_position
    """)
    
    columns = cursor.fetchall()
    
    print(f"\nSchéma de la table 'dramas' ({len(columns)} colonnes):")
    print("-" * 60)
    print(f"{'Colonne':<30} {'Type':<20} {'Nullable':<10}")
    print("-" * 60)
    
    for column in columns:
        name, data_type, is_nullable = column
        print(f"{name:<30} {data_type:<20} {is_nullable:<10}")
    
    # Fermeture de la connexion
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Erreur: {str(e)}")
