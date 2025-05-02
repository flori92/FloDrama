#!/bin/bash
# Script de lancement du scraping complet pour FloDrama - Migration Supabase

# Création du répertoire de logs
mkdir -p logs

# Chargement des variables d'environnement
export SUPABASE_URL="https://fffgoqubrbgppcqqkyod.supabase.co"
export SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZmdvcXVicmJncHBjcXFreW9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMDY3ODYxMSwiZXhwIjoyMDI2MjU0NjExfQ.MbJfYXbXKuBg2fJCwVdxB5pEU8cO1FjLnXtvQQFTg0k"
export SUPABASE_STORAGE_BUCKET="flodrama-images"
export MIN_ITEMS="200"

# Vérification des variables d'environnement
if [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "❌ Erreur : Variable d'environnement SUPABASE_SERVICE_KEY non définie"
  exit 1
fi

echo "✅ Variables d'environnement chargées"
echo "🔹 SUPABASE_URL: $SUPABASE_URL"
echo "🔹 SUPABASE_STORAGE_BUCKET: $SUPABASE_STORAGE_BUCKET"
echo "🔹 MIN_ITEMS: $MIN_ITEMS"

# Fonction pour exécuter un scraper et afficher les résultats
run_scraper() {
  category=$1
  scraper=$2
  target_items=$3
  
  echo "🚀 Lancement du scraping $scraper pour $category (objectif: $target_items items)..."
  python -m scraping.sources.$scraper
  
  # Récupération du nombre d'items scrapés depuis le rapport
  items_scraped=$(cat scraping/logs/${scraper}_report_*.json 2>/dev/null | grep -o '"items_scraped": [0-9]*' | grep -o '[0-9]*' | sort -n | tail -1)
  
  if [ -z "$items_scraped" ]; then
    items_scraped=0
  fi
  
  echo "✅ $scraper: $items_scraped items récupérés"
  echo "$items_scraped"
}

# ===== SCRAPING DES DRAMAS =====
echo "📺 SCRAPING DES DRAMAS"
echo "======================="

# Objectif : 200 items au total
total_items=0
target_items=200

# Lancement du scraping avec MyDramaList (priorité 1)
items_mdl=$(run_scraper "dramas" "mydramalist" $target_items)
total_items=$((total_items + items_mdl))
echo "📊 Total dramas: $total_items/$target_items"

# Si on n'a pas atteint l'objectif, lancer VoirDrama (priorité 2)
if [ $total_items -lt $target_items ]; then
  remaining=$((target_items - total_items))
  export MIN_ITEMS="$remaining"
  items_vd=$(run_scraper "dramas" "voirdrama" $remaining)
  total_items=$((total_items + items_vd))
  echo "📊 Total dramas: $total_items/$target_items"
fi

# Si on n'a pas atteint l'objectif, lancer Vostfree (priorité 3)
if [ $total_items -lt $target_items ] && [ -f "scraping/sources/vostfree.py" ]; then
  remaining=$((target_items - total_items))
  export MIN_ITEMS="$remaining"
  items_vf=$(run_scraper "dramas" "vostfree" $remaining)
  total_items=$((total_items + items_vf))
  echo "📊 Total dramas: $total_items/$target_items"
fi

# Si on n'a pas atteint l'objectif, lancer Dramacool (priorité 4)
if [ $total_items -lt $target_items ] && [ -f "scraping/sources/dramacool.py" ]; then
  remaining=$((target_items - total_items))
  export MIN_ITEMS="$remaining"
  items_dc=$(run_scraper "dramas" "dramacool" $remaining)
  total_items=$((total_items + items_dc))
  echo "📊 Total dramas: $total_items/$target_items"
fi

# Récapitulatif final dramas
if [ $total_items -ge $target_items ]; then
  echo "✅ Objectif atteint pour les dramas! $total_items/$target_items items récupérés au total."
else
  echo "⚠️ Objectif non atteint pour les dramas. $total_items/$target_items items récupérés au total."
fi

# ===== SCRAPING DES ANIMES =====
echo ""
echo "🎬 SCRAPING DES ANIMES"
echo "======================"

# Réinitialisation pour les animés
export MIN_ITEMS="200"
total_items=0
target_items=200

# Lancement du scraping avec GogoAnime (priorité 1)
if [ -f "scraping/sources/gogoanime.py" ]; then
  items_ga=$(run_scraper "animes" "gogoanime" $target_items)
  total_items=$((total_items + items_ga))
  echo "📊 Total animés: $total_items/$target_items"
fi

# Si on n'a pas atteint l'objectif, lancer VoirAnime (priorité 2)
if [ $total_items -lt $target_items ] && [ -f "scraping/sources/voiranime.py" ]; then
  remaining=$((target_items - total_items))
  export MIN_ITEMS="$remaining"
  items_va=$(run_scraper "animes" "voiranime" $remaining)
  total_items=$((total_items + items_va))
  echo "📊 Total animés: $total_items/$target_items"
fi

# Si on n'a pas atteint l'objectif, lancer Neko-Sama (priorité 3)
if [ $total_items -lt $target_items ] && [ -f "scraping/sources/nekosama.py" ]; then
  remaining=$((target_items - total_items))
  export MIN_ITEMS="$remaining"
  items_ns=$(run_scraper "animes" "nekosama" $remaining)
  total_items=$((total_items + items_ns))
  echo "📊 Total animés: $total_items/$target_items"
fi

# Récapitulatif final animés
if [ $total_items -ge $target_items ]; then
  echo "✅ Objectif atteint pour les animés! $total_items/$target_items items récupérés au total."
else
  echo "⚠️ Objectif non atteint pour les animés. $total_items/$target_items items récupérés au total."
fi

# ===== SCRAPING DES FILMS =====
echo ""
echo "🎥 SCRAPING DES FILMS"
echo "===================="

# Réinitialisation pour les films
export MIN_ITEMS="200"
total_items=0
target_items=200

# Lancement du scraping avec AsianWiki (priorité 1)
if [ -f "scraping/sources/asianwiki.py" ]; then
  items_asianwiki=$(run_scraper "films" "asianwiki" $target_items)
  total_items=$((total_items + items_asianwiki))
  echo "📊 Total films: $total_items/$target_items"
fi

# Si on n'a pas atteint l'objectif, lancer FilmApik (priorité 2)
if [ $total_items -lt $target_items ] && [ -f "scraping/sources/filmapik.py" ]; then
  remaining=$((target_items - total_items))
  export MIN_ITEMS="$remaining"
  items_filmapik=$(run_scraper "films" "filmapik" $remaining)
  total_items=$((total_items + items_filmapik))
  echo "📊 Total films: $total_items/$target_items"
fi

# Récapitulatif final films
if [ $total_items -ge $target_items ]; then
  echo "✅ Objectif atteint pour les films! $total_items/$target_items items récupérés au total."
else
  echo "⚠️ Objectif non atteint pour les films. $total_items/$target_items items récupérés au total."
fi

# ===== SCRAPING DE BOLLYWOOD =====
echo ""
echo "🎭 SCRAPING DE BOLLYWOOD"
echo "======================="

# Réinitialisation pour Bollywood
export MIN_ITEMS="200"
total_items=0
target_items=200

# Lancement du scraping avec BollywoodMDB (priorité 1)
if [ -f "scraping/sources/bollywoodmdb.py" ]; then
  items_bmdb=$(run_scraper "bollywood" "bollywoodmdb" $target_items)
  total_items=$((total_items + items_bmdb))
  echo "📊 Total Bollywood: $total_items/$target_items"
fi

# Si on n'a pas atteint l'objectif, lancer Zee5 (priorité 2)
if [ $total_items -lt $target_items ] && [ -f "scraping/sources/zee5.py" ]; then
  remaining=$((target_items - total_items))
  export MIN_ITEMS="$remaining"
  items_zee5=$(run_scraper "bollywood" "zee5" $remaining)
  total_items=$((total_items + items_zee5))
  echo "📊 Total Bollywood: $total_items/$target_items"
fi

# Si on n'a pas atteint l'objectif, lancer Bollywood (priorité 3)
if [ $total_items -lt $target_items ] && [ -f "scraping/sources/bollywood.py" ]; then
  remaining=$((target_items - total_items))
  export MIN_ITEMS="$remaining"
  items_bollywood=$(run_scraper "bollywood" "bollywood" $remaining)
  total_items=$((total_items + items_bollywood))
  echo "📊 Total Bollywood: $total_items/$target_items"
fi

# Récapitulatif final Bollywood
if [ $total_items -ge $target_items ]; then
  echo "✅ Objectif atteint pour Bollywood! $total_items/$target_items items récupérés au total."
else
  echo "⚠️ Objectif non atteint pour Bollywood. $total_items/$target_items items récupérés au total."
fi

echo ""
echo "✅ Scraping complet terminé avec succès"
