-- Migration pour la création des tables d'analytics
-- Créée le 30 avril 2025

-- Table pour stocker les événements d'analytics
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  event_data JSONB,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  url TEXT NOT NULL,
  referrer TEXT,
  device_type TEXT NOT NULL,
  browser TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour accélérer les requêtes
CREATE INDEX IF NOT EXISTS analytics_events_event_name_idx ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS analytics_events_user_id_idx ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS analytics_events_session_id_idx ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS analytics_events_timestamp_idx ON analytics_events(timestamp);

-- Table pour les métriques agrégées quotidiennes
CREATE TABLE IF NOT EXISTS analytics_daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  dimensions JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(date, metric_name, (dimensions->>'dimension_key'))
);

-- Fonction pour agréger les métriques quotidiennes
CREATE OR REPLACE FUNCTION aggregate_daily_metrics()
RETURNS void AS $$
DECLARE
  yesterday DATE := (current_date - interval '1 day')::DATE;
BEGIN
  -- Nombre de visites par jour
  INSERT INTO analytics_daily_metrics (date, metric_name, metric_value, dimensions)
  SELECT 
    yesterday AS date,
    'page_views' AS metric_name,
    COUNT(*) AS metric_value,
    jsonb_build_object('dimension_key', 'total') AS dimensions
  FROM analytics_events
  WHERE 
    event_name = 'page_view' 
    AND timestamp::DATE = yesterday
  ON CONFLICT (date, metric_name, (dimensions->>'dimension_key'))
  DO UPDATE SET 
    metric_value = EXCLUDED.metric_value,
    updated_at = now();

  -- Nombre de visites par page
  INSERT INTO analytics_daily_metrics (date, metric_name, metric_value, dimensions)
  SELECT 
    yesterday AS date,
    'page_views_by_path' AS metric_name,
    COUNT(*) AS metric_value,
    jsonb_build_object(
      'dimension_key', (event_data->>'path'),
      'path', (event_data->>'path')
    ) AS dimensions
  FROM analytics_events
  WHERE 
    event_name = 'page_view' 
    AND timestamp::DATE = yesterday
    AND event_data->>'path' IS NOT NULL
  GROUP BY event_data->>'path'
  ON CONFLICT (date, metric_name, (dimensions->>'dimension_key'))
  DO UPDATE SET 
    metric_value = EXCLUDED.metric_value,
    updated_at = now();

  -- Nombre de sessions uniques
  INSERT INTO analytics_daily_metrics (date, metric_name, metric_value, dimensions)
  SELECT 
    yesterday AS date,
    'unique_sessions' AS metric_name,
    COUNT(DISTINCT session_id) AS metric_value,
    jsonb_build_object('dimension_key', 'total') AS dimensions
  FROM analytics_events
  WHERE timestamp::DATE = yesterday
  ON CONFLICT (date, metric_name, (dimensions->>'dimension_key'))
  DO UPDATE SET 
    metric_value = EXCLUDED.metric_value,
    updated_at = now();

  -- Nombre d'utilisateurs uniques
  INSERT INTO analytics_daily_metrics (date, metric_name, metric_value, dimensions)
  SELECT 
    yesterday AS date,
    'unique_users' AS metric_name,
    COUNT(DISTINCT user_id) AS metric_value,
    jsonb_build_object('dimension_key', 'total') AS dimensions
  FROM analytics_events
  WHERE 
    timestamp::DATE = yesterday 
    AND user_id IS NOT NULL
  ON CONFLICT (date, metric_name, (dimensions->>'dimension_key'))
  DO UPDATE SET 
    metric_value = EXCLUDED.metric_value,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Création d'un trigger pour exécuter l'agrégation tous les jours à 1h du matin
SELECT cron.schedule(
  'aggregate-daily-metrics',
  '0 1 * * *',
  $$SELECT aggregate_daily_metrics()$$
);

-- Politique RLS pour les événements d'analytics
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Seuls les administrateurs peuvent voir tous les événements
CREATE POLICY "Admins can view all analytics events" 
  ON analytics_events FOR SELECT 
  USING (auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE auth.email() IN ('admin@flodrama.com')
  ));

-- Les utilisateurs peuvent voir leurs propres événements
CREATE POLICY "Users can view their own analytics events" 
  ON analytics_events FOR SELECT 
  USING (auth.uid() = user_id);

-- Politique RLS pour les métriques agrégées
ALTER TABLE analytics_daily_metrics ENABLE ROW LEVEL SECURITY;

-- Seuls les administrateurs peuvent voir les métriques
CREATE POLICY "Only admins can view analytics metrics" 
  ON analytics_daily_metrics FOR SELECT 
  USING (auth.uid() IN (
    SELECT auth.uid() FROM auth.users 
    WHERE auth.email() IN ('admin@flodrama.com')
  ));
