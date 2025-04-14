/**
 * Système de sous-titres avancé pour FloDrama
 * Ce service permet d'améliorer l'expérience des contenus internationaux avec des
 * annotations culturelles, guides de prononciation et adaptation visuelle.
 */

import { getTranslation } from '../utils/translationService';
import { getCulturalNotes } from '../utils/culturalNotesService';
import { getPronunciationGuide } from '../utils/pronunciationService';
import { applyVisualStyle } from '../utils/subtitleStyler';

class EnhancedSubtitleSystem {
  constructor() {
    // Configuration des fonctionnalités
    this.culturalNotesEnabled = true;
    this.pronunciationGuidesEnabled = true;
    this.multiLanguageSupport = ['fr', 'en', 'es', 'de', 'it', 'ko', 'ja', 'zh', 'hi'];
    this.fontFamily = 'SF Pro Display';
    
    // Identité visuelle FloDrama
    this.flodramaStyle = {
      primaryBlue: '#3b82f6',
      primaryFuchsia: '#d946ef',
      backgroundDark: '#121118',
      backgroundSecondary: '#1A1926',
      gradient: 'linear-gradient(to right, #3b82f6, #d946ef)',
      cornerRadius: '8px',
      transitionDuration: '0.3s'
    };
    
    // Configuration des sous-titres
    this.subtitleConfig = {
      defaultFontSize: 20,
      mobileAdjustment: 0.9,
      tabletAdjustment: 1.0,
      desktopAdjustment: 1.1,
      tvAdjustment: 1.3,
      defaultPosition: 'bottom',
      defaultBackgroundOpacity: 0.7,
      defaultTextColor: '#FFFFFF',
      defaultStrokeColor: '#000000',
      defaultStrokeWidth: 1.5,
      animationDuration: 0.3
    };
    
    // Configuration des notes culturelles
    this.culturalNotesConfig = {
      displayDuration: 5000, // ms
      maxWidth: '80%',
      position: 'top',
      backgroundColor: 'rgba(18, 17, 24, 0.85)',
      borderColor: this.flodramaStyle.primaryFuchsia,
      borderWidth: 1,
      borderRadius: 4,
      fontSize: 16,
      padding: '8px 12px',
      icon: 'info-circle'
    };
    
    // Configuration des guides de prononciation
    this.pronunciationConfig = {
      displayOnHover: true,
      displayOnPause: true,
      audioEnabled: true,
      visualGuide: true,
      highlightColor: this.flodramaStyle.primaryBlue,
      tooltipStyle: {
        backgroundColor: 'rgba(18, 17, 24, 0.9)',
        borderColor: this.flodramaStyle.primaryBlue,
        borderWidth: 1,
        borderRadius: 4,
        fontSize: 14,
        padding: '6px 10px'
      }
    };
  }
  
  /**
   * Traite les sous-titres pour les enrichir
   * @param {Object} subtitleData - Données des sous-titres
   * @param {Object} userPreferences - Préférences de l'utilisateur
   * @returns {Promise<Object>} - Sous-titres enrichis
   */
  async processSubtitles(subtitleData, userPreferences) {
    try {
      // Vérification des données de sous-titres
      if (!subtitleData || !subtitleData.cues) {
        throw new Error('Données de sous-titres invalides ou incomplètes');
      }
      
      // Application des préférences utilisateur
      const preferences = this.applyUserPreferences(userPreferences);
      
      // Traitement de chaque segment de sous-titre
      const enrichedCues = await Promise.all(
        subtitleData.cues.map(async (cue) => {
          // Copie du segment original
          let enrichedCue = { ...cue };
          
          // Ajout de notes culturelles si activé
          if (preferences.culturalNotesEnabled) {
            enrichedCue = await this.addCulturalContext(enrichedCue, subtitleData.metadata);
          }
          
          // Ajout de guides de prononciation si activé
          if (preferences.pronunciationGuidesEnabled) {
            enrichedCue = await this.addPronunciationGuides(enrichedCue, subtitleData.metadata);
          }
          
          // Application du style visuel FloDrama
          enrichedCue = this.applyFloDramaVisualStyle(enrichedCue, preferences);
          
          return enrichedCue;
        })
      );
      
      // Création du résultat enrichi
      const enrichedSubtitles = {
        ...subtitleData,
        cues: enrichedCues,
        metadata: {
          ...subtitleData.metadata,
          enhanced: true,
          enhancementVersion: '1.0',
          culturalNotesCount: enrichedCues.filter(cue => cue.culturalNotes && cue.culturalNotes.length > 0).length,
          pronunciationGuidesCount: enrichedCues.filter(cue => cue.pronunciationGuides && cue.pronunciationGuides.length > 0).length
        }
      };
      
      // Ajout des métadonnées globales
      enrichedSubtitles.globalNotes = await this.generateGlobalNotes(subtitleData.metadata);
      
      return enrichedSubtitles;
    } catch (error) {
      console.error('Erreur lors du traitement des sous-titres:', error);
      // En cas d'erreur, retourner les sous-titres originaux
      return subtitleData;
    }
  }
  
