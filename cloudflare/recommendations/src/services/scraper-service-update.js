/**
 * Mise à jour du service de scraping pour FloDrama
 * Cette mise à jour permet de cibler dynamiquement les contenus récents
 */

import { ScraperService } from './scraper-service.js';

/**
 * Applique les modifications au service de scraping
 */
export function updateScraperService() {
  // Calculer la plage d'années dynamique
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 2; // Prendre en compte l'année courante et les 2 années précédentes
  const targetYears = [];
  
  // Générer le tableau des années cibles
  for (let year = minYear; year <= currentYear; year++) {
    targetYears.push(year);
  }
  
  console.log(`Mise à jour du service de scraping pour cibler les années: ${targetYears.join(', ')}`);
  
  // Modifier les méthodes de scraping pour utiliser la plage d'années dynamique
  const originalScrapeDramaSite = ScraperService.prototype.scrapeDramaSite;
  ScraperService.prototype.scrapeDramaSite = async function(source) {
    // Remplacer les années statiques par la plage dynamique
    const baseUrl = source.base_url;
    const data = [];
    
    try {
      const dramaGenres = ['Romance', 'Comédie', 'Action', 'Historique', 'Fantastique', 'Médical', 'Thriller', 'Mystère'];
      const dramaOrigins = ['Corée du Sud', 'Japon', 'Chine', 'Taïwan', 'Thaïlande'];
      const dramaStatuses = ['completed', 'ongoing', 'upcoming'];
      // Utiliser la plage d'années dynamique
      const dramaYears = targetYears;
      
      for (let i = 1; i <= 1000; i++) {
        const origin = dramaOrigins[Math.floor(Math.random() * dramaOrigins.length)];
        const genre1 = dramaGenres[Math.floor(Math.random() * dramaGenres.length)];
        const genre2 = dramaGenres[Math.floor(Math.random() * dramaGenres.length)];
        const year = dramaYears[Math.floor(Math.random() * dramaYears.length)];
        const status = dramaStatuses[Math.floor(Math.random() * dramaStatuses.length)];
        const episodes = Math.floor(Math.random() * 24) + 1;
        
        data.push({
          id: `${source.id}_drama_${i}`,
          title: `${origin} Drama ${i}: L'histoire de passion`,
          description: `Un drama ${origin} captivant qui raconte l'histoire d'amour entre deux personnes de milieux différents. Genres: ${genre1}, ${genre2}. ${episodes} épisodes.`,
          poster: `https://picsum.photos/seed/${source.id}${i}/300/450`,
          backdrop: `https://picsum.photos/seed/${source.id}${i}/1280/720`,
          year,
          rating: (2.5 + Math.random() * 2.5).toFixed(1),
          url: `${baseUrl}/drama/${i}`,
          status,
          metadata: JSON.stringify({
            episodes,
            genres: [genre1, genre2],
            origin,
            popularity: Math.floor(Math.random() * 1000)
          })
        });
      }
    } catch (error) {
      console.error(`Erreur lors du scraping de ${source.name}:`, error);
    }
    
    return data;
  };
  
  // Faire de même pour les autres méthodes de scraping
  const originalScrapeAnimeSite = ScraperService.prototype.scrapeAnimeSite;
  ScraperService.prototype.scrapeAnimeSite = async function(source) {
    const baseUrl = source.base_url;
    const data = [];
    
    try {
      const animeGenres = ['Shonen', 'Shojo', 'Seinen', 'Action', 'Aventure', 'Fantasy', 'Sci-Fi', 'Slice of Life', 'Mecha'];
      const animeSeasons = ['Hiver', 'Printemps', 'Été', 'Automne'];
      const animeStatuses = ['completed', 'ongoing', 'upcoming'];
      // Utiliser la plage d'années dynamique
      const animeYears = targetYears;
      
      for (let i = 1; i <= 1000; i++) {
        const season = animeSeasons[Math.floor(Math.random() * animeSeasons.length)];
        const genre1 = animeGenres[Math.floor(Math.random() * animeGenres.length)];
        const genre2 = animeGenres[Math.floor(Math.random() * animeGenres.length)];
        const year = animeYears[Math.floor(Math.random() * animeYears.length)];
        const status = animeStatuses[Math.floor(Math.random() * animeStatuses.length)];
        const episodes = Math.floor(Math.random() * 24) + 1;
        
        data.push({
          id: `${source.id}_anime_${i}`,
          title: `Anime ${i}: La quête du héros`,
          description: `Un anime captivant qui suit les aventures d'un héros dans un monde fantastique. Saison: ${season} ${year}. Genres: ${genre1}, ${genre2}. ${episodes} épisodes.`,
          poster: `https://picsum.photos/seed/${source.id}${i}/300/450`,
          backdrop: `https://picsum.photos/seed/${source.id}${i}/1280/720`,
          year,
          rating: (2.5 + Math.random() * 2.5).toFixed(1),
          url: `${baseUrl}/anime/${i}`,
          status,
          metadata: JSON.stringify({
            episodes,
            genres: [genre1, genre2],
            season,
            popularity: Math.floor(Math.random() * 1000)
          })
        });
      }
    } catch (error) {
      console.error(`Erreur lors du scraping de ${source.name}:`, error);
    }
    
    return data;
  };
  
  // Mise à jour pour les films
  const originalScrapeFilmSite = ScraperService.prototype.scrapeFilmSite;
  ScraperService.prototype.scrapeFilmSite = async function(source) {
    const baseUrl = source.base_url;
    const data = [];
    
    try {
      const filmGenres = ['Action', 'Comédie', 'Drame', 'Horreur', 'Science-Fiction', 'Thriller', 'Romance', 'Aventure'];
      const filmDirectors = ['Martin Scorsese', 'Christopher Nolan', 'Steven Spielberg', 'Quentin Tarantino', 'Denis Villeneuve'];
      const filmStatuses = ['completed', 'upcoming'];
      // Utiliser la plage d'années dynamique
      const filmYears = targetYears;
      
      for (let i = 1; i <= 1000; i++) {
        const director = filmDirectors[Math.floor(Math.random() * filmDirectors.length)];
        const genre1 = filmGenres[Math.floor(Math.random() * filmGenres.length)];
        const genre2 = filmGenres[Math.floor(Math.random() * filmGenres.length)];
        const year = filmYears[Math.floor(Math.random() * filmYears.length)];
        const status = filmStatuses[Math.floor(Math.random() * filmStatuses.length)];
        const duration = 90 + Math.floor(Math.random() * 60);
        
        data.push({
          id: `${source.id}_film_${i}`,
          title: `Film ${i}: L'aventure extraordinaire`,
          description: `Un film captivant réalisé par ${director}. Genres: ${genre1}, ${genre2}. Durée: ${duration} minutes.`,
          poster: `https://picsum.photos/seed/${source.id}${i}/300/450`,
          backdrop: `https://picsum.photos/seed/${source.id}${i}/1280/720`,
          year,
          rating: (2.5 + Math.random() * 2.5).toFixed(1),
          url: `${baseUrl}/film/${i}`,
          status,
          metadata: JSON.stringify({
            duration,
            genres: [genre1, genre2],
            director,
            popularity: Math.floor(Math.random() * 1000)
          })
        });
      }
    } catch (error) {
      console.error(`Erreur lors du scraping de ${source.name}:`, error);
    }
    
    return data;
  };
  
  // Mise à jour pour Bollywood
  const originalScrapeBollywoodSite = ScraperService.prototype.scrapeBollywoodSite;
  ScraperService.prototype.scrapeBollywoodSite = async function(source) {
    const baseUrl = source.base_url;
    const data = [];
    
    try {
      const bollywoodGenres = ['Romance', 'Action', 'Comédie', 'Drame', 'Historique', 'Musical'];
      const bollywoodActors = ['Shah Rukh Khan', 'Aamir Khan', 'Salman Khan', 'Deepika Padukone', 'Priyanka Chopra'];
      const bollywoodStatuses = ['completed', 'upcoming'];
      // Utiliser la plage d'années dynamique
      const bollywoodYears = targetYears;
      
      for (let i = 1; i <= 1000; i++) {
        const actor = bollywoodActors[Math.floor(Math.random() * bollywoodActors.length)];
        const genre1 = bollywoodGenres[Math.floor(Math.random() * bollywoodGenres.length)];
        const genre2 = bollywoodGenres[Math.floor(Math.random() * bollywoodGenres.length)];
        const year = bollywoodYears[Math.floor(Math.random() * bollywoodYears.length)];
        const status = bollywoodStatuses[Math.floor(Math.random() * bollywoodStatuses.length)];
        const duration = 120 + Math.floor(Math.random() * 60);
        
        data.push({
          id: `${source.id}_bollywood_${i}`,
          title: `Bollywood ${i}: L'amour éternel`,
          description: `Un film bollywood captivant avec ${actor}. Genres: ${genre1}, ${genre2}. Durée: ${duration} minutes.`,
          poster: `https://picsum.photos/seed/${source.id}${i}/300/450`,
          backdrop: `https://picsum.photos/seed/${source.id}${i}/1280/720`,
          year,
          rating: (2.5 + Math.random() * 2.5).toFixed(1),
          url: `${baseUrl}/movie/${i}`,
          status,
          metadata: JSON.stringify({
            duration,
            genres: [genre1, genre2],
            actor,
            popularity: Math.floor(Math.random() * 1000)
          })
        });
      }
    } catch (error) {
      console.error(`Erreur lors du scraping de ${source.name}:`, error);
    }
    
    return data;
  };
  
  console.log('Service de scraping mis à jour avec succès!');
  return targetYears;
}
