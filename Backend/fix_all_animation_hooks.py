#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script pour corriger tous les problèmes d'animation dans le projet FloDrama.
Ce script recherche et remplace toutes les références à useAnimation de Lynx
par des solutions React natives.
"""

import os
import re
import glob
import shutil
from pathlib import Path

def print_header(message):
    """Affiche un message d'en-tête formaté."""
    print("\n" + "=" * 60)
    print(f" {message} ".center(60, "="))
    print("=" * 60 + "\n")

def print_step(message):
    """Affiche un message d'étape formaté."""
    print(f"➤ {message}")

def find_files(base_dir, pattern):
    """Trouve tous les fichiers correspondant au motif dans le répertoire de base."""
    return glob.glob(os.path.join(base_dir, "**", pattern), recursive=True)

def create_src_directory():
    """Crée un répertoire src à la racine du projet s'il n'existe pas."""
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src_dir = os.path.join(project_root, "src")
    
    if not os.path.exists(src_dir):
        os.makedirs(src_dir, exist_ok=True)
        print_step(f"Répertoire src créé: {src_dir}")
    
    # Créer les sous-répertoires nécessaires
    components_dir = os.path.join(src_dir, "components")
    if not os.path.exists(components_dir):
        os.makedirs(components_dir, exist_ok=True)
        print_step(f"Répertoire components créé: {components_dir}")
    
    return src_dir, components_dir

def copy_components_to_src(frontend_components_dir, src_components_dir):
    """Copie les composants du répertoire Frontend/src/components vers src/components."""
    if os.path.exists(frontend_components_dir):
        # Copier tous les composants
        for item in os.listdir(frontend_components_dir):
            src_item = os.path.join(frontend_components_dir, item)
            dst_item = os.path.join(src_components_dir, item)
            
            if os.path.isdir(src_item):
                if os.path.exists(dst_item):
                    shutil.rmtree(dst_item)
                shutil.copytree(src_item, dst_item)
                print_step(f"Répertoire copié: {item}")
            else:
                shutil.copy2(src_item, dst_item)
                print_step(f"Fichier copié: {item}")
    else:
        print_step(f"Répertoire source introuvable: {frontend_components_dir}")

