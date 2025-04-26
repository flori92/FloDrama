const { putContentByCategory, getCarousels, getContentByCategory } = require('./services/s3Service');
const { saveContent, saveCarousels } = require('./services/mongoService');
const { scrapeDrama, scrapeAnime, scrapeFilm, scrapeBollywood } = require('./services/scrapingService');

async function runScraping() {
  const categories = [
    { name: 'drama', fn: scrapeDrama },
    { name: 'anime', fn: scrapeAnime },
    { name: 'film', fn: scrapeFilm },
    { name: 'bollywood', fn: scrapeBollywood }
  ];
  for (const cat of categories) {
    const data = await cat.fn();
    await putContentByCategory(cat.name, data);
    await saveContent(cat.name, data);
    console.log(`Scraped and saved ${cat.name}`);
  }
  // Exemple carousels (à adapter)
  const carousels = await getCarousels();
  if (carousels) {
    await saveCarousels(carousels);
    console.log('Carousels saved');
  }
}

if (require.main === module) {
  runScraping().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}

module.exports = { runScraping };
