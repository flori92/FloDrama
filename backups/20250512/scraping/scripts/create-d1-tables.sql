-- Script de création des tables pour Cloudflare D1
-- Ce script crée les tables nécessaires pour stocker les données scrapées

-- Table pour les dramas
CREATE TABLE IF NOT EXISTS dramas (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  original_title TEXT,
  description TEXT,
  poster TEXT,
  backdrop TEXT,
  year INTEGER,
  rating REAL,
  content_type TEXT DEFAULT 'drama',
  source_url TEXT,
  episodes_count INTEGER,
  country TEXT,
  status TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- Table pour les animes
CREATE TABLE IF NOT EXISTS animes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  original_title TEXT,
  description TEXT,
  poster TEXT,
  backdrop TEXT,
  year INTEGER,
  rating REAL,
  content_type TEXT DEFAULT 'anime',
  source_url TEXT,
  episodes INTEGER,
  status TEXT,
  season TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- Table pour les films
CREATE TABLE IF NOT EXISTS films (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  original_title TEXT,
  description TEXT,
  poster TEXT,
  backdrop TEXT,
  year INTEGER,
  rating REAL,
  content_type TEXT DEFAULT 'film',
  source_url TEXT,
  duration INTEGER,
  country TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- Table pour les contenus bollywood
CREATE TABLE IF NOT EXISTS bollywood (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  original_title TEXT,
  description TEXT,
  poster TEXT,
  backdrop TEXT,
  year INTEGER,
  rating REAL,
  content_type TEXT DEFAULT 'bollywood',
  source_url TEXT,
  duration INTEGER,
  created_at TEXT,
  updated_at TEXT
);

-- Table pour les logs de scraping
CREATE TABLE IF NOT EXISTS scraping_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  count INTEGER,
  is_mock BOOLEAN,
  success BOOLEAN,
  error TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
