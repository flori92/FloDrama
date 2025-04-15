// Mock minimal pour débloquer le build
export function getPronunciationGuide(text, language = 'ja') {
  return {
    ipa: '[mock IPA]',
    simplified: text.split('').join('-'),
    audioUrl: null,
    language
  };
}
