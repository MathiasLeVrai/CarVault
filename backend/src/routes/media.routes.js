const express = require('express');
const fs = require('fs');
const storageService = require('../services/storage.service');

const router = express.Router();

/**
 * GET /api/media?p=/uploads/...&e=<unix>&s=<hmac>
 * Streams a local upload after verifying a short-lived HMAC signature.
 * R2 objects are served via S3 presigned URLs (no hit here).
 */
router.get('/', (req, res) => {
  const { p, e, s } = req.query;
  if (!storageService.verifyLocalSignature(p, e, s)) {
    return res.status(403).json({ error: 'Lien média invalide ou expiré' });
  }

  const absolute = storageService.resolveLocalPath(p);
  if (!absolute || !fs.existsSync(absolute)) {
    return res.status(404).json({ error: 'Fichier introuvable' });
  }

  res.setHeader('Content-Type', storageService.mimeForPath(absolute));
  res.setHeader('Cache-Control', 'private, max-age=60');
  fs.createReadStream(absolute).pipe(res);
});

module.exports = router;
