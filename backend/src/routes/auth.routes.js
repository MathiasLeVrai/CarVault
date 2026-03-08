const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { uploadVehiclePhoto } = require('../middleware/upload.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authenticate, authController.getProfile);
router.patch('/profile', authenticate, uploadVehiclePhoto.single('avatar'), authController.updateProfile);

module.exports = router;
