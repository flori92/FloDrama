// Mock minimal pour débloquer le build
export function getTranslation(text, targetLanguage = 'fr', options = {}) {
  return {
    original: text,
    translated: `[${targetLanguage}] ${text}`,
    confidence: 0.95
  };
}
