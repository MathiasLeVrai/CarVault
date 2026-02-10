const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { uploadDocument } = require('../middleware/upload.middleware');

router.use(authenticate);

router.get('/', documentController.getAll);
router.get('/vehicle/:vehicleId', documentController.getByVehicle);
router.post('/', uploadDocument.single('file'), documentController.create);
router.delete('/:id', documentController.delete);

module.exports = router;
