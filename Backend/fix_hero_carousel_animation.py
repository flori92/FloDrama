#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script pour corriger le problème d'animation dans le composant HeroCarousel.
Ce script remplace l'utilisation de useAnimation (Lynx) par une solution React native.
"""

import os
import re

# Chemin du fichier à modifier
file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                         "Frontend", "src", "components", "HeroCarousel", "index.tsx")

# Vérifier si le fichier existe
if not os.path.exists(file_path):
    print(f"Erreur: Le fichier {file_path} n'existe pas.")
    exit(1)

# Lire le contenu du fichier
with open(file_path, 'r', encoding='utf-8') as file:
    content = file.read()

# Remplacer les imports si nécessaire
new_imports = """import { useEffect, useState, useRef } from 'react';
import React from 'react';

import { useUserPreferences } from '../../hooks/useUserPreferences';
import './styles.css';
"""

# Remplacer la partie animation Lynx par une solution React native
lynx_animation_pattern = r"// Animations Lynx.*?easing: 'easeOutCubic'\s*\}\);"
lynx_animation_replacement = """// Animation avec React hooks
  const [isAnimating, setIsAnimating] = useState(false);
  const slideRef = useRef(null);
  const contentRef = useRef(null);
  
  // Fonction pour déclencher les animations
  const triggerAnimations = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 800);
  };"""

# Appliquer les remplacements avec regex
content = re.sub(r"import \{ useEffect, useState \} from 'react';", new_imports, content, flags=re.DOTALL)
content = re.sub(lynx_animation_pattern, lynx_animation_replacement, content, flags=re.DOTALL)

# Remplacer les attributs animation par des refs et des classes CSS
content = re.sub(r'<div className="hero-carousel__background" animation=\{slideAnimation\}>', 
                '<div className={`hero-carousel__background ${isAnimating ? "animating" : ""}`} ref={slideRef}>', 
                content)

content = re.sub(r'<div className="hero-carousel__content" animation=\{contentAnimation\}>', 
                '<div className={`hero-carousel__content ${isAnimating ? "animating" : ""}`} ref={contentRef}>', 
                content)

# Ajouter le déclenchement de l'animation lors du changement d'index
content = re.sub(r'setCurrentIndex\((.*?)\);', 
                'setCurrentIndex(\\1);\n    triggerAnimations();', 
                content)

# Créer le fichier CSS pour les animations si nécessaire
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
    print(f"Fichier CSS créé: {css_file_path}")

# Remplacer les composants Lynx par des équivalents HTML
content = content.replace('<Video', '<video')
content = content.replace('</Video>', '</video>')
content = content.replace('<Image', '<img')
content = content.replace('</Image>', '')
content = content.replace('src={', 'src={process.env.PUBLIC_URL + ')

# Écrire le contenu modifié dans le fichier
with open(file_path, 'w', encoding='utf-8') as file:
    file.write(content)

print(f"Le fichier {file_path} a été mis à jour avec succès.")
print("Les animations Lynx ont été remplacées par des animations React natives.")
