# Migration de FloDrama vers Cloudflare

Ce dossier contient tous les fichiers nécessaires pour migrer l'application FloDrama de Vercel/Supabase vers Cloudflare.

## Structure du projet

```
cloudflare/
├── .env                # Variables d'environnement (ne pas commiter)
├── frontend/          # Application frontend (Cloudflare Pages)
├── backend/           # API backend (Cloudflare Workers)
└── scraping/          # Système de scraping (Cloudflare Workers + Cron)
```

## Prérequis

- Node.js v16+
- npm ou yarn
- Wrangler CLI (`npm install -g wrangler`)
- Compte Cloudflare (déjà configuré)

## Installation

1. Installer les dépendances globales :
   ```bash
   npm install -g wrangler
   ```

2. Se connecter à Cloudflare :
   ```bash
   wrangler login
   ```

3. Initialiser chaque projet :
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   cd ../scraping && npm install
   ```

## Déploiement

Suivre les instructions dans chaque dossier pour déployer les différentes parties de l'application.

## Informations importantes

- ID de compte Cloudflare : 42fc982266a2c31b942593b18097e4b3
- Sous-domaine Cloudflare Stream : customer-ehlynuge6dnzfnfd.cloudflarestream.com