  /**
   * Applique les préférences de l'utilisateur
   * @param {Object} userPreferences - Préférences de l'utilisateur
   * @returns {Object} - Préférences appliquées
   */
  applyUserPreferences(userPreferences) {
    // Valeurs par défaut
    const defaultPreferences = {
      culturalNotesEnabled: this.culturalNotesEnabled,
      pronunciationGuidesEnabled: this.pronunciationGuidesEnabled,
      preferredLanguage: 'fr',
      fontSize: this.subtitleConfig.defaultFontSize,
      position: this.subtitleConfig.defaultPosition,
      backgroundColor: `rgba(18, 17, 24, ${this.subtitleConfig.defaultBackgroundOpacity})`,
      textColor: this.subtitleConfig.defaultTextColor,
      strokeEnabled: true,
      strokeColor: this.subtitleConfig.defaultStrokeColor,
      strokeWidth: this.subtitleConfig.defaultStrokeWidth,
      fontFamily: this.fontFamily
    };
    
    // Fusion avec les préférences utilisateur
    return {
      ...defaultPreferences,
      ...(userPreferences || {})
    };
  }
  
  /**
   * Ajoute des notes culturelles aux sous-titres
   * @param {Object} cue - Segment de sous-titre
   * @param {Object} metadata - Métadonnées du contenu
   * @returns {Promise<Object>} - Segment enrichi
   */
  async addCulturalContext(cue, metadata) {
    try {
      // Extraction du texte et des métadonnées pertinentes
      const { text, start, end } = cue;
      const { origin, language, genre, title } = metadata;
      
      // Récupération des notes culturelles
      const culturalNotes = await getCulturalNotes(
        text,
        origin,
        language,
        genre,
        title,
        { start, end }
      );
      
      // Si des notes culturelles sont trouvées, les ajouter au segment
      if (culturalNotes && culturalNotes.length > 0) {
        return {
          ...cue,
          culturalNotes,
          hasEnhancements: true
        };
      }
      
      // Sinon, retourner le segment inchangé
      return cue;
    } catch (error) {
      console.error('Erreur lors de l\'ajout des notes culturelles:', error);
      return cue;
    }
  }
  
  /**
   * Ajoute des guides de prononciation aux sous-titres
   * @param {Object} cue - Segment de sous-titre
   * @param {Object} metadata - Métadonnées du contenu
   * @returns {Promise<Object>} - Segment enrichi
   */
  async addPronunciationGuides(cue, metadata) {
    try {
      // Extraction du texte et des métadonnées pertinentes
      const { text } = cue;
      const { origin, language } = metadata;
      
      // Récupération des guides de prononciation
      const pronunciationGuides = await getPronunciationGuide(
        text,
        origin,
        language
      );
      
      // Si des guides de prononciation sont trouvés, les ajouter au segment
      if (pronunciationGuides && pronunciationGuides.length > 0) {
        return {
          ...cue,
          pronunciationGuides,
          hasEnhancements: true
        };
      }
      
      // Sinon, retourner le segment inchangé
      return cue;
    } catch (error) {
      console.error('Erreur lors de l\'ajout des guides de prononciation:', error);
      return cue;
    }
  }
  
