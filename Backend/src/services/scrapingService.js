const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeDrama() {
  // EXEMPLE à personnaliser selon ta source réelle
  // const res = await axios.get('https://exemple.com/dramas');
  // const $ = cheerio.load(res.data);
  // ...parse et retourne un tableau d’objets...
  return [{ title: 'Drama 1', year: 2024 }];
}
async function scrapeAnime() {
  return [{ title: 'Anime 1', year: 2024 }];
}
async function scrapeFilm() {
  return [{ title: 'Film 1', year: 2024 }];
}
async function scrapeBollywood() {
  return [{ title: 'Bollywood 1', year: 2024 }];
}

module.exports = { scrapeDrama, scrapeAnime, scrapeFilm, scrapeBollywood };
