#!/bin/bash

# Script pour vérifier l'état de la base de données FloDrama

echo "🔍 Vérification de l'état de la base de données FloDrama..."
echo "======================================================="

# Vérifier le nombre total d'entrées
echo "📊 Nombre total d'entrées dans la base de données:"
npx wrangler d1 execute flodrama-db --command="SELECT COUNT(*) as total FROM contents" --remote

echo ""
echo "📊 Répartition par source:"
npx wrangler d1 execute flodrama-db --command="SELECT source_id, COUNT(*) as total FROM contents GROUP BY source_id ORDER BY total DESC" --remote

echo ""
echo "📊 Répartition par type:"
npx wrangler d1 execute flodrama-db --command="SELECT type, COUNT(*) as total FROM contents GROUP BY type ORDER BY total DESC" --remote

echo ""
echo "📊 Répartition par année:"
npx wrangler d1 execute flodrama-db --command="SELECT release_year, COUNT(*) as total FROM contents WHERE release_year IS NOT NULL GROUP BY release_year ORDER BY release_year DESC" --remote

echo ""
echo "📊 Répartition par statut:"
npx wrangler d1 execute flodrama-db --command="SELECT status, COUNT(*) as total FROM contents GROUP BY status ORDER BY total DESC" --remote

echo ""
echo "======================================================="
echo "✅ Vérification terminée!"