  /**
   * Applique le style visuel FloDrama aux sous-titres
   * @param {Object} cue - Segment de sous-titre
   * @param {Object} preferences - Préférences appliquées
   * @returns {Object} - Segment stylisé
   */
  applyFloDramaVisualStyle(cue, preferences) {
    try {
      // Application du style de base
      let styledCue = {
        ...cue,
        style: {
          fontFamily: preferences.fontFamily,
          fontSize: `${preferences.fontSize}px`,
          color: preferences.textColor,
          backgroundColor: preferences.backgroundColor,
          padding: '4px 8px',
          borderRadius: '4px',
          textAlign: 'center',
          maxWidth: '80%',
          margin: '0 auto',
          position: preferences.position,
          transition: `all ${this.flodramaStyle.transitionDuration} ease`
        }
      };
      
      // Ajout du contour si activé
      if (preferences.strokeEnabled) {
        styledCue.style.textShadow = `
          -${preferences.strokeWidth}px -${preferences.strokeWidth}px 0 ${preferences.strokeColor},
          ${preferences.strokeWidth}px -${preferences.strokeWidth}px 0 ${preferences.strokeColor},
          -${preferences.strokeWidth}px ${preferences.strokeWidth}px 0 ${preferences.strokeColor},
          ${preferences.strokeWidth}px ${preferences.strokeWidth}px 0 ${preferences.strokeColor}
        `;
      }
      
      // Style spécifique pour les segments avec des notes culturelles
      if (cue.culturalNotes && cue.culturalNotes.length > 0) {
        styledCue.culturalNotesStyle = {
          ...this.culturalNotesConfig,
          borderImage: this.flodramaStyle.gradient,
          borderImageSlice: 1
        };
      }
      
      // Style spécifique pour les segments avec des guides de prononciation
      if (cue.pronunciationGuides && cue.pronunciationGuides.length > 0) {
        styledCue.pronunciationStyle = {
          ...this.pronunciationConfig.tooltipStyle,
          borderImage: this.flodramaStyle.gradient,
          borderImageSlice: 1
        };
      }
      
      return styledCue;
    } catch (error) {
      console.error('Erreur lors de l\'application du style visuel:', error);
      return cue;
    }
  }
  
