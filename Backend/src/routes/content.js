const express = require('express');
const router = express.Router();
const { getContentByCategory } = require('../services/s3Service');
const { getContent } = require('../services/mongoService');

// GET /api/content/:category
router.get('/:category', async (req, res) => {
  const { category } = req.params;
  try {
    // Essaye MongoDB d'abord (si connecté), sinon fallback S3
    let data = await getContent(category);
    if (!data) {
      data = await getContentByCategory(category);
    }
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error', details: e.message });
  }
});

module.exports = router;
