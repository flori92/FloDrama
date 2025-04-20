import React, { ReactNode, useEffect, useRef } from 'react';
import { motion, useAnimation, Variants } from 'framer-motion';

// Types pour les animations
export type AnimationType = 
  | 'fade-in' 
  | 'slide-up' 
  | 'slide-down' 
  | 'slide-left' 
  | 'slide-right' 
  | 'zoom-in' 
  | 'zoom-out' 
  | 'bounce' 
  | 'pulse'
  | 'rotate';

interface AnimatedElementProps {
  children: ReactNode;
  animation: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  triggerOnce?: boolean;
  threshold?: number;
}

// Définition des variantes d'animation
const animations: Record<AnimationType, Variants> = {
  'fade-in': {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  },
  'slide-up': {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 }
  },
  'slide-down': {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0 }
  },
  'slide-left': {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 }
  },
  'slide-right': {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 }
  },
  'zoom-in': {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 }
  },
  'zoom-out': {
    hidden: { opacity: 0, scale: 1.2 },
    visible: { opacity: 1, scale: 1 }
  },
  'bounce': {
    hidden: { opacity: 0, y: 0 },
    visible: (i) => ({
      opacity: 1,
      y: [0, -20, 0],
      transition: {
        times: [0, 0.5, 1],
        duration: 0.6,
        delay: i * 0.1
      }
    })
  },
  'pulse': {
    hidden: { opacity: 0, scale: 1 },
    visible: {
      opacity: 1,
      scale: [1, 1.05, 1],
      transition: {
        times: [0, 0.5, 1],
        repeat: Infinity,
        repeatType: "reverse",
        duration: 1.5
      }
    }
  },
  'rotate': {
    hidden: { opacity: 0, rotate: -90 },
    visible: { opacity: 1, rotate: 0 }
  }
};

// Composant principal pour les animations
export const AnimatedElement: React.FC<AnimatedElementProps> = ({
  children,
  animation,
  delay = 0,
  duration = 0.5,
  className = '',
  triggerOnce = true,
  threshold = 0.1
}) => {
  const controls = useAnimation();
  const ref = useRef<HTMLDivElement>(null);

  // Observer pour détecter quand l'élément est visible
  useEffect(() => {
    const currentRef = ref.current; // Copier la référence pour l'utiliser dans la fonction de nettoyage
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          controls.start('visible');
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          controls.start('hidden');
        }
      },
      { threshold }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [controls, triggerOnce, threshold]);

  return (
    <div
      ref={ref}
      className={className}
    >
      <motion.div
        initial="hidden"
        animate={controls}
        variants={animations[animation]}
        custom={delay}
        transition={{ 
          duration, 
          delay,
          ease: "easeOut" 
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

// Composant pour les animations de texte
export const AnimatedText: React.FC<Omit<AnimatedElementProps, 'tag'> & { tag?: string }> = ({
  children,
  animation,
  delay = 0,
  duration = 0.5,
  className = '',
  triggerOnce = true,
  threshold = 0.1
}) => {
  // Utiliser le composant AnimatedElement pour éviter la duplication de code
  return (
    <AnimatedElement
      animation={animation}
      delay={delay}
      duration={duration}
      className={className}
      triggerOnce={triggerOnce}
      threshold={threshold}
    >
      {children}
    </AnimatedElement>
  );
};

// Composant pour les animations séquentielles
export const AnimatedSequence: React.FC<{
  children: ReactNode[];
  animation: AnimationType;
  staggerDelay?: number;
  initialDelay?: number;
  duration?: number;
  className?: string;
  childClassName?: string;
}> = ({
  children,
  animation,
  staggerDelay = 0.1,
  initialDelay = 0,
  duration = 0.5,
  className = '',
  childClassName = ''
}) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <AnimatedElement
          key={index}
          animation={animation}
          delay={initialDelay + index * staggerDelay}
          duration={duration}
          className={childClassName}
        >
          {child}
        </AnimatedElement>
      ))}
    </div>
  );
};