  /**
   * Génère des notes globales pour le contenu
   * @param {Object} metadata - Métadonnées du contenu
   * @returns {Promise<Object>} - Notes globales
   */
  async generateGlobalNotes(metadata) {
    try {
      // Extraction des métadonnées pertinentes
      const { origin, language, genre, title, era } = metadata;
      
      // Structure des notes globales
      const globalNotes = {
        contextual: [],
        linguistic: [],
        historical: []
      };
      
      // Notes contextuelles selon l'origine
      switch (origin) {
        case 'kr':
        case 'korea':
        case 'south korea':
          globalNotes.contextual.push({
            title: 'Contexte coréen',
            content: 'Les dramas coréens mettent souvent l\'accent sur les relations familiales et les hiérarchies sociales. Les personnages utilisent différents niveaux de langage selon leur statut social.',
            icon: 'globe-asia'
          });
          break;
        case 'jp':
        case 'japan':
          globalNotes.contextual.push({
            title: 'Contexte japonais',
            content: 'La culture japonaise accorde une grande importance au concept de "wa" (harmonie) et aux relations de groupe. Les expressions indirectes sont courantes pour éviter les confrontations.',
            icon: 'globe-asia'
          });
          break;
        case 'cn':
        case 'china':
          globalNotes.contextual.push({
            title: 'Contexte chinois',
            content: 'La culture chinoise est fortement influencée par le confucianisme, valorisant la piété filiale et le respect des aînés. Les relations familiales sont souvent au centre des intrigues.',
            icon: 'globe-asia'
          });
          break;
        case 'in':
        case 'india':
          globalNotes.contextual.push({
            title: 'Contexte indien',
            content: 'Les productions indiennes intègrent souvent des éléments de spiritualité, de tradition et de modernité. Les relations familiales étendues jouent un rôle central dans les intrigues.',
            icon: 'globe-asia'
          });
          break;
      }
      
      // Notes linguistiques selon la langue
      switch (language) {
        case 'ko':
          globalNotes.linguistic.push({
            title: 'Particularités du coréen',
            content: 'Le coréen utilise différents niveaux de politesse selon le statut social et l\'âge. Les termes d\'adresse comme "oppa" (grand frère pour une femme) ou "unnie" (grande sœur pour une femme) reflètent ces relations.',
            icon: 'language'
          });
          break;
        case 'ja':
          globalNotes.linguistic.push({
            title: 'Particularités du japonais',
            content: 'Le japonais utilise des suffixes honorifiques comme "-san", "-kun", "-chan" qui indiquent le niveau de familiarité et de respect. L\'absence de suffixe indique généralement une relation très proche.',
            icon: 'language'
          });
          break;
        case 'zh':
          globalNotes.linguistic.push({
            title: 'Particularités du chinois',
            content: 'Le chinois utilise des termes spécifiques pour désigner les relations familiales, distinguant par exemple les oncles maternels et paternels, ou les frères aînés et cadets.',
            icon: 'language'
          });
          break;
        case 'hi':
          globalNotes.linguistic.push({
            title: 'Particularités de l\'hindi',
            content: 'L\'hindi utilise différents niveaux de formalité et intègre souvent des expressions en anglais dans le langage courant, reflétant l\'influence coloniale britannique.',
            icon: 'language'
          });
          break;
      }
      
      // Notes historiques selon l'époque
      if (era) {
        switch (era.toLowerCase()) {
          case 'joseon':
            globalNotes.historical.push({
              title: 'Ère Joseon (1392-1897)',
              content: 'Période de la dynastie coréenne Joseon, caractérisée par une forte influence du confucianisme, un système de classes sociales rigide et des traditions culturelles distinctives.',
              icon: 'landmark'
            });
            break;
          case 'edo':
            globalNotes.historical.push({
              title: 'Période Edo (1603-1868)',
              content: 'Époque féodale japonaise marquée par la domination des shoguns Tokugawa, l\'isolement du pays et le développement d\'une culture urbaine distinctive.',
              icon: 'landmark'
            });
            break;
          case 'qing':
            globalNotes.historical.push({
              title: 'Dynastie Qing (1644-1912)',
              content: 'Dernière dynastie impériale chinoise, marquée par l\'expansion territoriale, les influences mandchoues et les défis posés par les puissances occidentales.',
              icon: 'landmark'
            });
            break;
          case 'mughal':
            globalNotes.historical.push({
              title: 'Empire Moghol (1526-1857)',
              content: 'Période de domination musulmane en Inde, caractérisée par un mélange d\'influences persanes, turques et indiennes dans l\'art, l\'architecture et la culture.',
              icon: 'landmark'
            });
            break;
        }
      }
      
      return globalNotes;
    } catch (error) {
      console.error('Erreur lors de la génération des notes globales:', error);
      return {
        contextual: [],
        linguistic: [],
        historical: []
      };
    }
  }
  
