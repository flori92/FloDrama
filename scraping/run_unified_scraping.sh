#!/bin/bash
# Script de lancement du scraping unifié pour FloDrama - Migration Supabase

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

# Objectif : 200 items au total
total_items=0
target_items=200

# Lancement du scraping avec MyDramaList (priorité 1)
echo "🚀 Lancement du scraping MyDramaList..."
python -m scraping.sources.mydramalist
items_mdl=$(cat scraping/logs/mydramalist_report_*.json | grep -o '"items_scraped": [0-9]*' | grep -o '[0-9]*' | sort -n | tail -1)
total_items=$((total_items + items_mdl))
echo "✅ MyDramaList: $items_mdl items récupérés. Total: $total_items/$target_items"

# Si on n'a pas atteint l'objectif, lancer VoirDrama (priorité 2)
if [ $total_items -lt $target_items ]; then
  remaining=$((target_items - total_items))
  export MIN_ITEMS="$remaining"
  echo "🚀 Lancement du scraping VoirDrama (objectif: $remaining items)..."
  python -m scraping.sources.voirdrama
  items_vd=$(cat scraping/logs/voirdrama_report_*.json | grep -o '"items_scraped": [0-9]*' | grep -o '[0-9]*' | sort -n | tail -1)
  total_items=$((total_items + items_vd))
  echo "✅ VoirDrama: $items_vd items récupérés. Total: $total_items/$target_items"
fi

# Si on n'a pas atteint l'objectif, lancer Vostfree (priorité 3)
if [ $total_items -lt $target_items ] && [ -f "scraping/sources/vostfree.py" ]; then
  remaining=$((target_items - total_items))
  export MIN_ITEMS="$remaining"
  echo "🚀 Lancement du scraping Vostfree (objectif: $remaining items)..."
  python -m scraping.sources.vostfree
  items_vf=$(cat scraping/logs/vostfree_report_*.json | grep -o '"items_scraped": [0-9]*' | grep -o '[0-9]*' | sort -n | tail -1)
  total_items=$((total_items + items_vf))
  echo "✅ Vostfree: $items_vf items récupérés. Total: $total_items/$target_items"
fi

# Si on n'a pas atteint l'objectif, lancer Dramacool (priorité 4)
if [ $total_items -lt $target_items ] && [ -f "scraping/sources/dramacool.py" ]; then
  remaining=$((target_items - total_items))
  export MIN_ITEMS="$remaining"
  echo "🚀 Lancement du scraping Dramacool (objectif: $remaining items)..."
  python -m scraping.sources.dramacool
  items_dc=$(cat scraping/logs/dramacool_report_*.json | grep -o '"items_scraped": [0-9]*' | grep -o '[0-9]*' | sort -n | tail -1)
  total_items=$((total_items + items_dc))
  echo "✅ Dramacool: $items_dc items récupérés. Total: $total_items/$target_items"
fi

# Récapitulatif final
if [ $total_items -ge $target_items ]; then
  echo "✅ Objectif atteint! $total_items/$target_items items récupérés au total."
else
  echo "⚠️ Objectif non atteint. $total_items/$target_items items récupérés au total."
fi

echo "✅ Scraping terminé avec succès"
