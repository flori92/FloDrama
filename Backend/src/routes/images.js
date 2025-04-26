const express = require('express');
const router = express.Router();
const { getImageFromS3 } = require('../services/s3Service');

// GET /api/images/:filename
router.get('/:filename', async (req, res) => {
  const { filename } = req.params;
  try {
    const stream = await getImageFromS3(filename);
    if (!stream) return res.status(404).json({ error: 'Not found' });
    res.set('Content-Type', 'image/jpeg'); // ou autre selon le type
    stream.pipe(res);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error', details: e.message });
  }
});

module.exports = router;
