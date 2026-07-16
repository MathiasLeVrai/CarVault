const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { uploadDocument } = require('../middleware/upload.middleware');
const { validate } = require('../middleware/validate.middleware');
const { documentCreateBody, idParams } = require('../validation/schemas');

router.use(authenticate);

router.get('/', documentController.getAll);
router.get('/detect-type', documentController.detectType);
router.get('/vehicle/:vehicleId', documentController.getByVehicle);
router.post(
  '/',
  uploadDocument.single('file'),
  validate({ body: documentCreateBody }),
  documentController.create,
);
router.delete('/:id', validate({ params: idParams }), documentController.delete);

module.exports = router;