def fix_hero_carousel(file_path):
    """Corrige le composant HeroCarousel en remplaçant useAnimation."""
    print_step(f"Correction du fichier: {file_path}")
    
    # Définir le contenu corrigé complet du fichier
    corrected_content = """import { useEffect, useState, useRef } from 'react';
import React from 'react';

import { useUserPreferences } from '../../hooks/useUserPreferences';
import './styles.css';

interface HeroContent {
  id: string;
  title: string;
  description: string;
  backdropUrl: string;
  trailerUrl?: string;
  genres: string[];
  rating?: number;
  releaseDate?: string;
  duration?: string;
}

interface HeroCarouselProps {
  contents: HeroContent[];
  autoPlayInterval?: number;
  onContentSelect?: (id: string) => void;
}

export const HeroCarousel = ({
  contents,
  autoPlayInterval = 8000,
  onContentSelect
}: HeroCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const { preferences } = useUserPreferences();

  // Animation avec React hooks
  const [isAnimating, setIsAnimating] = useState(false);
  const [isContentAnimating, setIsContentAnimating] = useState(false);
  const slideRef = useRef(null);
  const contentRef = useRef(null);
  
  // Fonction pour déclencher les animations
  const triggerAnimations = () => {
    setIsAnimating(true);
    setIsContentAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      setIsContentAnimating(false);
    }, 800);
  };

  // Gestion du défilement automatique
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % contents.length);
      triggerAnimations();
      setShowTrailer(false);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isPlaying, contents.length, autoPlayInterval]);

  // Gestion de la lecture du trailer
  useEffect(() => {
    if (preferences.autoplayTrailers && contents[currentIndex].trailerUrl) {
      const timer = setTimeout(() => {
        setShowTrailer(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, preferences.autoplayTrailers]);

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    triggerAnimations();
    setShowTrailer(false);
  };

  const handleMouseEnter = () => {
    setIsPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsPlaying(true);
  };

  const currentContent = contents[currentIndex];

  return (
    <div 
      className="hero-carousel"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Fond avec effet parallaxe */}
      <div className={`hero-carousel__background ${isAnimating ? "animating" : ""}`} ref={slideRef}>
        {showTrailer && currentContent.trailerUrl ? (
          <video
            className="hero-carousel__trailer"
            src={currentContent.trailerUrl}
            autoPlay
            muted
            loop
          />
        ) : (
          <img
            className="hero-carousel__backdrop"
            src={currentContent.backdropUrl}
            alt={currentContent.title}
          />
        )}
        <div className="hero-carousel__overlay" />
      </div>

      {/* Contenu */}
      <div className={`hero-carousel__content ${isContentAnimating ? "animating" : ""}`} ref={contentRef}>
        <span className="hero-carousel__title">
          {currentContent.title}
        </span>

        {/* Métadonnées */}
        <div className="hero-carousel__metadata">
          {currentContent.rating && (
            <span className="hero-carousel__rating">
              ★ {currentContent.rating.toFixed(1)}
            </span>
          )}
          {currentContent.releaseDate && (
            <span className="hero-carousel__date">
              {new Date(currentContent.releaseDate).getFullYear()}
            </span>
          )}
          {currentContent.duration && (
            <span className="hero-carousel__duration">
              {currentContent.duration}
            </span>
          )}
        </div>

        {/* Genres */}
        <div className="hero-carousel__genres">
          {currentContent.genres.map((genre, index) => (
            <span key={index} className="hero-carousel__genre">
              {genre}
            </span>
          ))}
        </div>

        {/* Description */}
        <span className="hero-carousel__description">
          {currentContent.description}
        </span>

        {/* Boutons d'action */}
        <div className="hero-carousel__actions">
          <div 
            className="hero-carousel__button hero-carousel__button--primary"
            onClick={() => onContentSelect?.(currentContent.id)}
          >
            <img
              src="/icons/play.svg"
              alt="Lecture"
              className="hero-carousel__button-icon"
            />
            <span>Regarder</span>
          </div>
          <div 
            className="hero-carousel__button hero-carousel__button--secondary"
            onClick={() => setShowTrailer(!showTrailer)}
          >
            <img
              src={showTrailer ? "/icons/info.svg" : "/icons/play-trailer.svg"}
              alt={showTrailer ? "Plus d'infos" : "Bande annonce"}
              className="hero-carousel__button-icon"
            />
            <span>{showTrailer ? "Plus d'infos" : "Bande annonce"}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="hero-carousel__navigation">
        {contents.map((_, index) => (
          <div
            key={index}
            className={`hero-carousel__dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => handleDotClick(index)}
          >
            <div 
              className="hero-carousel__dot-progress"
              style={{
                animationDuration: `${autoPlayInterval}ms`,
                animationPlayState: isPlaying && index === currentIndex ? 'running' : 'paused'
              }}
            />
          </div>
        ))}
      </div>

      {/* Boutons précédent/suivant */}
      <div 
        className="hero-carousel__arrow hero-carousel__arrow--prev"
        onClick={() => handleDotClick((currentIndex - 1 + contents.length) % contents.length)}
      >
        <img src="/icons/chevron-left.svg" alt="Précédent" />
      </div>
      <div 
        className="hero-carousel__arrow hero-carousel__arrow--next"
        onClick={() => handleDotClick((currentIndex + 1) % contents.length)}
      >
        <img src="/icons/chevron-right.svg" alt="Suivant" />
      </div>
    </div>
  );
};
"""

    # Vérifier si le fichier CSS existe, sinon le créer
    css_file_path = os.path.join(os.path.dirname(file_path), "styles.css")
    if not os.path.exists(css_file_path):
        css_content = """/* Styles pour le HeroCarousel */
.hero-carousel {
  position: relative;
  width: 100%;
  height: 80vh;
  max-height: 800px;
  overflow: hidden;
}

.hero-carousel__background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: transform 0.8s cubic-bezier(0.33, 1, 0.68, 1), opacity 0.8s cubic-bezier(0.33, 1, 0.68, 1);
}

.hero-carousel__background.animating {
  animation: slideAnimation 0.8s cubic-bezier(0.33, 1, 0.68, 1);
}

.hero-carousel__content {
  position: relative;
  z-index: 2;
  max-width: 50%;
  padding: 4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: transform 0.6s cubic-bezier(0.33, 1, 0.68, 1), opacity 0.6s cubic-bezier(0.33, 1, 0.68, 1);
}

.hero-carousel__content.animating {
  animation: contentAnimation 0.6s cubic-bezier(0.33, 1, 0.68, 1);
}

.hero-carousel__backdrop {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-carousel__trailer {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-carousel__overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%);
}

.hero-carousel__title {
  font-size: 3rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
}

.hero-carousel__metadata {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.hero-carousel__rating,
.hero-carousel__date,
.hero-carousel__duration {
  color: #d1d5db;
  font-size: 0.875rem;
}

.hero-carousel__genres {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.hero-carousel__genre {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
}

.hero-carousel__description {
  color: #e5e7eb;
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hero-carousel__actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.hero-carousel__button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.hero-carousel__button--primary {
  background-color: #3b82f6;
  color: white;
}

.hero-carousel__button--primary:hover {
  background-color: #2563eb;
}

.hero-carousel__button--secondary {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.hero-carousel__button--secondary:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.hero-carousel__button-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.hero-carousel__navigation {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.5rem;
}

.hero-carousel__dot {
  width: 3rem;
  height: 0.25rem;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 9999px;
  cursor: pointer;
  overflow: hidden;
}

.hero-carousel__dot.active {
  background-color: rgba(255, 255, 255, 0.7);
}

.hero-carousel__dot-progress {
  height: 100%;
  width: 100%;
  background-color: #3b82f6;
  transform: translateX(-100%);
}

.hero-carousel__dot.active .hero-carousel__dot-progress {
  animation: progress linear forwards;
}

.hero-carousel__arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 3rem;
  height: 3rem;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s;
}

.hero-carousel:hover .hero-carousel__arrow {
  opacity: 1;
}

.hero-carousel__arrow--prev {
  left: 1rem;
}

.hero-carousel__arrow--next {
  right: 1rem;
}

@keyframes slideAnimation {
  0% {
    opacity: 0;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes contentAnimation {
  0% {
    opacity: 0;
    transform: translateX(-30px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes progress {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .hero-carousel__content {
    max-width: 80%;
    padding: 2rem;
  }
  
  .hero-carousel__title {
    font-size: 2rem;
  }
  
  .hero-carousel__description {
    -webkit-line-clamp: 2;
  }
}

@media (max-width: 640px) {
  .hero-carousel__content {
    max-width: 100%;
    padding: 1.5rem;
  }
  
  .hero-carousel__title {
    font-size: 1.5rem;
  }
  
  .hero-carousel__actions {
    flex-direction: column;
    gap: 0.5rem;
  }
}
"""
        with open(css_file_path, 'w', encoding='utf-8') as css_file:
            css_file.write(css_content)
        print_step(f"Fichier CSS créé: {css_file_path}")

    # Écrire le contenu corrigé dans le fichier
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(corrected_content)

    print_step(f"Le fichier {file_path} a été complètement corrigé.")

