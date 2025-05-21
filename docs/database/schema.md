# Schémas de Base de Données

## Architecture Actuelle

### 1. Base de Données Principale (`flodrama-db`)
Contient toutes les données utilisateurs, vidéos et métadonnées principales de l'application.

### 2. Base de Données de Streaming (`flodrama-streaming`)
Gère spécifiquement les flux de streaming et les métriques associées.

> **Note** : La base `flodrama-database` a été supprimée car elle était vide et non utilisée.

## Schéma Détaillé

### Base de Données Principale (`flodrama-db`)

#### Tables Principales

#### `users`
- `id` : TEXT (PRIMARY KEY)
- `email` : TEXT (UNIQUE)
- `username` : TEXT
- `created_at` : TIMESTAMP
- `updated_at` : TIMESTAMP

#### `videos`
- `id` : TEXT (PRIMARY KEY)
- `title` : TEXT
- `description` : TEXT
- `duration` : INTEGER
- `thumbnail_url` : TEXT
- `created_at` : TIMESTAMP
- `updated_at` : TIMESTAMP

#### `user_videos`
- `user_id` : TEXT (FOREIGN KEY)
- `video_id` : TEXT (FOREIGN KEY)
- `progress` : INTEGER
- `last_watched` : TIMESTAMP
- `is_favorite` : BOOLEAN
- `created_at` : TIMESTAMP
- `updated_at` : TIMESTAMP

## Base de Données de Streaming (`flodrama-streaming`)

### Tables Principales

#### `streams`
- `id` : TEXT (PRIMARY KEY)
- `video_id` : TEXT
- `status` : TEXT
- `started_at` : TIMESTAMP
- `ended_at` : TIMESTAMP
- `created_at` : TIMESTAMP
- `updated_at` : TIMESTAMP

#### `stream_qualities`
- `id` : TEXT (PRIMARY KEY)
- `stream_id` : TEXT (FOREIGN KEY)
- `quality` : TEXT
- `url` : TEXT
- `created_at` : TIMESTAMP
- `updated_at` : TIMESTAMP
