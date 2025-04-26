const express = require('express');
const router = express.Router();
const { getCarousels } = require('../services/s3Service');
const { getCarouselsMongo } = require('../services/mongoService');

// GET /api/carousels
router.get('/', async (req, res) => {
  try {
    // Essaye MongoDB d'abord (si connecté), sinon fallback S3
    let data = await getCarouselsMongo();
    if (!data) {
      data = await getCarousels();
    }
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error', details: e.message });
  }
});

module.exports = router;
