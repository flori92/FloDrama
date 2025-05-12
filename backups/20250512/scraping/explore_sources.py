#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script d'exploration des sources de streaming et validation des sélecteurs
Développé le 2025-05-12
"""

import os
import json
import time
import random
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import asyncio
from urllib.parse import urlparse

import aiohttp
import asyncio
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError

# Configuration du logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f"exploration_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Configuration des sources
SOURCES_CONFIG = {
    "dramacool": {
        "base_url": "https://dramacool.sr",
        "alt_domains": ["dramacool.com.tr", "dramacool9.io", "dramacool.cr"],
        "category_selector": ".category a, .genres a, .sub-menu a",
        "content_list_selector": ".list-drama-item, .list-episode-item, .movies-list .ml-item",
        "content_item_selector": ".list-drama-item a, .list-episode-item a, .ml-item a",
        "episode_list_selector": ".list-episode-item, .episodes, .eps-list",
        "episode_item_selector": ".list-episode-item a, .episodes a, .eps-item a",
        "player_selector": ".watch-drama, .video-content, .videoPlayerDiv, #centerDivVideo",
        "video_selector": "video, iframe, .jw-video",
        "wait_time": 8,  # Temps d'attente en secondes
    },
    "voirdrama": {
        "base_url": "https://voirdrama.org",
        "alt_domains": ["voirdrama.cc", "voirdrama.tv"],
        "category_selector": ".menu-item a, .genres a, .category a",
        "content_list_selector": ".movies-list, .contents, .items",
        "content_item_selector": ".ml-item a, .content-item a, .item a",
        "episode_list_selector": ".episodes-list, .eps-list, .list-episodes",
        "episode_item_selector": ".episodes-list a, .eps-list a, .eps-item a",
        "player_selector": ".play-video, .player-embed, .site-content",
        "video_selector": "video, iframe, .jw-media",
        "wait_time": 6,
    },
    "voiranime": {
        "base_url": "https://v6.voiranime.com",
        "alt_domains": ["voiranime.com", "voiranime.tv", "voiranime.cc"],
        "category_selector": ".menu-item a, .genre a, .nav-menu a",
        "content_list_selector": ".movies-list, .items, .anime-list",
        "content_item_selector": ".ml-item a, .item a, .anime-item a",
        "episode_list_selector": ".episodes, .eps-list, .episode-list",
        "episode_item_selector": ".episodes a, .eps-item a, .episode-item a",
        "player_selector": ".videoWrapperPlayer, .player-content, .video-content",
        "video_selector": "video, iframe, .jw-video, .vjs-tech",
        "wait_time": 5,
    },
    "vostfree": {
        "base_url": "https://vostfree.cx",
        "alt_domains": ["vostfree.tv", "vostfree.ws", "vostfree.io"],
        "category_selector": ".menu-item a, .category a, .genres a",
        "content_list_selector": ".movies-list, .items-list",
        "content_item_selector": ".ml-item a, .item a",
        "episode_list_selector": ".episodes-list, .eps-list",
        "episode_item_selector": ".episodes-list a, .eps-item a",
        "player_selector": ".watch-content, .player-embed",
        "video_selector": "video, iframe, .jw-media",
        "wait_time": 5,
    }
}

# Dossier de sauvegarde des résultats
RESULTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "exploration-results")
os.makedirs(RESULTS_DIR, exist_ok=True)

class SourceExplorer:
    def __init__(self, source_name: str):
        """Initialise l'explorateur pour une source spécifique"""
        if source_name not in SOURCES_CONFIG:
            raise ValueError(f"Source {source_name} non configurée")
        
        self.source_name = source_name
        self.config = SOURCES_CONFIG[source_name]
        self.results_dir = os.path.join(RESULTS_DIR, source_name)
        os.makedirs(self.results_dir, exist_ok=True)
        
        # Statistiques d'exploration
        self.stats = {
            "categories_found": 0,
            "contents_found": 0,
            "episodes_found": 0,
            "player_pages_found": 0,
            "streaming_urls_found": 0,
            "errors": 0
        }
    
    async def explore(self, max_categories: int = 3, max_contents: int = 5, 
                     max_episodes: int = 3, save_screenshots: bool = True) -> Dict:
        """Explore la source pour découvrir du contenu et valider les sélecteurs"""
        logger.info(f"🚀 Début de l'exploration de {self.source_name}")
        
        # Tableau pour stocker les URLs de pages avec lecteur
        player_pages = []
        
        async with async_playwright() as p:
            # Lancer le navigateur
            browser = await p.chromium.launch(headless=False)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            )
            page = await context.new_page()
            
            # Activer la collecte des requêtes réseau
            await page.route("**/*.m3u8", lambda route: self._handle_media_request(route, "m3u8", player_pages))
            await page.route("**/*.mp4", lambda route: self._handle_media_request(route, "mp4", player_pages))
            await page.route("**/*hls*", lambda route: self._handle_media_request(route, "hls", player_pages))
            
            try:
                # Essayer d'abord le domaine principal
                try:
                    logger.info(f"🔍 Accès à la page d'accueil: {self.config['base_url']}")
                    await page.goto(self.config['base_url'], wait_until="domcontentloaded", timeout=30000)
                    await page.wait_for_timeout(3000)
                except Exception as e:
                    logger.warning(f"⚠️ Échec avec le domaine principal: {e}")
                    
                    # Essayer les domaines alternatifs
                    for alt_domain in self.config['alt_domains']:
                        try:
                            alt_url = f"https://{alt_domain}"
                            logger.info(f"🔄 Essai du domaine alternatif: {alt_url}")
                            await page.goto(alt_url, wait_until="domcontentloaded", timeout=30000)
                            await page.wait_for_timeout(3000)
                            
                            # Si on arrive ici, le domaine alternatif fonctionne
                            self.config['base_url'] = alt_url
                            break
                        except Exception as alt_e:
                            logger.warning(f"⚠️ Échec avec le domaine alternatif {alt_domain}: {alt_e}")
                
                # Vérifier si un domaine fonctionne
                if page.url == "about:blank":
                    logger.error(f"❌ Tous les domaines ont échoué pour {self.source_name}")
                    return {"success": False, "error": "Tous les domaines ont échoué"}
                
                # Capturer les catégories
                logger.info(f"🔍 Recherche des catégories avec le sélecteur: {self.config['category_selector']}")
                category_links = await self._extract_links(page, self.config['category_selector'])
                self.stats["categories_found"] = len(category_links)
                
                if save_screenshots:
                    await page.screenshot(path=os.path.join(self.results_dir, "homepage.png"))
                
                logger.info(f"✅ {len(category_links)} catégories trouvées")
                
                # Sélectionner un sous-ensemble de catégories à explorer
                categories_to_explore = random.sample(
                    category_links, 
                    min(max_categories, len(category_links))
                ) if category_links else []
                
                for category_url in categories_to_explore:
                    try:
                        logger.info(f"🌐 Navigation vers la catégorie: {category_url}")
                        await page.goto(category_url, wait_until="domcontentloaded", timeout=30000)
                        await page.wait_for_timeout(self.config['wait_time'] * 1000)
                        
                        # Chercher le contenu dans cette catégorie
                        logger.info(f"🔍 Recherche du contenu avec le sélecteur: {self.config['content_list_selector']}")
                        
                        try:
                            await page.wait_for_selector(self.config['content_list_selector'].split(',')[0], timeout=10000)
                            if save_screenshots:
                                await page.screenshot(path=os.path.join(self.results_dir, f"category_{urlparse(category_url).path.replace('/', '_')}.png"))
                        except PlaywrightTimeoutError:
                            logger.warning(f"⚠️ Sélecteur de liste de contenu non trouvé: {self.config['content_list_selector']}")
                            continue
                        
                        content_links = await self._extract_links(page, self.config['content_item_selector'])
                        self.stats["contents_found"] += len(content_links)
                        
                        logger.info(f"✅ {len(content_links)} contenus trouvés dans cette catégorie")
                        
                        # Sélectionner un sous-ensemble de contenus à explorer
                        contents_to_explore = random.sample(
                            content_links, 
                            min(max_contents, len(content_links))
                        ) if content_links else []
                        
                        for content_url in contents_to_explore:
                            try:
                                logger.info(f"🌐 Navigation vers le contenu: {content_url}")
                                await page.goto(content_url, wait_until="domcontentloaded", timeout=30000)
                                await page.wait_for_timeout(self.config['wait_time'] * 1000)
                                
                                # Vérifier s'il y a des épisodes (série) ou non (film)
                                has_episodes = await self._check_selector(page, self.config['episode_list_selector'])
                                
                                if save_screenshots:
                                    await page.screenshot(path=os.path.join(
                                        self.results_dir, 
                                        f"content_{urlparse(content_url).path.replace('/', '_')}.png"
                                    ))
                                
                                if has_episodes:
                                    # C'est une série avec des épisodes
                                    logger.info(f"🔍 Recherche des épisodes avec le sélecteur: {self.config['episode_item_selector']}")
                                    episode_links = await self._extract_links(page, self.config['episode_item_selector'])
                                    self.stats["episodes_found"] += len(episode_links)
                                    
                                    logger.info(f"✅ {len(episode_links)} épisodes trouvés")
                                    
                                    # Sélectionner un sous-ensemble d'épisodes à explorer
                                    episodes_to_explore = random.sample(
                                        episode_links, 
                                        min(max_episodes, len(episode_links))
                                    ) if episode_links else []
                                    
                                    for episode_url in episodes_to_explore:
                                        await self._explore_player_page(page, episode_url, player_pages, save_screenshots)
                                else:
                                    # C'est un film, la page actuelle est celle du lecteur
                                    logger.info("🎬 Ce contenu est un film, la page actuelle contient le lecteur")
                                    current_url = page.url
                                    await self._explore_player_page(page, current_url, player_pages, save_screenshots)
                            except Exception as content_error:
                                self.stats["errors"] += 1
                                logger.error(f"❌ Erreur lors de l'exploration du contenu {content_url}: {content_error}")
                                continue
                    except Exception as category_error:
                        self.stats["errors"] += 1
                        logger.error(f"❌ Erreur lors de l'exploration de la catégorie {category_url}: {category_error}")
                        continue
                
                # Sauvegarder les URLs de pages avec lecteur
                self._save_player_pages(player_pages)
                
                logger.info(f"📊 Statistiques d'exploration pour {self.source_name}:")
                for stat, value in self.stats.items():
                    logger.info(f"  - {stat}: {value}")
                
                return {
                    "success": True,
                    "stats": self.stats,
                    "player_pages_count": len(player_pages)
                }
            except Exception as e:
                logger.error(f"❌ Erreur globale lors de l'exploration de {self.source_name}: {e}")
                return {"success": False, "error": str(e)}
            finally:
                await browser.close()
    
    async def _explore_player_page(self, page, url, player_pages, save_screenshots):
        """Explore une page avec lecteur média intégré"""
        try:
            logger.info(f"🌐 Navigation vers la page du lecteur: {url}")
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            
            # Attendre que le lecteur se charge
            try:
                logger.info(f"⏳ Attente du lecteur avec le sélecteur: {self.config['player_selector']}")
                await page.wait_for_selector(
                    self.config['player_selector'].split(',')[0], 
                    timeout=15000
                )
                
                # Si on arrive ici, le sélecteur du lecteur a été trouvé
                if save_screenshots:
                    await page.screenshot(path=os.path.join(
                        self.results_dir, 
                        f"player_{urlparse(url).path.replace('/', '_')}.png"
                    ))
                
                # Vérifier le sélecteur video/iframe
                video_selector_found = await self._check_selector(page, self.config['video_selector'])
                
                # Essayer de cliquer sur un élément du lecteur pour déclencher le chargement
                try:
                    for selector in self.config['video_selector'].split(','):
                        selector = selector.strip()
                        if await self._check_selector(page, selector):
                            logger.info(f"🖱️ Clic sur l'élément: {selector}")
                            await page.click(selector)
                            await page.wait_for_timeout(3000)
                            break
                except Exception as click_error:
                    logger.warning(f"⚠️ Impossible de cliquer sur le lecteur: {click_error}")
                
                # Attendre pour permettre aux requêtes réseau de se déclencher
                await page.wait_for_timeout(5000)
                
                # Extraire directement des liens média depuis la page
                streaming_urls = await self._extract_streaming_urls(page)
                
                # Sauvegarder l'URL de cette page avec les informations
                player_info = {
                    "url": url,
                    "source": self.source_name,
                    "player_found": True,
                    "video_selector_found": video_selector_found,
                    "streaming_urls_found": bool(streaming_urls),
                    "streaming_urls": streaming_urls,
                    "timestamp": datetime.now().isoformat()
                }
                
                player_pages.append(player_info)
                self.stats["player_pages_found"] += 1
                
                if streaming_urls:
                    self.stats["streaming_urls_found"] += len(streaming_urls)
                    logger.info(f"✅ URLs de streaming trouvées: {streaming_urls}")
                else:
                    logger.warning("⚠️ Aucune URL de streaming trouvée directement")
            
            except PlaywrightTimeoutError:
                logger.warning(f"⚠️ Sélecteur du lecteur non trouvé: {self.config['player_selector']}")
                
                # Même si le sélecteur n'est pas trouvé, sauvegarder l'URL
                player_pages.append({
                    "url": url,
                    "source": self.source_name,
                    "player_found": False,
                    "timestamp": datetime.now().isoformat()
                })
        
        except Exception as player_error:
            self.stats["errors"] += 1
            logger.error(f"❌ Erreur lors de l'exploration de la page du lecteur {url}: {player_error}")
    
    async def _extract_links(self, page, selector: str) -> List[str]:
        """Extrait les liens correspondant au sélecteur"""
        try:
            links = await page.evaluate(f"""
                () => Array.from(document.querySelectorAll('{selector}')).map(a => a.href).filter(href => href && href.length > 0)
            """)
            return links
        except Exception as e:
            logger.warning(f"⚠️ Impossible d'extraire les liens avec le sélecteur {selector}: {e}")
            return []
    
    async def _check_selector(self, page, selector: str) -> bool:
        """Vérifie si un sélecteur existe dans la page"""
        try:
            for single_selector in selector.split(','):
                single_selector = single_selector.strip()
                count = await page.evaluate(f"""
                    () => document.querySelectorAll('{single_selector}').length
                """)
                if count > 0:
                    logger.info(f"✅ Sélecteur trouvé: {single_selector} ({count} éléments)")
                    return True
            
            logger.warning(f"⚠️ Aucun sélecteur trouvé parmi: {selector}")
            return False
        except Exception as e:
            logger.warning(f"⚠️ Erreur lors de la vérification du sélecteur {selector}: {e}")
            return False
    
    async def _extract_streaming_urls(self, page) -> List[str]:
        """Extrait les URLs de streaming directement depuis la page"""
        try:
            # Méthode 1: Extraire depuis les éléments video et source
            video_sources = await page.evaluate("""
                () => {
                    const sources = [];
                    
                    // Vérifier les éléments video
                    document.querySelectorAll('video').forEach(video => {
                        if (video.src && video.src.length > 10) sources.push(video.src);
                        
                        // Vérifier les éléments source enfants
                        video.querySelectorAll('source').forEach(source => {
                            if (source.src && source.src.length > 10) sources.push(source.src);
                        });
                    });
                    
                    // Vérifier les attributs data courants
                    document.querySelectorAll('[data-src], [data-source], [data-stream], [data-video]').forEach(el => {
                        const src = el.getAttribute('data-src') || 
                                  el.getAttribute('data-source') || 
                                  el.getAttribute('data-stream') || 
                                  el.getAttribute('data-video');
                        if (src && src.length > 10) sources.push(src);
                    });
                    
                    return sources.filter(src => 
                        src.includes('.m3u8') || 
                        src.includes('.mp4') || 
                        src.includes('/hls/') || 
                        src.includes('/dash/')
                    );
                }
            """)
            
            # Méthode 2: Chercher dans les scripts
            script_sources = await page.evaluate("""
                () => {
                    const sources = [];
                    
                    // Chercher dans les scripts
                    document.querySelectorAll('script').forEach(script => {
                        if (!script.textContent) return;
                        
                        // Chercher des patterns courants
                        const patterns = [
                            /source:\s*["']([^"']+\.m3u8[^"']*)["']/g,
                            /sources:\s*\[\s*{\s*file:\s*["']([^"']+)["']/g,
                            /["']([^"']*\.m3u8[^"']*)["']/g,
                            /["']([^"']*\.mp4[^"']*)["']/g
                        ];
                        
                        patterns.forEach(pattern => {
                            let match;
                            while ((match = pattern.exec(script.textContent)) !== null) {
                                if (match[1] && match[1].length > 10) {
                                    sources.push(match[1]);
                                }
                            }
                        });
                    });
                    
                    return sources;
                }
            """)
            
            # Méthode 3: Extraire les URLs d'iframe
            iframe_sources = await page.evaluate("""
                () => {
                    return Array.from(document.querySelectorAll('iframe'))
                        .map(iframe => iframe.src)
                        .filter(src => src && src.length > 10);
                }
            """)
            
            # Combiner et filtrer les résultats
            all_sources = video_sources + script_sources
            
            # Si aucune source directe n'est trouvée, on retourne les iframes
            return all_sources if all_sources else iframe_sources
        
        except Exception as e:
            logger.warning(f"⚠️ Erreur lors de l'extraction des URLs de streaming: {e}")
            return []
    
    def _handle_media_request(self, route, media_type, player_pages):
        """Gestionnaire pour intercepter les requêtes média"""
        url = route.request.url
        logger.info(f"🔍 Détection d'une requête {media_type}: {url}")
        
        # Trouver la page actuelle dans notre liste
        current_url = route.request.headers.get("referer", "")
        for page_info in player_pages:
            if page_info["url"] == current_url:
                if "streaming_urls" not in page_info:
                    page_info["streaming_urls"] = []
                
                if url not in page_info["streaming_urls"]:
                    page_info["streaming_urls"].append(url)
                    self.stats["streaming_urls_found"] += 1
                break
        
        # Continuer la requête normalement
        route.continue_()
    
    def _save_player_pages(self, player_pages):
        """Sauvegarde les URLs des pages avec lecteur"""
        if not player_pages:
            logger.warning("⚠️ Aucune page de lecteur trouvée à sauvegarder")
            return
        
        output_file = os.path.join(
            self.results_dir, 
            f"player_pages_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        )
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(player_pages, f, indent=2, ensure_ascii=False)
        
        logger.info(f"💾 {len(player_pages)} pages de lecteur sauvegardées dans {output_file}")


async def validate_source_selectors(source_name, max_categories=2, max_contents=3, max_episodes=2):
    """Valide les sélecteurs pour une source spécifique"""
    explorer = SourceExplorer(source_name)
    result = await explorer.explore(
        max_categories=max_categories,
        max_contents=max_contents,
        max_episodes=max_episodes,
        save_screenshots=True
    )
    return result


async def main():
    """Fonction principale qui exécute la validation sur toutes les sources"""
    results = {}
    
    # Liste des sources à explorer
    sources_to_explore = list(SOURCES_CONFIG.keys())
    
    for source in sources_to_explore:
        logger.info(f"\n{'='*50}\n🔍 VALIDATION DE LA SOURCE: {source}\n{'='*50}\n")
        results[source] = await validate_source_selectors(source)
    
    # Sauvegarder les résultats complets
    results_file = os.path.join(RESULTS_DIR, f"validation_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    logger.info(f"\n{'='*50}\n📊 RÉSUMÉ GLOBAL\n{'='*50}")
    for source, result in results.items():
        status = "✅ Succès" if result.get("success", False) else "❌ Échec"
        player_pages = result.get("player_pages_count", 0)
        logger.info(f"{source}: {status} - {player_pages} pages de lecteur trouvées")
    
    logger.info(f"\n💾 Résultats complets sauvegardés dans: {results_file}")


if __name__ == "__main__":
    asyncio.run(main())
