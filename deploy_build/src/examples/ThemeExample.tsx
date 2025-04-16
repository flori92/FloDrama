import React from 'react';
import { HybridComponentProvider, useHybridSystem } from '../components/HybridComponentProvider';
import { getButtonStyles, getCardStyles, getTextAnimationStyles } from '../styles/themeUtils';

/**
 * Exemple de composant utilisant le thème FloDrama
 */
const ThemeDemo: React.FC = () => {
  const { theme } = useHybridSystem();
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8 flodrama-gradient-text">Démonstration du Thème FloDrama</h1>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Palette de Couleurs</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ColorSwatch 
            color={theme.colors.primary.blue} 
            name="Primary Blue" 
            value={theme.colors.primary.blue} 
          />
          <ColorSwatch 
            color={theme.colors.primary.fuchsia} 
            name="Primary Fuchsia" 
            value={theme.colors.primary.fuchsia} 
          />
          <ColorSwatch 
            color={theme.colors.background.main} 
            name="Background Main" 
            value={theme.colors.background.main} 
          />
          <ColorSwatch 
            color={theme.colors.background.card} 
            name="Background Card" 
            value={theme.colors.background.card} 
          />
          <ColorSwatch 
            color={theme.colors.text.primary} 
            name="Text Primary" 
            value={theme.colors.text.primary} 
          />
          <ColorSwatch 
            color={theme.colors.text.secondary} 
            name="Text Secondary" 
            value={theme.colors.text.secondary} 
          />
          <ColorSwatch 
            color={theme.colors.status.success} 
            name="Status Success" 
            value={theme.colors.status.success} 
          />
          <ColorSwatch 
            color={theme.colors.status.error} 
            name="Status Error" 
            value={theme.colors.status.error} 
          />
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Typographie</h2>
        <div className="space-y-4 bg-gray-900 p-6 rounded-lg">
          <div>
            <h3 className="text-6xl font-bold" style={{ fontFamily: theme.typography.fontFamily }}>
              Titre Principal
            </h3>
            <p className="text-sm text-gray-400">Font: {theme.typography.fontFamily}, Size: {theme.typography.fontSizes['6xl']}</p>
          </div>
          <div>
            <h3 className="text-4xl font-semibold" style={{ fontFamily: theme.typography.fontFamily }}>
              Titre Secondaire
            </h3>
            <p className="text-sm text-gray-400">Font: {theme.typography.fontFamily}, Size: {theme.typography.fontSizes['4xl']}</p>
          </div>
          <div>
            <p className="text-xl" style={{ fontFamily: theme.typography.fontFamily }}>
              Paragraphe avec texte de taille moyenne pour le contenu principal.
            </p>
            <p className="text-sm text-gray-400">Font: {theme.typography.fontFamily}, Size: {theme.typography.fontSizes.xl}</p>
          </div>
          <div>
            <p className="text-base" style={{ fontFamily: theme.typography.fontFamily }}>
              Texte standard pour le contenu général et les descriptions.
            </p>
            <p className="text-sm text-gray-400">Font: {theme.typography.fontFamily}, Size: {theme.typography.fontSizes.base}</p>
          </div>
          <div>
            <p className="text-sm" style={{ fontFamily: theme.typography.fontFamily }}>
              Petit texte pour les légendes, les notes et les informations secondaires.
            </p>
            <p className="text-sm text-gray-400">Font: {theme.typography.fontFamily}, Size: {theme.typography.fontSizes.sm}</p>
          </div>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Boutons</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StyledButton variant="primary" size="medium">Bouton Primary</StyledButton>
          <StyledButton variant="secondary" size="medium">Bouton Secondary</StyledButton>
          <StyledButton variant="outline" size="medium">Bouton Outline</StyledButton>
          <StyledButton variant="ghost" size="medium">Bouton Ghost</StyledButton>
          <StyledButton variant="link" size="medium">Bouton Link</StyledButton>
          <StyledButton variant="danger" size="medium">Bouton Danger</StyledButton>
        </div>
        
        <div className="mt-8 grid grid-cols-3 gap-4">
          <StyledButton variant="primary" size="small">Small</StyledButton>
          <StyledButton variant="primary" size="medium">Medium</StyledButton>
          <StyledButton variant="primary" size="large">Large</StyledButton>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Cartes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StyledCard variant="default">
            <h3 className="text-xl font-semibold mb-2">Carte Standard</h3>
            <p>Une carte avec le style par défaut de FloDrama.</p>
          </StyledCard>
          
          <StyledCard variant="featured">
            <h3 className="text-xl font-semibold mb-2">Carte Mise en Avant</h3>
            <p>Une carte avec un style accentué pour les contenus importants.</p>
          </StyledCard>
          
          <StyledCard variant="minimal">
            <h3 className="text-xl font-semibold mb-2">Carte Minimaliste</h3>
            <p>Une carte avec un style épuré pour les contenus secondaires.</p>
          </StyledCard>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Animations de Texte</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-gray-900 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Animation Typing</h3>
            <AnimatedText variant="typing" text="FloDrama - Streaming" />
          </div>
          
          <div className="p-6 bg-gray-900 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Animation Fade</h3>
            <AnimatedText variant="fade" text="Découvrez des films passionnants" />
          </div>
          
          <div className="p-6 bg-gray-900 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Animation Wave</h3>
            <AnimatedText variant="wave" text="Séries exclusives" />
          </div>
          
          <div className="p-6 bg-gray-900 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Animation Gradient</h3>
            <AnimatedText variant="gradient" text="Expérience cinématographique" />
          </div>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Dégradés et Effets</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-40 rounded-lg" style={{ background: theme.effects.gradients.primary }}>
            <div className="flex items-center justify-center h-full">
              <p className="text-white font-semibold">Dégradé Principal</p>
            </div>
          </div>
          
          <div className="h-40 rounded-lg" style={{ background: theme.effects.gradients.secondary }}>
            <div className="flex items-center justify-center h-full">
              <p className="text-white font-semibold">Dégradé Secondaire</p>
            </div>
          </div>
          
          <div className="h-40 rounded-lg relative overflow-hidden">
            <img 
              src="https://picsum.photos/seed/flodrama1/800/400" 
              alt="Exemple d'image" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{ background: theme.effects.gradients.dark }}>
              <div className="flex items-center justify-center h-full">
                <p className="text-white font-semibold">Overlay Dégradé Sombre</p>
              </div>
            </div>
          </div>
          
          <div className="h-40 rounded-lg bg-gray-800 relative overflow-hidden">
            <div 
              className="absolute inset-0 animate-pulse" 
              style={{ 
                background: theme.effects.gradients.shimmer,
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite linear'
              }}
            />
            <div className="flex items-center justify-center h-full relative z-10">
              <p className="text-white font-semibold">Effet Shimmer</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Composants utilitaires pour la démo