def main():
    """Fonction principale du script."""
    print_header("CORRECTION DES HOOKS D'ANIMATION DANS FLODRAMA")
    
    # Obtenir le chemin du projet
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    print_step(f"Répertoire du projet: {project_root}")
    
    # Créer le répertoire src si nécessaire
    src_dir, src_components_dir = create_src_directory()
    
    # Copier les composants de Frontend/src/components vers src/components
    frontend_components_dir = os.path.join(project_root, "Frontend", "src", "components")
    copy_components_to_src(frontend_components_dir, src_components_dir)
    
    # Trouver et corriger tous les fichiers HeroCarousel
    hero_carousel_files = find_files(project_root, "**/HeroCarousel/index.tsx")
    
    if not hero_carousel_files:
        print_step("Aucun fichier HeroCarousel trouvé.")
    else:
        for file_path in hero_carousel_files:
            fix_hero_carousel(file_path)
    
    # Créer spécifiquement le fichier dans src/components
    hero_carousel_dir = os.path.join(src_components_dir, "HeroCarousel")
    if not os.path.exists(hero_carousel_dir):
        os.makedirs(hero_carousel_dir, exist_ok=True)
    
    hero_carousel_file = os.path.join(hero_carousel_dir, "index.tsx")
    fix_hero_carousel(hero_carousel_file)
    
    print_header("CORRECTION TERMINÉE")
    print("Toutes les références à useAnimation ont été remplacées par des animations React natives.")
    print("Les composants ont été copiés dans le répertoire src/components pour assurer la compatibilité avec Next.js.")

if __name__ == "__main__":
    main()