  /**
   * Traduit les sous-titres dans une autre langue
   * @param {Object} subtitleData - Données des sous-titres
   * @param {string} targetLanguage - Langue cible
   * @returns {Promise<Object>} - Sous-titres traduits
   */
  async translateSubtitles(subtitleData, targetLanguage) {
    try {
      // Vérification de la prise en charge de la langue
      if (!this.multiLanguageSupport.includes(targetLanguage)) {
        throw new Error(`Langue non prise en charge: ${targetLanguage}`);
      }
      
      // Traduction de chaque segment
      const translatedCues = await Promise.all(
        subtitleData.cues.map(async (cue) => {
          // Traduction du texte principal
          const translatedText = await getTranslation(cue.text, targetLanguage);
          
          // Traduction des notes culturelles si présentes
          let translatedCulturalNotes = [];
          if (cue.culturalNotes && cue.culturalNotes.length > 0) {
            translatedCulturalNotes = await Promise.all(
              cue.culturalNotes.map(async (note) => ({
                ...note,
                title: await getTranslation(note.title, targetLanguage),
                content: await getTranslation(note.content, targetLanguage)
              }))
            );
          }
          
          // Traduction des guides de prononciation si présents
          let translatedPronunciationGuides = [];
          if (cue.pronunciationGuides && cue.pronunciationGuides.length > 0) {
            translatedPronunciationGuides = await Promise.all(
              cue.pronunciationGuides.map(async (guide) => ({
                ...guide,
                explanation: await getTranslation(guide.explanation, targetLanguage)
              }))
            );
          }
          
          // Création du segment traduit
          return {
            ...cue,
            text: translatedText,
            originalText: cue.text,
            culturalNotes: translatedCulturalNotes.length > 0 ? translatedCulturalNotes : cue.culturalNotes,
            pronunciationGuides: translatedPronunciationGuides.length > 0 ? translatedPronunciationGuides : cue.pronunciationGuides
          };
        })
      );
      
      // Traduction des notes globales
      const translatedGlobalNotes = {
        contextual: await Promise.all(
          (subtitleData.globalNotes?.contextual || []).map(async (note) => ({
            ...note,
            title: await getTranslation(note.title, targetLanguage),
            content: await getTranslation(note.content, targetLanguage)
          }))
        ),
        linguistic: await Promise.all(
          (subtitleData.globalNotes?.linguistic || []).map(async (note) => ({
            ...note,
            title: await getTranslation(note.title, targetLanguage),
            content: await getTranslation(note.content, targetLanguage)
          }))
        ),
        historical: await Promise.all(
          (subtitleData.globalNotes?.historical || []).map(async (note) => ({
            ...note,
            title: await getTranslation(note.title, targetLanguage),
            content: await getTranslation(note.content, targetLanguage)
          }))
        )
      };
      
      // Création des sous-titres traduits
      return {
        ...subtitleData,
        cues: translatedCues,
        globalNotes: translatedGlobalNotes,
        metadata: {
          ...subtitleData.metadata,
          translatedLanguage: targetLanguage,
          originalLanguage: subtitleData.metadata.language
        }
      };
    } catch (error) {
      console.error('Erreur lors de la traduction des sous-titres:', error);
      return subtitleData;
    }
  }
  
  /**
   * Adapte les sous-titres à l'appareil de l'utilisateur
   * @param {Object} subtitleData - Données des sous-titres
   * @param {string} deviceType - Type d'appareil (mobile, tablet, desktop, tv)
   * @returns {Object} - Sous-titres adaptés
   */
  adaptToDevice(subtitleData, deviceType) {
    try {
      // Détermination du facteur d'ajustement selon l'appareil
      let sizeFactor;
      switch (deviceType) {
        case 'mobile':
          sizeFactor = this.subtitleConfig.mobileAdjustment;
          break;
        case 'tablet':
          sizeFactor = this.subtitleConfig.tabletAdjustment;
          break;
        case 'desktop':
          sizeFactor = this.subtitleConfig.desktopAdjustment;
          break;
        case 'tv':
          sizeFactor = this.subtitleConfig.tvAdjustment;
          break;
        default:
          sizeFactor = 1.0;
      }
      
      // Adaptation de chaque segment
      const adaptedCues = subtitleData.cues.map(cue => {
        // Copie du style existant
        const style = { ...(cue.style || {}) };
        
        // Ajustement de la taille de police
        if (style.fontSize) {
          const currentSize = parseInt(style.fontSize, 10);
          style.fontSize = `${Math.round(currentSize * sizeFactor)}px`;
        }
        
        // Ajustement de la largeur maximale
        if (deviceType === 'mobile') {
          style.maxWidth = '95%';
        } else if (deviceType === 'tv') {
          style.maxWidth = '70%';
        }
        
        // Création du segment adapté
        return {
          ...cue,
          style
        };
      });
      
      // Création des sous-titres adaptés
      return {
        ...subtitleData,
        cues: adaptedCues,
        metadata: {
          ...subtitleData.metadata,
          adaptedForDevice: deviceType
        }
      };
    } catch (error) {
      console.error('Erreur lors de l\'adaptation à l\'appareil:', error);
      return subtitleData;
    }
  }
  
