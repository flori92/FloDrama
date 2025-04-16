import React, { useState, useEffect } from 'react';
import { AnimatedElement, AnimatedText } from './animated-element';
import { cn } from '@/lib/utils';

// Types pour la section héros
interface HeroSectionProps {
  title: string;
  subtitle?: string;
  backgroundImage: string;
  ctaText?: string;
  ctaAction?: () => void;
  overlayOpacity?: number;
  className?: string;
  height?: 'small' | 'medium' | 'large' | 'full';
  alignment?: 'left' | 'center' | 'right';
  videoBackground?: string;
}

// Définition des keyframes pour l'animation des étoiles
const twinkleAnimation = `
  @keyframes twinkle {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
`;

// Injecter les styles CSS dans le document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = twinkleAnimation;
  document.head.appendChild(styleElement);
}

// Composant principal pour la section héros
export const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  backgroundImage,
  videoBackground,
  ctaText,
  ctaAction,
  overlayOpacity = 0.5,
  className = '',
  height = 'medium',
  alignment = 'center'
}) => {
  const [isParallaxing, setIsParallaxing] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Effet de parallaxe au défilement
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY * 0.2);
    };

    if (typeof window !== 'undefined') {
      setIsParallaxing(true);
      window.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Classes CSS en fonction de la hauteur et de l'alignement
  const heightClasses = {
    small: 'min-h-[300px]',
    medium: 'min-h-[500px]',
    large: 'min-h-[700px]',
    full: 'min-h-screen'
  };

  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end'
  };

  return (
    <div className={cn(
      "hero-section relative overflow-hidden",
      heightClasses[height],
      className
    )}>
      {/* Image ou vidéo d'arrière-plan avec effet parallaxe */}
      {videoBackground ? (
        <div className="absolute inset-0 z-0">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            style={{ transform: isParallaxing ? `translateY(${scrollY}px) scale(1.1)` : 'scale(1.05)' }}
          >
            <source src={videoBackground} type="video/mp4" />
            {/* Fallback pour les navigateurs qui ne supportent pas la vidéo */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${backgroundImage})`,
                transform: isParallaxing ? `translateY(${scrollY}px) scale(1.1)` : 'scale(1.05)'
              }}
            />
          </video>
        </div>
      ) : (
        <div 
          className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-1000 ease-out"
          style={{ 
            backgroundImage: `url(${backgroundImage})`,
            transform: isParallaxing ? `translateY(${scrollY}px) scale(1.1)` : 'scale(1.05)'
          }}
        />
      )}

      {/* Overlay avec opacité personnalisable et dégradé */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/80 z-10"
        style={{ opacity: overlayOpacity }}
      />

      {/* Particules décoratives (points lumineux) */}
      <div className="absolute inset-0 z-15 opacity-30">
        <div className="stars-container">
          {Array.from({ length: 20 }).map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.3,
                animation: `twinkle ${Math.random() * 5 + 3}s infinite ${Math.random() * 5}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Contenu de la section héros */}
      <div className={cn(
        "relative flex flex-col justify-center h-full z-20 px-6 md:px-12",
        alignmentClasses[alignment]
      )}>
        <div className="max-w-3xl">
          <AnimatedText 
            animation="slide-up" 
            delay={0.3}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
          >
            {title}
          </AnimatedText>
          
          {subtitle && (
            <AnimatedText 
              animation="slide-up" 
              delay={0.5}
              className="text-xl md:text-2xl text-gray-200 mb-8"
            >
              {subtitle}
            </AnimatedText>
          )}
          
          {ctaText && (
            <AnimatedElement animation="slide-up" delay={0.7}>
              <button
                className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50"
                onClick={ctaAction}
                aria-label={ctaText}
              >
                <span className="flex items-center gap-2">
                  {ctaText}
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </span>
              </button>
            </AnimatedElement>
          )}
        </div>
      </div>

      {/* Élément décoratif (vague) */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" fill="#ffffff">
          <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,42.7C1120,32,1280,32,1360,32L1440,32L1440,100L1360,100C1280,100,1120,100,960,100C800,100,640,100,480,100C320,100,160,100,80,100L0,100Z"></path>
        </svg>
      </div>
    </div>
  );
};

// Variante pour les héros de page d'accueil
export const HomeHero: React.FC<Omit<HeroSectionProps, 'height'>> = (props) => {
  return (
    <HeroSection
      {...props}
      height="large"
      className={cn("home-hero", props.className)}
    />
  );
};

// Variante pour les bannières de section
export const SectionBanner: React.FC<Omit<HeroSectionProps, 'height' | 'overlayOpacity'>> = (props) => {
  return (
    <HeroSection
      {...props}
      height="small"
      overlayOpacity={0.7}
      className={cn("section-banner", props.className)}
    />
  );
};
