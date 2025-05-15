#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test des extracteurs de streaming pour FloDrama
Ce script valide l'extraction des URLs de streaming depuis toutes les sources configurées
"""

import os
import asyncio
import json
from datetime import datetime
from urllib.parse import quote
from playwright.async_api import async_playwright

# Configuration des sources à tester avec des URLs d'exemple
SOURCES_CONFIG = {
    # Dramas asiatiques
    "dramacool": {
        "url": "https://dramacool.com.tr/watch-my-lovable-girl-episode-1-online.html",
        "name": "DramaCool"
    },
    "voirdrama": {
        "url": "https://voirdrama.org/goblin-episode-1-vostfr/",
        "name": "VoirDrama"
    },
    "kissasian": {
        "url": "https://kissasian.com.lv/watch/crash-landing-on-you-episode-1",
        "name": "KissAsian"
    },
    "viewasian": {
        "url": "https://viewasian.lol/watch/descendants-of-the-sun-episode-01.html",
        "name": "ViewAsian"
    },
    
    # Films
    "vostfree": {
        "url": "https://vostfree.cx/your-name-1/",
        "name": "VostFree"
    },
    "streamingdivx": {
        "url": "https://streaming-films.net/joker-2019/",
        "name": "StreamingDivx"
    },
    "filmcomplet": {
        "url": "https://www.film-complet.cc/film/parasite-2019/",
        "name": "FilmComplet"
    },
    "filmapik": {
        "url": "https://filmapik.bio/movie/black-panther-wakanda-forever",
        "name": "FilmApik"
    },
    
    # Animes
    "voiranime": {
        "url": "https://voiranime.com/demon-slayer-saison-1-episode-1-vostfr/",
        "name": "VoirAnime"
    },
    "gogoanime": {
        "url": "https://gogoanime.cl/attack-on-titan-episode-1",
        "name": "GogoAnime"
    },
    "nekosama": {
        "url": "https://neko-sama.fr/anime/info/1-one-piece",
        "name": "NekoSama"
    },
    
    # Bollywood
    "bollyplay": {
        "url": "https://bollyplay.app/movies/pathaan-2023/",
        "name": "BollyPlay"
    },
    "hindilinks4u": {
        "url": "https://hindilinks4u.skin/jawan-2023-hindi-movie/",
        "name": "HindiLinks4U"
    },
    "bollystream": {
        "url": "https://bollystream.eu/movies/tiger-3-2023/",
        "name": "BollyStream"
    }
}

# URL de la passerelle média pour l'extraction
GATEWAY_URL = "http://localhost:8787"
RESULT_FILE = "extractor_test_results.json"

async def test_extractor(source_id, source_config):
    """Teste l'extraction d'une source en envoyant sa page à la passerelle média"""
    print(f"\n🔍 Test de l'extracteur pour {source_config['name']} ({source_id})")
    
    url = source_config["url"]
    encoded_url = quote(url)
    extract_url = f"{GATEWAY_URL}/extract/{encoded_url}"
    
    try:
        async with async_playwright() as p:
            # Lancer le navigateur en mode headless
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            
            page = await context.new_page()
            
            # Afficher l'URL de test
            print(f"   URL de test: {url}")
            print(f"   URL d'extraction: {extract_url}")
            
            # Accéder à l'URL d'extraction
            response = await page.goto(extract_url, wait_until="networkidle")
            
            # Récupérer le résultat JSON
            result_text = await page.content()
            json_start = result_text.find('{')
            json_end = result_text.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                result_json = result_text[json_start:json_end]
                result = json.loads(result_json)
                
                # Vérifier si l'extraction a réussi
                if "streamingUrl" in result and result["streamingUrl"]:
                    print(f"✅ Extraction réussie pour {source_config['name']}!")
                    print(f"   URL de streaming: {result['streamingUrl'][:60]}...")
                    return {
                        "success": True,
                        "streamingUrl": result["streamingUrl"],
                        "message": "Extraction réussie",
                        "timestamp": datetime.now().isoformat()
                    }
                else:
                    print(f"❌ Échec de l'extraction pour {source_config['name']}")
                    print(f"   Réponse: {result}")
                    return {
                        "success": False,
                        "message": f"Pas d'URL de streaming trouvée: {result.get('error', 'Raison inconnue')}",
                        "timestamp": datetime.now().isoformat()
                    }
            else:
                print(f"❌ Réponse invalide pour {source_config['name']}")
                return {
                    "success": False,
                    "message": "Réponse non JSON",
                    "timestamp": datetime.now().isoformat()
                }
                
            await browser.close()
            
    except Exception as e:
        print(f"❌ Erreur lors du test de {source_config['name']}: {str(e)}")
        return {
            "success": False,
            "message": f"Erreur: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }

async def run_tests():
    """Exécute les tests sur toutes les sources configurées"""
    print("🚀 Démarrage des tests des extracteurs de streaming")
    
    # Vérifier que la passerelle média est accessible
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()
            response = await page.goto(f"{GATEWAY_URL}/status", wait_until="networkidle")
            if not response or response.status != 200:
                print(f"❌ La passerelle média n'est pas accessible sur {GATEWAY_URL}")
                print("   Assurez-vous que le service est lancé avec 'wrangler dev'")
                return
            await browser.close()
    except Exception as e:
        print(f"❌ Impossible de se connecter à la passerelle média: {str(e)}")
        print("   Assurez-vous que le service est lancé avec 'wrangler dev'")
        return
    
    results = {}
    
    # Tester chaque source
    for source_id, source_config in SOURCES_CONFIG.items():
        results[source_id] = await test_extractor(source_id, source_config)
    
    # Enregistrer les résultats
    with open(RESULT_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    # Afficher le résumé
    success_count = sum(1 for r in results.values() if r.get("success", False))
    print(f"\n📊 Résumé: {success_count}/{len(results)} extracteurs fonctionnent correctement")
    print(f"   Détails enregistrés dans {RESULT_FILE}")

    # Afficher les extracteurs qui ont échoué
    if success_count < len(results):
        print("\n❌ Extracteurs en échec:")
        for source_id, result in results.items():
            if not result.get("success", False):
                print(f"   - {SOURCES_CONFIG[source_id]['name']} ({source_id}): {result.get('message', 'Raison inconnue')}")

if __name__ == "__main__":
    asyncio.run(run_tests())
