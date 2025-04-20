#!/usr/bin/env python3
import asyncio
import os
import json
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

# Charger les variables d'environnement depuis .env.production
load_dotenv('.env.production')

# Récupérer les variables d'environnement
MONGODB_URI = os.environ.get("MONGODB_URI")
if not MONGODB_URI:
    print("Erreur: MONGODB_URI n'est pas défini dans le fichier .env.production")
    sys.exit(1)

async def main():
    print(f"Connexion à MongoDB: {MONGODB_URI}")
    
    try:
        # Connexion à MongoDB
        client = MongoClient(MONGODB_URI)
        db = client.flodrama
        
        # Vérification de la connexion
        print("Vérification de la connexion à MongoDB...")
        db.command('ping')
        print("✅ Connexion à MongoDB établie avec succès!")
        
        # Récupération d'un échantillon de documents
        print("Récupération des données de contenu...")
        sample = list(db.contents.find().limit(20))
        
        if not sample:
            print("⚠️ Aucun document trouvé dans la collection 'contents'")
            return
        
        print(f"✅ {len(sample)} documents récupérés")
        
        # Génération du rapport de schéma
        report_path = "scraping_schema_report.json"
        with open(report_path, "w", encoding="utf-8") as f:
            # Convertir ObjectId en str pour la sérialisation JSON
            for doc in sample:
                if '_id' in doc:
                    doc['_id'] = str(doc['_id'])
            
            json.dump(sample, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Rapport de schéma généré: {os.path.abspath(report_path)}")
        
    except Exception as e:
        print(f"❌ Erreur lors de l'analyse MongoDB: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