const ColorSwatch: React.FC<{ color: string; name: string; value: string }> = ({ color, name, value }) => {
  // Déterminer la couleur du texte en fonction de la luminosité de la couleur de fond
  const contrastColor = isLightColor(color) ? '#000000' : '#FFFFFF';
  
  return (
    <div className="flex flex-col">
      <div 
        className="h-20 rounded-lg mb-2 flex items-center justify-center" 
        style={{ backgroundColor: color }}
      >
        <span style={{ color: contrastColor, fontWeight: 'bold' }}>Aa</span>
      </div>
      <p className="font-medium">{name}</p>
      <p className="text-sm text-gray-400">{value}</p>
    </div>
  );
};

// Fonction utilitaire pour déterminer si une couleur est claire
function isLightColor(color: string): boolean {
  // Convertir la couleur hexadécimale en RGB
  let r = 0, g = 0, b = 0;
  
  if (color.startsWith('#')) {
    color = color.substring(1);
    if (color.length === 3) {
      r = parseInt(color.charAt(0) + color.charAt(0), 16);
      g = parseInt(color.charAt(1) + color.charAt(1), 16);
      b = parseInt(color.charAt(2) + color.charAt(2), 16);
    } else if (color.length === 6) {
      r = parseInt(color.substring(0, 2), 16);
      g = parseInt(color.substring(2, 4), 16);
      b = parseInt(color.substring(4, 6), 16);
    }
  } else if (color.startsWith('rgb')) {
    const rgbValues = color.match(/\d+/g);
    if (rgbValues && rgbValues.length >= 3) {
      r = parseInt(rgbValues[0]);
      g = parseInt(rgbValues[1]);
      b = parseInt(rgbValues[2]);
    }
  }
  
  // Calculer la luminosité (formule YIQ)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128; // Si >= 128, la couleur est considérée comme claire
}

