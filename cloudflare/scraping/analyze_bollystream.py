#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script d'analyse pour BollyStream
Ce script analyse la structure HTML de BollyStream pour identifier les sélecteurs CSS optimaux
"""

import requests
from bs4 import BeautifulSoup
import json
import os
import time
from datetime import datetime
import re

# Configuration
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

URLS_TO_ANALYZE = [
    "https://bollystream.eu/",
    "https://bollystream.eu/movies",
    "https://bollystream.eu/movie-genre/bollywood",
    "https://bollystream.eu/tv-shows",
    "https://bollystream.eu/tv-show-genre/series-indiennes"
]

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "source-analysis")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def analyze_page(url):
    """Analyse une page web et identifie les sélecteurs potentiels"""
    print(f"Analyzing {url}...")
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Analyser les éléments potentiels de contenu
        analysis = {
            "url": url,
            "element_type": "bollywood",
            "analysis_method": "domain-specific"
        }
        
        # Trouver tous les éléments qui pourraient contenir des films ou séries
        movie_containers = []
        
        # Recherche de div avec des classes contenant "movie"
        movie_divs = soup.find_all("div", class_=lambda c: c and ("movie" in c.lower() or "film" in c.lower() or "featured" in c.lower()))
        movie_containers.extend([
            {
                "selector": f"div.{div['class'][0]}" if div.get('class') else "div",
                "text": div.get_text()[:100].strip(),
                "has_links": len(div.find_all("a")) > 0,
                "has_images": len(div.find_all("img")) > 0
            } for div in movie_divs
        ])
        
        # Recherche d'articles
        articles = soup.find_all("article")
        movie_containers.extend([
            {
                "selector": f"article.{article['class'][0]}" if article.get('class') else "article",
                "text": article.get_text()[:100].strip(),
                "has_links": len(article.find_all("a")) > 0,
                "has_images": len(article.find_all("img")) > 0
            } for article in articles
        ])
        
        # Recherche de sections
        sections = soup.find_all("section")
        movie_containers.extend([
            {
                "selector": f"section.{section['class'][0]}" if section.get('class') else "section",
                "text": section.get_text()[:100].strip(),
                "has_links": len(section.find_all("a")) > 0,
                "has_images": len(section.find_all("img")) > 0
            } for section in sections
        ])
            
        # Recherche de liens avec images (probablement des films/séries)
        movie_links = [
            {
                "selector": f"a.{a['class'][0]}" if a.get('class') else "a",
                "href": a.get('href'),
                "text": a.get_text().strip() or a.get('title', '')
            }
            for a in soup.find_all("a")
            if a.find("img") and a.get('href')
        ]
        
        # Recherche de grilles ou listes de films
        grid_divs = soup.find_all("div", class_=lambda c: c and ("grid" in c.lower() or "list" in c.lower() or "items" in c.lower()))
        grid_containers = [
            {
                "selector": f"div.{div['class'][0]}" if div.get('class') else "div",
                "text": div.get_text()[:100].strip(),
                "child_count": len(div.find_all()),
                "link_count": len(div.find_all("a"))
            } for div in grid_divs
        ]
        
        # Ajouter les résultats à l'analyse
        analysis["movie_containers"] = movie_containers
        analysis["movie_links"] = movie_links
        analysis["grid_containers"] = grid_containers
        
        # Recommandations
        if movie_containers:
            analysis["recommended_movie_selector"] = movie_containers[0]["selector"]
        if grid_containers:
            analysis["recommended_grid_selector"] = grid_containers[0]["selector"]
        if movie_links:
            analysis["recommended_link_selector"] = movie_links[0]["selector"]
            
        # Pagination
        pagination_links = [a.get('href') for a in soup.find_all("a", href=lambda h: h and "page=" in h)]
        
        if pagination_links:
            analysis["has_pagination"] = True
            analysis["pagination_format"] = pagination_links[0]
        else:
            analysis["has_pagination"] = False
            
        return analysis
        
    except Exception as e:
        return {
            "url": url,
            "element_type": "bollywood",
            "error": f"Error analyzing page: {str(e)}"
        }

def main():
    """Fonction principale"""
    results = {}
    
    for url in URLS_TO_ANALYZE:
        domain = url.split("//")[1].split("/")[0]
        key = domain.split(".")[0]  # Prend la première partie du domaine comme clé
        
        results[key] = analyze_page(url)
        time.sleep(2)  # Pause entre les requêtes
    
    # Sauvegarder les résultats
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    output_file = os.path.join(OUTPUT_DIR, f"bollystream_analysis_{timestamp}.json")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    # Sauvegarder les résultats individuels
    for key, analysis in results.items():
        output_file = os.path.join(OUTPUT_DIR, f"{key}_analysis.json")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(analysis, f, indent=2, ensure_ascii=False)
    
    print(f"Analysis complete. Results saved to {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
