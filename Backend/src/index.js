require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const contentRoutes = require('./routes/content');
const carouselsRoutes = require('./routes/carousels');

const app = express();
const PORT = process.env.PORT || 3000;

// Connexion MongoDB Atlas
if(process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connecté'))
    .catch(err => console.error('Erreur MongoDB:', err));
}

// CORS : autorise Surge.sh + local
app.use(cors({
  origin: [
    'https://flodrama.surge.sh',
    'http://localhost:3000'
  ]
}));

app.use(express.json());

app.use('/api/content', contentRoutes);
app.use('/api/carousels', carouselsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Endpoint sécurisé pour déclencher le scraping à la demande
app.post('/api/scrape', (req, res) => {
  if (req.headers['x-scraping-secret'] !== process.env.SCRAPING_SECRET) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  require('./worker').runScraping().then(() =>
    res.json({ status: 'Scraping triggered' })
  ).catch(e =>
    res.status(500).json({ error: 'Scraping failed', details: e.message })
  );
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  console.log(`API FloDrama running on port ${PORT}`);
});