const StyledButton: React.FC<{
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger';
  size: 'small' | 'medium' | 'large';
  children: React.ReactNode;
}> = ({ variant, size, children }) => {
  // Utiliser les utilitaires de thème pour générer les styles
  const buttonStyles = getButtonStyles(variant, size, false);
  
  // Créer un ID unique pour cette combinaison de styles
  const styleId = `button-${variant}-${size}`;
  
  // Injecter les styles dans le document si nécessaire
  React.useEffect(() => {
    const existingStyle = document.getElementById(`flodrama-style-${styleId}`);
    if (!existingStyle) {
      const styleElement = document.createElement('style');
      styleElement.id = `flodrama-style-${styleId}`;
      styleElement.textContent = `.${styleId} { ${buttonStyles} }`;
      document.head.appendChild(styleElement);
      
      return () => {
        const element = document.getElementById(`flodrama-style-${styleId}`);
        if (element) {
          document.head.removeChild(element);
        }
      };
    }
  }, [buttonStyles, styleId]);
  
  return (
    <button className={`${styleId} px-4 py-2`} onClick={() => alert(`Bouton ${variant} cliqué!`)}>
      {children}
    </button>
  );
};

const StyledCard: React.FC<{
  variant: 'default' | 'featured' | 'minimal';
  children: React.ReactNode;
}> = ({ variant, children }) => {
  // Utiliser les utilitaires de thème pour générer les styles
  const cardStyles = getCardStyles(variant, false);
  
  // Créer un ID unique pour cette combinaison de styles
  const styleId = `card-${variant}`;
  
  // Injecter les styles dans le document si nécessaire
  React.useEffect(() => {
    const existingStyle = document.getElementById(`flodrama-style-${styleId}`);
    if (!existingStyle) {
      const styleElement = document.createElement('style');
      styleElement.id = `flodrama-style-${styleId}`;
      styleElement.textContent = `.${styleId} { ${cardStyles} }`;
      document.head.appendChild(styleElement);
      
      return () => {
        const element = document.getElementById(`flodrama-style-${styleId}`);
        if (element) {
          document.head.removeChild(element);
        }
      };
    }
  }, [cardStyles, styleId]);
  
  return (
    <div className={`${styleId} p-6`}>
      {children}
    </div>
  );
};

const AnimatedText: React.FC<{
  variant: 'typing' | 'fade' | 'wave' | 'gradient';
  text: string;
}> = ({ variant, text }) => {
  // Utiliser les utilitaires de thème pour générer les styles
  const animationStyles = getTextAnimationStyles(variant, 'medium', false);
  
  // Créer un ID unique pour cette combinaison de styles
  const styleId = `text-animation-${variant}`;
  
  // Injecter les styles dans le document si nécessaire
  React.useEffect(() => {
    const existingStyle = document.getElementById(`flodrama-style-${styleId}`);
    if (!existingStyle) {
      const styleElement = document.createElement('style');
      styleElement.id = `flodrama-style-${styleId}`;
      styleElement.textContent = `.${styleId} { ${animationStyles} }`;
      document.head.appendChild(styleElement);
      
      return () => {
        const element = document.getElementById(`flodrama-style-${styleId}`);
        if (element) {
          document.head.removeChild(element);
        }
      };
    }
  }, [animationStyles, styleId]);
  
  if (variant === 'wave') {
    return (
      <div className={styleId}>
        {text.split('').map((char, index) => (
          <span key={index} style={{ animationDelay: `${index * 0.1}s` }}>
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </div>
    );
  }
  
  return (
    <div className={styleId}>
      {text}
    </div>
  );
};

/**
 * Exemple complet avec le fournisseur de thème
 */
const ThemeExample: React.FC = () => {
  return (
    <HybridComponentProvider>
      <ThemeDemo />
    </HybridComponentProvider>
  );
};

export default ThemeExample;
