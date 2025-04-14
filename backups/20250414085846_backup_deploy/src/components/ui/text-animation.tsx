import React, { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface TextAnimationProps {
  text: string;
  className?: string;
  variant?: 'typing' | 'fade' | 'wave' | 'gradient';
  speed?: 'slow' | 'medium' | 'fast';
  delay?: number;
  loop?: boolean;
  children?: React.ReactNode;
}

/**
 * Composant d'animation de texte
 * Permet d'animer du texte avec différents effets
 */
export const TextAnimation: React.FC<TextAnimationProps> = ({
  text,
  className,
  variant = 'typing',
  speed = 'medium',
  delay = 0,
  loop = false
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  // Vitesses d'animation en ms, mémorisées pour éviter les re-rendus inutiles
  const speedValues = useMemo(() => ({
    slow: 100,
    medium: 50,
    fast: 20
  }), []);

  // Observer pour déclencher l'animation quand l'élément est visible
  useEffect(() => {
    if (!textRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(textRef.current);
    return () => observer.disconnect();
  }, []);

  // Effet d'animation de frappe
  useEffect(() => {
    if (!isVisible) return;

    let timeout: ReturnType<typeof setTimeout>;
    
    // Délai initial avant de commencer l'animation
    timeout = setTimeout(() => {
      setIsAnimating(true);
      
      if (variant === 'typing') {
        let currentIndex = 0;
        const intervalId = setInterval(() => {
          if (currentIndex <= text.length) {
            setDisplayText(text.substring(0, currentIndex));
            currentIndex++;
          } else {
            clearInterval(intervalId);
            setIsAnimating(false);
            
            // Si loop est activé, réinitialiser après un délai
            if (loop) {
              setTimeout(() => {
                setDisplayText('');
                setIsAnimating(true);
              }, 2000);
            }
          }
        }, speedValues[speed]);
        
        return () => clearInterval(intervalId);
      }
    }, delay * 1000);
    
    return () => clearTimeout(timeout);
  }, [text, variant, speed, delay, loop, isVisible, speedValues]);

  // Rendu en fonction du type d'animation
  const renderAnimatedText = () => {
    switch (variant) {
      case 'typing':
        return (
          <span className="inline-block">
            {displayText}
            {isAnimating && (
              <span className="inline-block w-1 h-5 ml-1 bg-primary animate-blink"></span>
            )}
          </span>
        );
        
      case 'fade':
        return (
          <div className="overflow-hidden">
            {text.split('').map((char, index) => (
              <span
                key={index}
                className={cn(
                  "inline-block transition-opacity duration-500",
                  isVisible
                    ? "opacity-100"
                    : "opacity-0"
                )}
                style={{ transitionDelay: `${delay + (index * 0.05)}s` }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </div>
        );
        
      case 'wave':
        return (
          <div className="overflow-hidden">
            {text.split('').map((char, index) => (
              <span
                key={index}
                className={cn(
                  "inline-block transition-transform duration-300",
                  isVisible && "animate-wave"
                )}
                style={{ 
                  animationDelay: `${delay + (index * 0.05)}s`,
                  animationDuration: `${speedValues[speed] * 4}ms`
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </div>
        );
        
      case 'gradient':
        return (
          <div 
            className={cn(
              "bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-primary",
              isVisible && "animate-gradient-x bg-[length:200%_auto]"
            )}
            style={{ animationDuration: `${speedValues[speed] * 20}ms` }}
          >
            {text}
          </div>
        );
        
      default:
        return text;
    }
  };

  return (
    <div 
      ref={textRef}
      className={cn("text-animation", className)}
    >
      {renderAnimatedText()}
    </div>
  );
};

/**
 * Composant pour animer un titre
 * Variante spécialisée pour les titres
 */
export const AnimatedTitle: React.FC<Omit<TextAnimationProps, 'variant'> & { level?: 1 | 2 | 3 | 4 | 5 | 6 }> = ({
  text,
  className,
  level = 2,
  ...props
}) => {
  const renderHeading = () => {
    const content = <TextAnimation text={text} variant="fade" {...props} />;
    
    switch (level) {
      case 1: return <h1 className={cn("font-bold", className)}>{content}</h1>;
      case 2: return <h2 className={cn("font-bold", className)}>{content}</h2>;
      case 3: return <h3 className={cn("font-bold", className)}>{content}</h3>;
      case 4: return <h4 className={cn("font-bold", className)}>{content}</h4>;
      case 5: return <h5 className={cn("font-bold", className)}>{content}</h5>;
      case 6: return <h6 className={cn("font-bold", className)}>{content}</h6>;
      default: return <h2 className={cn("font-bold", className)}>{content}</h2>;
    }
  };
  
  return renderHeading();
};

/**
 * Composant pour animer un paragraphe
 * Variante spécialisée pour les paragraphes
 */
export const AnimatedParagraph: React.FC<Omit<TextAnimationProps, 'variant'>> = ({
  text,
  className,
  ...props
}) => {
  return (
    <p className={className}>
      <TextAnimation
        text={text}
        variant="fade"
        {...props}
      />
    </p>
  );
};

// Ajouter les styles d'animation au fichier global.css
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    
    @keyframes wave {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
    
    @keyframes gradient-x {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    .animate-blink {
      animation: blink 0.8s infinite;
    }
    
    .animate-wave {
      animation: wave 0.5s ease-in-out;
    }
    
    .animate-gradient-x {
      animation: gradient-x 3s ease infinite;
    }
  `;
  document.head.appendChild(styleElement);
}
