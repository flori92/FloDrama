from bs4 import BeautifulSoup
import requests
from urllib.parse import urlparse
import json
import os
from datetime import datetime

def analyze_page(url, element_type):
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        parsed_url = urlparse(url)
        domain = parsed_url.netloc
        
        # Domain-specific analysis
        if 'voirdrama' in domain and element_type == 'drama':
            return analyze_voirdrama(soup)
        elif 'dramavostfr' in domain and element_type == 'drama':
            return analyze_dramavostfr(soup)
        elif 'mydramalist' in domain and element_type == 'drama':
            return analyze_mydramalist(soup)
        elif 'asianwiki' in domain and element_type == 'drama':
            return analyze_asianwiki(soup)
        elif 'dramacore' in domain and element_type == 'drama':
            return analyze_dramacore(soup)
        elif 'dramacool' in domain and element_type == 'drama':
            return analyze_dramacool(soup)
        elif 'voiranime' in domain and element_type == 'anime':
            return analyze_voiranime(soup)
        elif 'nekosama' in domain and element_type == 'anime':
            return analyze_nekosama(soup)
        elif 'animesama' in domain and element_type == 'anime':
            return analyze_animesama(soup)
        elif 'animevostfr' in domain and element_type == 'anime':
            return analyze_animevostfr(soup)
        elif 'otakufr' in domain and element_type == 'anime':
            return analyze_otakufr(soup)
        elif 'vostfree' in domain and element_type == 'anime':
            return analyze_vostfree(soup)
        elif 'filmcomplet' in domain and element_type == 'film':
            return analyze_filmcomplet(soup)
        elif 'streamingdivx' in domain and element_type == 'film':
            return analyze_streamingdivx(soup)
        elif 'streamingcommunity' in domain and element_type == 'film':
            return analyze_streamingcommunity(soup)
        elif 'filmapik' in domain and element_type == 'film':
            return analyze_filmapik(soup)
        elif 'bollyplay' in domain and element_type == 'bollywood':
            return analyze_bollyplay(soup)
        elif 'hindilinks4u' in domain and element_type == 'bollywood':
            return analyze_hindilinks4u(soup)
        
        # Generic analysis as fallback
        return generic_analyzer(soup, element_type)
        
    except Exception as e:
        return {
            "error": f"Error analyzing page: {str(e)}",
            "url": url,
            "element_type": element_type
        }

def generic_analyzer(soup, element_type):
    results = {
        "url": soup.url if hasattr(soup, 'url') else "",
        "element_type": element_type,
        "analysis_method": "generic"
    }
    
    # Title analysis
    title = soup.find('h1') or soup.find('title')
    if title:
        results['title_selector'] = generate_selector(title)
        results['title_text'] = title.text.strip()
    
    # Content containers analysis
    containers = []
    for tag in ['div', 'section', 'ul', 'main']:
        for element in soup.find_all(tag, class_=True):
            if len(element.find_all('a')) > 5 or len(element.find_all('img')) > 5:
                containers.append({
                    'selector': generate_selector(element),
                    'links_count': len(element.find_all('a')),
                    'images_count': len(element.find_all('img')),
                    'children_count': len(element.find_all()),
                    'text_sample': element.text[:100].strip()
                })
    
    results['potential_containers'] = sorted(containers, key=lambda x: x['links_count'] + x['images_count'], reverse=True)[:5]
    
    # Content items analysis
    items = []
    for tag in ['div', 'article', 'li', 'a']:
        for element in soup.find_all(tag, class_=True):
            if element.find('img') and element.find('a'):
                items.append({
                    'selector': generate_selector(element),
                    'has_image': bool(element.find('img')),
                    'has_link': bool(element.find('a')),
                    'text_sample': element.text[:50].strip()
                })
    
    results['potential_items'] = sorted(items, key=lambda x: 1 if x['has_image'] and x['has_link'] else 0, reverse=True)[:5]
    
    # Recommended selectors
    if results.get('potential_containers'):
        results['recommended_wait_selector'] = results['potential_containers'][0]['selector']
    
    if results.get('potential_items'):
        results['recommended_main_selector'] = results['potential_items'][0]['selector']
    
    return results

def generate_selector(element):
    """Generate optimal CSS selector for an element"""
    if element.name == 'a' and element.get('href'):
        return f'a[href*="{element["href"].split("/")[-1]}"]'
    if element.get('id'):
        return f'#{element["id"]}'
    
    # Build selector based on class
    selector = element.name
    if element.get('class'):
        selector += '.' + '.'.join(element['class'])
    
    return selector

# Domain-specific analyzers
def analyze_voirdrama(soup):
    results = {
        "url": "https://voirdrama.org/dramas/",
        "element_type": "drama",
        "analysis_method": "domain-specific"
    }
    
    # Analyze main content area
    content_area = soup.find('div', class_='site-content') or soup.find('main')
    if content_area:
        results['content_area_selector'] = generate_selector(content_area)
    
    # Find drama items
    drama_items = []
    for element in soup.find_all(['div', 'article']):
        if element.find('img') and element.find('a'):
            drama_items.append({
                'selector': generate_selector(element),
                'has_image': bool(element.find('img')),
                'has_link': bool(element.find('a')),
                'text_sample': element.text[:50].strip()
            })
    
    results['drama_items'] = sorted(drama_items, key=lambda x: 1 if x['has_image'] and x['has_link'] else 0, reverse=True)[:5]
    
    # Recommended selectors
    if content_area:
        results['recommended_wait_selector'] = results['content_area_selector']
    
    if results.get('drama_items'):
        results['recommended_main_selector'] = results['drama_items'][0]['selector']
    
    return results

