#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script d'analyse avancée des sélecteurs et de la structure des sources de streaming
Développé le 2025-05-12
"""

import os
import json
import time
import re
import random
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import asyncio
from urllib.parse import urlparse

import aiohttp
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError

# Configuration du logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f"analyse_sources_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Dossier de sauvegarde des résultats
RESULTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "analyse-resultats")
os.makedirs(RESULTS_DIR, exist_ok=True)

# URLs de test connues (exemples concrets pour chaque source)
TEST_URLS = {
    "dramacool": [
        "https://dramacool.com.tr/marry-to-the-enemy-of-my-enemy-2025-episode-24/",
        "https://dramacool.sr/watch-marry-to-the-enemy-of-my-enemy-2025-episode-1-online.html"
    ],
    "voirdrama": [
        "https://voirdrama.org/drama/pump-up-the-healthy-love/pump-up-the-healthy-love-04-vostfr/"
    ],
    "voiranime": [
        "https://v6.voiranime.com/anime/solo-leveling/solo-leveling-01-vostfr/",
        "https://v6.voiranime.com/anime/yandere-dark-elf-she-chased-me-all-the-way-from-another-world/yandere-dark-elf-she-chased-me-all-the-way-from-another-world-01-vostfr/"
    ],
    "vostfree": [
        "https://vostfree.cx/your-name-1/"
    ]
}

# Domaines connus pour chaque source
SOURCE_DOMAINS = {
    "dramacool": ["dramacool.sr", "dramacool.com.tr", "dramacool9.io", "dramacool.cr", "dramacool.sk"],
    "voirdrama": ["voirdrama.org", "voirdrama.cc", "voirdrama.tv", "voirdrama.info"],
    "voiranime": ["v6.voiranime.com", "voiranime.com", "voiranime.tv", "voiranime.cc"],
    "vostfree": ["vostfree.cx", "vostfree.tv", "vostfree.ws", "vostfree.io", "vostfree.in"]
}

# Types d'éléments de contenu à analyser
CONTENT_TYPES = {
    "category": ["menu", "nav", "category", "genre", "header", "navbar"],
    "drama_list": ["drama-list", "list-drama", "movies-list", "items", "content-list", "posts"],
    "drama_item": ["drama-item", "film-item", "movie-item", "post", "article", "item"],
    "episode_list": ["episode-list", "list-episode", "eps-list", "episodes", "saisons"],
    "episode_item": ["episode-item", "eps-item", "episode", "ep-"],
    "player": ["player", "video-player", "lecteur", "watch-video", "player-area"],
    "video": ["video", "iframe", "jwplayer", "plyr", "video-js"],
    "metadata": ["info", "details", "synopsis", "description", "meta-"],
    "title": ["title", "name", "heading", "h1", "drama-title"],
    "image": ["poster", "thumbnail", "cover", "image", "thumb"],
    "trailer": ["trailer", "teaser", "preview", "bande-annonce"]
}


class StructureAnalyzer:
    """Classe pour analyser la structure HTML d'une source et extraire les sélecteurs pertinents"""
    
    def __init__(self, source_name: str):
        """Initialisation de l'analyseur pour une source spécifique"""
        self.source_name = source_name
        self.source_domains = SOURCE_DOMAINS.get(source_name, [])
        self.test_urls = TEST_URLS.get(source_name, [])
        
        # Créer le dossier de résultats pour cette source
        self.results_dir = os.path.join(RESULTS_DIR, source_name)
        os.makedirs(self.results_dir, exist_ok=True)
        
        # Structure pour stocker les sélecteurs détectés
        self.detected_selectors = {content_type: [] for content_type in CONTENT_TYPES}
        
        # Structure pour les métriques des sélecteurs
        self.selector_metrics = {}
        
        # Collecte des streaming URLs
        self.streaming_urls = []
        
    async def analyze_all_urls(self):
        """Analyse toutes les URLs de test pour cette source"""
        if not self.test_urls:
            logger.error(f"❌ Aucune URL de test définie pour la source {self.source_name}")
            return False
        
        logger.info(f"🚀 Début de l'analyse pour la source {self.source_name}")
        logger.info(f"📋 URLs de test à analyser: {len(self.test_urls)}")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)
            try:
                # Créer un contexte de navigation
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                )
                
                # Configurer les écouteurs de réseau pour capturer les requêtes vidéo
                page = await context.new_page()
                await self._setup_request_capture(page)
                
                # Analyser chaque URL de test
                for i, url in enumerate(self.test_urls):
                    logger.info(f"🌐 Analyse de l'URL {i+1}/{len(self.test_urls)}: {url}")
                    
                    try:
                        # Naviguer vers l'URL
                        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                        await page.wait_for_timeout(5000)
                        
                        # Prendre une capture d'écran
                        screenshot_file = os.path.join(
                            self.results_dir, 
                            f"screenshot_{urlparse(url).netloc.replace('.', '_')}_{i+1}.png"
                        )
                        await page.screenshot(path=screenshot_file)
                        logger.info(f"📸 Capture d'écran sauvegardée: {screenshot_file}")
                        
                        # Analyser la structure HTML
                        await self._analyze_page_structure(page, url)
                        
                        # Essayer d'activer le lecteur en cliquant sur des éléments
                        await self._activate_player(page)
                        
                        # Attendre un peu plus pour que les vidéos se chargent
                        await page.wait_for_timeout(5000)
                        
                        # Extraire les métadonnées (comme un exemple)
                        await self._extract_metadata(page, url)
                        
                    except Exception as e:
                        logger.error(f"❌ Erreur lors de l'analyse de {url}: {e}")
                
                # Sauvegarder les résultats finaux
                self._save_results()
                
                return True
                
            except Exception as e:
                logger.error(f"❌ Erreur globale lors de l'analyse de {self.source_name}: {e}")
                return False
            finally:
                await browser.close()
    
    async def _setup_request_capture(self, page):
        """Configure la capture des requêtes réseau pour détecter les URLs de streaming"""
        # Intercepter les requêtes pour les formats vidéo courants
        for pattern in ["**/*.m3u8", "**/*.mp4", "**/*hls*", "**/*dash*"]:
            await page.route(pattern, self._handle_media_request)
    
    async def _handle_media_request(self, route):
        """Gestionnaire pour les requêtes réseau média"""
        url = route.request.url
        if any(ext in url for ext in [".m3u8", ".mp4", "/hls/", "/dash/"]):
            logger.info(f"🎬 URL de streaming détectée: {url}")
            if url not in self.streaming_urls:
                self.streaming_urls.append(url)
                
                # Sauvegarder immédiatement les URLs détectées
                with open(os.path.join(self.results_dir, "streaming_urls.json"), 'w') as f:
                    json.dump(self.streaming_urls, f, indent=2)
        
        # Continuer la requête normalement
        await route.continue_()
    
    async def _analyze_page_structure(self, page, url):
        """Analyse la structure HTML de la page pour détecter les sélecteurs pertinents"""
        logger.info("🔍 Analyse de la structure HTML...")
        
        # Extraire la structure complète de la page
        page_structure = await page.evaluate("""
            () => {
                function getElementsInfo() {
                    const allElements = {};
                    
                    // Chercher les éléments avec ID
                    document.querySelectorAll('[id]').forEach(el => {
                        const id = el.id;
                        if (!allElements[`#${id}`]) {
                            allElements[`#${id}`] = {
                                count: 1,
                                tag: el.tagName.toLowerCase(),
                                text: el.textContent ? el.textContent.trim().substring(0, 50) : '',
                                html: el.outerHTML.substring(0, 200)
                            };
                        }
                    });
                    
                    // Chercher les éléments avec classes
                    const classes = {};
                    document.querySelectorAll('*').forEach(el => {
                        if (el.classList && el.classList.length) {
                            Array.from(el.classList).forEach(cls => {
                                if (!classes[`.${cls}`]) {
                                    classes[`.${cls}`] = {
                                        count: 1,
                                        tag: el.tagName.toLowerCase(),
                                        text: el.textContent ? el.textContent.trim().substring(0, 50) : '',
                                        html: el.outerHTML.substring(0, 200)
                                    };
                                } else {
                                    classes[`.${cls}`].count++;
                                }
                            });
                        }
                    });
                    
                    // Ajouter les classes à notre collection
                    Object.assign(allElements, classes);
                    
                    // Chercher les éléments spécifiques
                    const specialElements = {
                        'video': document.querySelectorAll('video').length,
                        'iframe': document.querySelectorAll('iframe').length,
                        '.jwplayer': document.querySelectorAll('.jwplayer').length,
                        '.plyr': document.querySelectorAll('.plyr').length,
                        '.video-js': document.querySelectorAll('.video-js').length,
                        '[data-player]': document.querySelectorAll('[data-player]').length,
                        '[data-video]': document.querySelectorAll('[data-video]').length
                    };
                    
                    return {
                        url: window.location.href,
                        title: document.title,
                        elements: allElements,
                        specialElements: specialElements
                    };
                }
                
                return getElementsInfo();
            }
        """)
        
        # Analyser les éléments pour trouver les sélecteurs pertinents
        selectors_found = self._analyze_elements(page_structure['elements'])
        
        # Sauvegarder la structure et les sélecteurs
        url_filename = self._get_filename_from_url(url)
        with open(os.path.join(self.results_dir, f"structure_{url_filename}.json"), 'w') as f:
            json.dump(page_structure, f, indent=2)
        
        with open(os.path.join(self.results_dir, f"selectors_{url_filename}.json"), 'w') as f:
            json.dump(selectors_found, f, indent=2)
        
        logger.info(f"💾 Structure et sélecteurs sauvegardés pour {url}")
        
        return selectors_found
    
    def _analyze_elements(self, elements):
        """Analyse les éléments pour trouver les sélecteurs pertinents par type"""
        selectors_by_type = {content_type: [] for content_type in CONTENT_TYPES}
        
        for selector, info in elements.items():
            # Vérifier si ce sélecteur correspond à un des types
            for content_type, keywords in CONTENT_TYPES.items():
                for keyword in keywords:
                    if (keyword.lower() in selector.lower() or 
                        (info.get('text') and keyword.lower() in info['text'].lower())):
                        
                        # Ajouter ce sélecteur à la liste des sélecteurs pour ce type
                        selector_info = {
                            "selector": selector,
                            "count": info.get('count', 0),
                            "tag": info.get('tag', ''),
                            "sample_text": info.get('text', '')
                        }
                        
                        if selector_info not in selectors_by_type[content_type]:
                            selectors_by_type[content_type].append(selector_info)
                        
                        # Mettre à jour les métriques de ce sélecteur
                        if selector not in self.selector_metrics:
                            self.selector_metrics[selector] = {
                                "count": 0,
                                "types": set(),
                                "urls": set()
                            }
                        
                        self.selector_metrics[selector]["count"] += 1
                        self.selector_metrics[selector]["types"].add(content_type)
                        break
        
        # Ajouter les sélecteurs trouvés à notre collecte globale
        for content_type, selectors in selectors_by_type.items():
            for selector_info in selectors:
                if selector_info not in self.detected_selectors[content_type]:
                    self.detected_selectors[content_type].append(selector_info)
        
        return selectors_by_type
    
    async def _activate_player(self, page):
        """Essaie d'activer le lecteur en cliquant sur des éléments pertinents"""
        logger.info("🖱️ Tentative d'activation du lecteur vidéo...")
        
        # Sélecteurs communs pour les boutons de lecture
        play_selectors = [
            "video", ".jwplayer", ".plyr", ".video-js", 
            "[data-player]", "[data-video]", ".play-button",
            ".player", "#player", ".video-player"
        ]
        
        # Ajouter les sélecteurs détectés pour le type 'player'
        for selector_info in self.detected_selectors["player"]:
            play_selectors.append(selector_info["selector"])
        
        # Essayer de cliquer sur chaque sélecteur
        for selector in play_selectors:
            try:
                # Vérifier si l'élément existe
                element_count = await page.evaluate(f"""
                    () => document.querySelectorAll('{selector}').length
                """)
                
                if element_count > 0:
                    logger.info(f"🖱️ Clic sur le sélecteur: {selector} ({element_count} éléments)")
                    await page.click(selector)
                    await page.wait_for_timeout(2000)
            except Exception as e:
                logger.debug(f"Impossible de cliquer sur {selector}: {e}")
    
    async def _extract_metadata(self, page, url):
        """Extrait les métadonnées du contenu"""
        logger.info("📋 Extraction des métadonnées...")
        
        # Extraire les données principales
        metadata = await page.evaluate("""
            () => {
                return {
                    title: document.title,
                    h1: document.querySelector('h1')?.textContent.trim(),
                    images: Array.from(document.querySelectorAll('img')).slice(0, 5).map(img => img.src),
                    description: document.querySelector('meta[name="description"]')?.content,
                    jsonLd: Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
                        .map(script => script.textContent)
                };
            }
        """)
        
        # Extraire les informations avec les sélecteurs détectés
        for selector_info in self.detected_selectors["metadata"] + self.detected_selectors["title"]:
            selector = selector_info["selector"]
            try:
                text = await page.evaluate(f"""
                    () => document.querySelector('{selector}')?.textContent.trim()
                """)
                
                if text:
                    metadata[f"text_{selector}"] = text
            except Exception as e:
                pass
        
        # Sauvegarder les métadonnées
        url_filename = self._get_filename_from_url(url)
        with open(os.path.join(self.results_dir, f"metadata_{url_filename}.json"), 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"💾 Métadonnées sauvegardées pour {url}")
    
    def _get_filename_from_url(self, url):
        """Génère un nom de fichier à partir d'une URL"""
        parsed = urlparse(url)
        return f"{parsed.netloc.replace('.', '_')}_{parsed.path.replace('/', '_')}"
    
    def _save_results(self):
        """Sauvegarde les résultats finaux de l'analyse"""
        # Sauvegarder les sélecteurs détectés
        with open(os.path.join(self.results_dir, "detected_selectors.json"), 'w') as f:
            json.dump(self.detected_selectors, f, indent=2)
        
        # Sauvegarder les métriques des sélecteurs
        # Convertir les ensembles en listes pour JSON
        metrics_json = {}
        for selector, metrics in self.selector_metrics.items():
            metrics_json[selector] = {
                "count": metrics["count"],
                "types": list(metrics["types"]),
                "urls": list(metrics["urls"])
            }
        
        with open(os.path.join(self.results_dir, "selector_metrics.json"), 'w') as f:
            json.dump(metrics_json, f, indent=2)
        
        # Créer des recommandations de sélecteurs
        recommended_selectors = self._generate_recommendations()
        with open(os.path.join(self.results_dir, "recommended_selectors.json"), 'w') as f:
            json.dump(recommended_selectors, f, indent=2)
        
        logger.info(f"💾 Résultats finaux sauvegardés pour {self.source_name}")
        
        # Afficher les recommandations
        logger.info(f"📋 Recommandations de sélecteurs pour {self.source_name}:")
        for content_type, selectors in recommended_selectors.items():
            logger.info(f"  - {content_type}: {', '.join(selectors)}")
    
    def _generate_recommendations(self):
        """Génère des recommandations de sélecteurs basées sur les métriques"""
        recommendations = {}
        
        for content_type, selectors_info in self.detected_selectors.items():
            # Trier les sélecteurs par nombre d'occurrences
            sorted_selectors = sorted(
                selectors_info, 
                key=lambda s: s.get("count", 0), 
                reverse=True
            )
            
            # Sélectionner les 3 meilleurs sélecteurs maximum
            best_selectors = [s["selector"] for s in sorted_selectors[:3]]
            if best_selectors:
                recommendations[content_type] = best_selectors
        
        return recommendations


async def analyze_all_sources():
    """Analyse toutes les sources configurées"""
    results = {}
    
    for source_name in SOURCE_DOMAINS.keys():
        logger.info(f"\n{'='*50}\n🔍 ANALYSE DE LA SOURCE: {source_name}\n{'='*50}\n")
        
        analyzer = StructureAnalyzer(source_name)
        success = await analyzer.analyze_all_urls()
        
        results[source_name] = {
            "success": success,
            "streaming_urls": len(analyzer.streaming_urls)
        }
    
    # Sauvegarder le résumé global
    with open(os.path.join(RESULTS_DIR, f"analyse_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"), 'w') as f:
        json.dump(results, f, indent=2)
    
    logger.info(f"\n{'='*50}\n📊 RÉSUMÉ GLOBAL\n{'='*50}")
    for source, result in results.items():
        status = "✅ Succès" if result.get("success", False) else "❌ Échec"
        logger.info(f"{source}: {status} - {result.get('streaming_urls', 0)} URLs de streaming trouvées")


async def main():
    """Fonction principale"""
    await analyze_all_sources()


if __name__ == "__main__":
    asyncio.run(main())