  /**
   * Génère un aperçu des sous-titres enrichis
   * @param {Object} subtitleData - Données des sous-titres
   * @returns {Object} - Aperçu des sous-titres
   */
  generatePreview(subtitleData) {
    try {
      // Sélection de segments représentatifs
      const representativeCues = this.selectRepresentativeCues(subtitleData.cues);
      
      // Création de l'aperçu
      return {
        previewCues: representativeCues,
        metadata: subtitleData.metadata,
        globalNotes: {
          contextual: (subtitleData.globalNotes?.contextual || []).slice(0, 1),
          linguistic: (subtitleData.globalNotes?.linguistic || []).slice(0, 1),
          historical: (subtitleData.globalNotes?.historical || []).slice(0, 1)
        },
        enhancementStats: {
          culturalNotesCount: subtitleData.cues.filter(cue => cue.culturalNotes && cue.culturalNotes.length > 0).length,
          pronunciationGuidesCount: subtitleData.cues.filter(cue => cue.pronunciationGuides && cue.pronunciationGuides.length > 0).length,
          totalCues: subtitleData.cues.length
        }
      };
    } catch (error) {
      console.error('Erreur lors de la génération de l\'aperçu:', error);
      return {
        previewCues: subtitleData.cues.slice(0, 3),
        metadata: subtitleData.metadata
      };
    }
  }
  
  /**
   * Sélectionne des segments représentatifs pour l'aperçu
   * @param {Array} cues - Segments de sous-titres
   * @returns {Array} - Segments représentatifs
   */
  selectRepresentativeCues(cues) {
    try {
      // Recherche de segments avec des notes culturelles
      const cuesWithCulturalNotes = cues.filter(cue => 
        cue.culturalNotes && cue.culturalNotes.length > 0
      );
      
      // Recherche de segments avec des guides de prononciation
      const cuesWithPronunciationGuides = cues.filter(cue => 
        cue.pronunciationGuides && cue.pronunciationGuides.length > 0
      );
      
      // Sélection des segments représentatifs
      const representativeCues = [];
      
      // Ajout d'un segment avec des notes culturelles
      if (cuesWithCulturalNotes.length > 0) {
        representativeCues.push(cuesWithCulturalNotes[0]);
      }
      
      // Ajout d'un segment avec des guides de prononciation
      if (cuesWithPronunciationGuides.length > 0) {
        // Éviter les doublons
        const pronunciationCue = cuesWithPronunciationGuides.find(cue => 
          !representativeCues.includes(cue)
        );
        
        if (pronunciationCue) {
          representativeCues.push(pronunciationCue);
        }
      }
      
      // Ajout d'un segment standard si nécessaire
      if (representativeCues.length < 2 && cues.length > 0) {
        // Recherche d'un segment qui n'est pas déjà inclus
        const standardCue = cues.find(cue => 
          !representativeCues.includes(cue)
        );
        
        if (standardCue) {
          representativeCues.push(standardCue);
        }
      }
      
      return representativeCues;
    } catch (error) {
      console.error('Erreur lors de la sélection des segments représentatifs:', error);
      return cues.slice(0, 2);
    }
  }
}

export default EnhancedSubtitleSystem;
