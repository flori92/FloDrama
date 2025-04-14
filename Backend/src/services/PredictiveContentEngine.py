"""
Service de prédiction de contenu pour FloDrama
Ce module implémente un système prédictif qui anticipe les tendances
pour alimenter FloDrama avec du contenu avant qu'il ne devienne viral.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import os
import requests
import json
from pymongo import MongoClient
from ..config.scraping_config import STREAMING_SOURCES, HTTP_HEADERS

class PredictiveContentEngine:
    def __init__(self, mongodb_uri=None):
        """
        Initialise le moteur de prédiction de contenu
        
        Args:
            mongodb_uri: URI de connexion à MongoDB
        """
        self.trending_threshold = 0.75
        self.anticipation_window = 14  # jours
        self.model_path = os.path.join(os.path.dirname(__file__), '../models/trending_predictor.joblib')
        self.scaler_path = os.path.join(os.path.dirname(__file__), '../models/scaler.joblib')
        
        # Initialisation de la connexion MongoDB
        if mongodb_uri:
            self.client = MongoClient(mongodb_uri)
            self.db = self.client.flodrama
            self.content_collection = self.db.content
            self.trends_collection = self.db.trends
        
        # Chargement du modèle s'il existe, sinon création d'un nouveau
        self._load_or_create_model()
        
        # Configuration du logger
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger('PredictiveContentEngine')
    
    def _load_or_create_model(self):
        """Charge le modèle existant ou en crée un nouveau"""
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                self.scaler = joblib.load(self.scaler_path)
                self.logger.info("Modèle de prédiction chargé avec succès")
            else:
                self.logger.info("Création d'un nouveau modèle de prédiction")
                self.model = RandomForestClassifier(
                    n_estimators=100, 
                    max_depth=10,
                    random_state=42
                )
                self.scaler = StandardScaler()
                # Créer les répertoires si nécessaire
                os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        except Exception as e:
            self.logger.error(f"Erreur lors du chargement du modèle: {str(e)}")
            self.model = RandomForestClassifier(
                n_estimators=100, 
                max_depth=10,
                random_state=42
            )
            self.scaler = StandardScaler()
    
    def extract_early_indicators(self, social_signals):
        """
        Extrait les indicateurs précoces à partir des signaux sociaux
        
        Args:
            social_signals: Données des signaux sociaux (Reddit, Twitter, etc.)
            
        Returns:
            DataFrame contenant les indicateurs précoces
        """
        indicators = pd.DataFrame()
        
        # Traitement des signaux Reddit
        if 'reddit' in social_signals:
            reddit_data = social_signals['reddit']
            indicators['reddit_mentions'] = reddit_data.get('mentions', 0)
            indicators['reddit_upvote_ratio'] = reddit_data.get('upvote_ratio', 0.5)
            indicators['reddit_comment_velocity'] = reddit_data.get('comment_velocity', 0)
            
        # Traitement des signaux Twitter
        if 'twitter' in social_signals:
            twitter_data = social_signals['twitter']
            indicators['twitter_mentions'] = twitter_data.get('mentions', 0)
            indicators['twitter_retweet_ratio'] = twitter_data.get('retweet_ratio', 0)
            indicators['twitter_hashtag_momentum'] = twitter_data.get('hashtag_momentum', 0)
        
        # Traitement des signaux MyDramaList
        if 'mydramalist' in social_signals:
            mdl_data = social_signals['mydramalist']
            indicators['mdl_rating'] = mdl_data.get('rating', 0)
            indicators['mdl_rating_count'] = mdl_data.get('rating_count', 0)
            indicators['mdl_watchlist_adds'] = mdl_data.get('watchlist_adds', 0)
            indicators['mdl_review_sentiment'] = mdl_data.get('review_sentiment', 0)
        
        # Traitement des signaux YouTube
        if 'youtube' in social_signals:
            youtube_data = social_signals['youtube']
            indicators['youtube_trailer_views'] = youtube_data.get('trailer_views', 0)
            indicators['youtube_like_ratio'] = youtube_data.get('like_ratio', 0)
            indicators['youtube_comment_sentiment'] = youtube_data.get('comment_sentiment', 0)
        
        # Normalisation des indicateurs
        return indicators
    
    def apply_ml_model(self, early_indicators, historical_data):
        """
        Applique le modèle de machine learning pour prédire les tendances
        
        Args:
            early_indicators: Indicateurs précoces extraits
            historical_data: Données historiques pour le contexte
            
        Returns:
            DataFrame avec les prédictions de tendance
        """
        # Fusion des indicateurs avec les données historiques
        features = self._prepare_features(early_indicators, historical_data)
        
        # Normalisation des caractéristiques
        if not features.empty:
            scaled_features = self.scaler.transform(features)
            
            # Prédiction des probabilités de tendance
            trend_probs = self.model.predict_proba(scaled_features)[:, 1]
            
            # Ajout des probabilités au DataFrame
            result = historical_data.copy()
            result['trend_probability'] = trend_probs
            
            # Filtrage des contenus avec une probabilité supérieure au seuil
            trending_content = result[result['trend_probability'] >= self.trending_threshold]
            
            return trending_content.sort_values('trend_probability', ascending=False)
        
        return pd.DataFrame()
    
    def _prepare_features(self, early_indicators, historical_data):
        """Prépare les caractéristiques pour le modèle"""
        if early_indicators.empty or historical_data.empty:
            return pd.DataFrame()
        
        # Fusion des données
        merged_data = pd.merge(
            historical_data,
            early_indicators,
            left_index=True,
            right_index=True,
            how='inner'
        )
        
        # Sélection des colonnes pertinentes pour la prédiction
        feature_columns = [
            'reddit_mentions', 'reddit_upvote_ratio', 'reddit_comment_velocity',
            'twitter_mentions', 'twitter_retweet_ratio', 'twitter_hashtag_momentum',
            'mdl_rating', 'mdl_rating_count', 'mdl_watchlist_adds', 'mdl_review_sentiment',
            'youtube_trailer_views', 'youtube_like_ratio', 'youtube_comment_sentiment',
            'historical_views', 'days_since_release', 'genre_popularity'
        ]
        
        # Filtrage des colonnes disponibles
        available_columns = [col for col in feature_columns if col in merged_data.columns]
        
        return merged_data[available_columns]
    
    def prioritize_scraping_targets(self, predicted_trends):
        """
        Priorise les cibles de scraping en fonction des prédictions
        
        Args:
            predicted_trends: DataFrame contenant les prédictions de tendance
            
        Returns:
            Liste des cibles de scraping priorisées
        """
        if predicted_trends.empty:
            return []
        
        # Création de la liste des cibles priorisées
        prioritized_targets = []
        
        for _, content in predicted_trends.iterrows():
            target = {
                'title': content.get('title', ''),
                'source': content.get('source', ''),
                'url': content.get('url', ''),
                'priority': float(content.get('trend_probability', 0)),
                'predicted_popularity': float(content.get('trend_probability', 0) * 100),
                'genre': content.get('genre', ''),
                'type': content.get('type', '')
            }
            prioritized_targets.append(target)
        
        return prioritized_targets
    
    def collect_social_signals(self, content_title, content_type='drama'):
        """
        Collecte les signaux sociaux pour un contenu spécifique
        
        Args:
            content_title: Titre du contenu
            content_type: Type de contenu (drama, anime, movie, etc.)
            
        Returns:
            Dictionnaire contenant les signaux sociaux
        """
        social_signals = {
            'reddit': self._collect_reddit_signals(content_title, content_type),
            'twitter': self._collect_twitter_signals(content_title, content_type),
            'mydramalist': self._collect_mdl_signals(content_title, content_type),
            'youtube': self._collect_youtube_signals(content_title, content_type)
        }
        
        return social_signals
    
    def _collect_reddit_signals(self, content_title, content_type):
        """Collecte les signaux depuis Reddit"""
        # Simulation de collecte de données Reddit
        # Dans une implémentation réelle, utiliser l'API Reddit
        return {
            'mentions': np.random.randint(0, 1000),
            'upvote_ratio': np.random.uniform(0.5, 1.0),
            'comment_velocity': np.random.randint(0, 100)
        }
    
    def _collect_twitter_signals(self, content_title, content_type):
        """Collecte les signaux depuis Twitter"""
        # Simulation de collecte de données Twitter
        # Dans une implémentation réelle, utiliser l'API Twitter
        return {
            'mentions': np.random.randint(0, 5000),
            'retweet_ratio': np.random.uniform(0, 0.5),
            'hashtag_momentum': np.random.uniform(0, 10)
        }
    
    def _collect_mdl_signals(self, content_title, content_type):
        """Collecte les signaux depuis MyDramaList"""
        # Tentative de collecte réelle depuis MyDramaList
        try:
            # Formatage de l'URL de recherche
            search_url = f"{STREAMING_SOURCES['mydramalist']['base_url']}/search?q={content_title.replace(' ', '+')}"
            
            # Envoi de la requête
            response = requests.get(search_url, headers=HTTP_HEADERS)
            
            if response.status_code == 200:
                # Traitement simplifié - dans une implémentation réelle, utiliser BeautifulSoup
                rating = 0
                rating_count = 0
                watchlist_adds = 0
                
                # Extraction basique des données (à améliorer avec un parser HTML)
                if 'rating' in response.text:
                    rating = float(response.text.split('rating">')[1].split('<')[0]) if 'rating">' in response.text else 0
                
                if 'users rated this' in response.text:
                    rating_count_text = response.text.split('users rated this')[0].split('>')[-1]
                    rating_count = int(rating_count_text.replace(',', '')) if rating_count_text.strip().isdigit() else 0
                
                if 'add to watchlist' in response.text.lower():
                    watchlist_text = response.text.split('add to watchlist')[0].split('>')[-1]
                    watchlist_adds = int(watchlist_text.replace(',', '')) if watchlist_text.strip().isdigit() else 0
                
                return {
                    'rating': rating,
                    'rating_count': rating_count,
                    'watchlist_adds': watchlist_adds,
                    'review_sentiment': np.random.uniform(-1, 1)  # Simulé pour l'instant
                }
        except Exception as e:
            self.logger.error(f"Erreur lors de la collecte des signaux MDL: {str(e)}")
        
        # Valeurs par défaut en cas d'échec
        return {
            'rating': np.random.uniform(6, 9),
            'rating_count': np.random.randint(0, 10000),
            'watchlist_adds': np.random.randint(0, 5000),
            'review_sentiment': np.random.uniform(-1, 1)
        }
    
    def _collect_youtube_signals(self, content_title, content_type):
        """Collecte les signaux depuis YouTube"""
        # Simulation de collecte de données YouTube
        # Dans une implémentation réelle, utiliser l'API YouTube
        return {
            'trailer_views': np.random.randint(0, 1000000),
            'like_ratio': np.random.uniform(0.7, 0.99),
            'comment_sentiment': np.random.uniform(-0.5, 1)
        }
    
    def train_model(self, training_data):
        """
        Entraîne le modèle de prédiction avec de nouvelles données
        
        Args:
            training_data: DataFrame contenant les données d'entraînement
            
        Returns:
            Score d'exactitude du modèle
        """
        if training_data.empty:
            self.logger.warning("Données d'entraînement vides, impossible d'entraîner le modèle")
            return 0
        
        try:
            # Préparation des données
            X = training_data.drop(['is_trending', 'title', 'url'], axis=1, errors='ignore')
            y = training_data['is_trending']
            
            # Normalisation des caractéristiques
            X_scaled = self.scaler.fit_transform(X)
            
            # Entraînement du modèle
            self.model.fit(X_scaled, y)
            
            # Sauvegarde du modèle
            joblib.dump(self.model, self.model_path)
            joblib.dump(self.scaler, self.scaler_path)
            
            # Calcul du score
            score = self.model.score(X_scaled, y)
            self.logger.info(f"Modèle entraîné avec un score de {score}")
            
            return score
        
        except Exception as e:
            self.logger.error(f"Erreur lors de l'entraînement du modèle: {str(e)}")
            return 0
    
    def predict_trending_content(self, historical_data=None, social_signals=None):
        """
        Prédit les contenus qui vont devenir tendance
        
        Args:
            historical_data: Données historiques (optionnel)
            social_signals: Signaux sociaux (optionnel)
            
        Returns:
            Liste des cibles de scraping priorisées
        """
        # Si aucune donnée n'est fournie, récupérer depuis MongoDB
        if historical_data is None:
            historical_data = self._get_historical_data()
        
        if social_signals is None:
            social_signals = {}
            for _, content in historical_data.iterrows():
                title = content.get('title', '')
                content_type = content.get('type', 'drama')
                social_signals[title] = self.collect_social_signals(title, content_type)
        
        # Extraction des indicateurs précoces
        early_indicators = self.extract_early_indicators(social_signals)
        
        # Application du modèle de ML
        predicted_trends = self.apply_ml_model(early_indicators, historical_data)
        
        # Priorisation des cibles de scraping
        return self.prioritize_scraping_targets(predicted_trends)
    
    def _get_historical_data(self):
        """Récupère les données historiques depuis MongoDB"""
        try:
            if hasattr(self, 'content_collection'):
                # Récupération des données de contenu
                content_data = list(self.content_collection.find({}, {
                    'title': 1, 
                    'type': 1, 
                    'genre': 1, 
                    'views': 1, 
                    'release_date': 1,
                    'source': 1,
                    'url': 1
                }))
                
                # Récupération des données de tendance
                trend_data = list(self.trends_collection.find({}, {
                    'title': 1,
                    'is_trending': 1
                }))
                
                # Conversion en DataFrame
                content_df = pd.DataFrame(content_data)
                trend_df = pd.DataFrame(trend_data)
                
                # Fusion des données
                if not content_df.empty and not trend_df.empty:
                    merged_df = pd.merge(content_df, trend_df, on='title', how='left')
                    merged_df['is_trending'] = merged_df['is_trending'].fillna(False)
                    
                    # Calcul des jours depuis la sortie
                    merged_df['release_date'] = pd.to_datetime(merged_df['release_date'], errors='coerce')
                    merged_df['days_since_release'] = (datetime.now() - merged_df['release_date']).dt.days
                    
                    # Renommage des colonnes
                    merged_df.rename(columns={'views': 'historical_views'}, inplace=True)
                    
                    # Calcul de la popularité du genre
                    genre_popularity = merged_df.groupby('genre')['historical_views'].mean().to_dict()
                    merged_df['genre_popularity'] = merged_df['genre'].map(genre_popularity)
                    
                    return merged_df
        
        except Exception as e:
            self.logger.error(f"Erreur lors de la récupération des données historiques: {str(e)}")
        
        # Création d'un DataFrame vide en cas d'échec
        return pd.DataFrame()
    
    def update_scraping_priorities(self):
        """
        Met à jour les priorités de scraping dans la base de données
        
        Returns:
            Nombre de documents mis à jour
        """
        try:
            if not hasattr(self, 'db'):
                self.logger.warning("Pas de connexion à la base de données")
                return 0
            
            # Prédiction des tendances
            prioritized_targets = self.predict_trending_content()
            
            # Mise à jour des priorités dans la collection de configuration
            updates = 0
            for target in prioritized_targets:
                result = self.db.scraping_config.update_one(
                    {'title': target['title']},
                    {'$set': {
                        'priority': target['priority'],
                        'predicted_popularity': target['predicted_popularity'],
                        'last_updated': datetime.now()
                    }},
                    upsert=True
                )
                
                if result.modified_count > 0 or result.upserted_id is not None:
                    updates += 1
            
            self.logger.info(f"Mise à jour de {updates} priorités de scraping")
            return updates
        
        except Exception as e:
            self.logger.error(f"Erreur lors de la mise à jour des priorités: {str(e)}")
            return 0
    
    def get_top_trending_predictions(self, limit=10):
        """
        Récupère les prédictions de tendance les plus élevées
        
        Args:
            limit: Nombre maximum de prédictions à retourner
            
        Returns:
            Liste des prédictions de tendance
        """
        prioritized_targets = self.predict_trending_content()
        return prioritized_targets[:limit]
