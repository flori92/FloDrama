#!/bin/bash

# Script de déploiement direct avec Wrangler

# Supprimer toute configuration existante
rm -rf ~/.wrangler/config

# Déployer avec Wrangler en mode OAuth
NODE_ENV=production CLOUDFLARE_API_TOKEN="" npx wrangler pages deploy dist --project-name flodrama-frontend