def analyze_dramavostfr(soup):
    return {
        'title_selector': 'h1.title',
        'episodes_selector': 'div.episodes-list div.episode a',
        'image_selector': 'div.cover img',
        'synopsis_selector': 'div.synopsis',
        'recommended_wait_selector': 'div.episodes-list',
        'recommended_main_selector': 'div.episode a'
    }

def analyze_mydramalist(soup):
    return {
        'title_selector': 'h1.film-title',
        'items_selector': '.box',
        'recommended_wait_selector': '#content',
        'recommended_main_selector': '.box'
    }

def analyze_asianwiki(soup):
    return {
        'title_selector': '#firstHeading',
        'content_selector': '#mw-content-text',
        'recommended_wait_selector': '#content',
        'recommended_main_selector': '.mw-search-result-heading'
    }

def analyze_dramacore(soup):
    return {
        'title_selector': 'h1.entry-title',
        'recommended_wait_selector': '.movies-list',
        'recommended_main_selector': '.ml-item'
    }

def analyze_dramacool(soup):
    return {
        'title_selector': 'h1.title',
        'recommended_wait_selector': '.list-episode-item',
        'recommended_main_selector': '.list-drama-item'
    }

def analyze_voiranime(soup):
    return {
        'title_selector': 'h1.entry-title',
        'recommended_wait_selector': '.movies-list',
        'recommended_main_selector': '.ml-item'
    }

def analyze_nekosama(soup):
    return {
        'title_selector': 'h1.anime-title',
        'recommended_wait_selector': '.anime-list',
        'recommended_main_selector': '.anime-card'
    }

def analyze_animesama(soup):
    return {
        'title_selector': 'h1.anime-title',
        'recommended_wait_selector': '.anime-list',
        'recommended_main_selector': '.anime-card'
    }

def analyze_animevostfr(soup):
    return {
        'title_selector': 'h1.title',
        'recommended_wait_selector': '.movies-list',
        'recommended_main_selector': '.ml-item'
    }

def analyze_otakufr(soup):
    return {
        'title_selector': 'h1.title',
        'recommended_wait_selector': '.movies-list',
        'recommended_main_selector': '.ml-item'
    }

def analyze_vostfree(soup):
    return {
        'title_selector': 'h1.title',
        'recommended_wait_selector': '.movies-list',
        'recommended_main_selector': '.ml-item'
    }

def analyze_filmcomplet(soup):
    return {
        'title_selector': 'h1.entry-title',
        'recommended_wait_selector': '.movies-list',
        'recommended_main_selector': '.ml-item'
    }

def analyze_streamingdivx(soup):
    return {
        'title_selector': 'h1.title',
        'recommended_wait_selector': '.movies-list',
        'recommended_main_selector': '.ml-item'
    }

def analyze_streamingcommunity(soup):
    return {
        'title_selector': 'h1.film-title',
        'recommended_wait_selector': '.film-list',
        'recommended_main_selector': '.film-item'
    }

def analyze_filmapik(soup):
    return {
        'title_selector': 'h1.title',
        'recommended_wait_selector': '.movies-list',
        'recommended_main_selector': '.ml-item'
    }

def analyze_bollyplay(soup):
    return {
        'title_selector': 'h1.title',
        'recommended_wait_selector': '.movies-list',
        'recommended_main_selector': '.ml-item'
    }

def analyze_hindilinks4u(soup):
    return {
        'title_selector': 'h1.title',
        'recommended_wait_selector': '.movies-list',
        'recommended_main_selector': '.ml-item'
    }

def main():
    # Define sources to analyze
    sources = [
        # Dramas
        {"url": "https://voirdrama.org/dramas/", "type": "drama"},
        {"url": "https://dramavostfr.cc/films/", "type": "drama"},
        {"url": "https://mydramalist.com/shows/top", "type": "drama"},
        {"url": "https://asianwiki.com/Special:BrowseData/Dramas", "type": "drama"},
        {"url": "https://dramacore.cc/films/", "type": "drama"},
        {"url": "https://dramacool.cr/most-popular-drama", "type": "drama"},
        
        # Animes
        {"url": "https://voiranime.com/films/", "type": "anime"},
        {"url": "https://nekosama.fr/animes", "type": "anime"},
        {"url": "https://anime-sama.fr/catalogue/", "type": "anime"},
        {"url": "https://animevostfr.tv/animes/", "type": "anime"},
        {"url": "https://otakufr.co/anime/", "type": "anime"},
        {"url": "https://vostfree.cx/animes/", "type": "anime"},
        
        # Films
        {"url": "https://www.filmcomplet.tv/films/", "type": "film"},
        {"url": "https://streamingdivx.co/films/", "type": "film"},
        {"url": "https://streamingcommunity.best/film/", "type": "film"},
        {"url": "https://filmapik.website/movies/", "type": "film"},
        
        # Bollywood
        {"url": "https://bollyplay.net/movies/", "type": "bollywood"},
        {"url": "https://www.hindilinks4u.to/category/bollywood-movies/", "type": "bollywood"}
    ]
    
    # Create output directory
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "source-analysis")
    os.makedirs(output_dir, exist_ok=True)
    
    # Analyze each source
    results = {}
    for source in sources:
        print(f"Analyzing {source['url']}...")
        domain = urlparse(source['url']).netloc
        source_name = domain.split('.')[0]
        
        analysis = analyze_page(source['url'], source['type'])
        results[source_name] = analysis
        
        # Save individual result
        with open(os.path.join(output_dir, f"{source_name}_analysis.json"), 'w') as f:
            json.dump(analysis, f, indent=2)
    
    # Save combined results
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    with open(os.path.join(output_dir, f"all_sources_analysis_{timestamp}.json"), 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"Analysis complete. Results saved to {output_dir}")

if __name__ == "__main__":
    main()
