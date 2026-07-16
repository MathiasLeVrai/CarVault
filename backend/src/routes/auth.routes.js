const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { uploadVehiclePhoto } = require('../middleware/upload.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  registerBody,
  loginBody,
  forgotPasswordBody,
  resetPasswordBody,
  deleteAccountBody,
  updateProfileBody,
} = require('../validation/schemas');

router.post('/register', validate({ body: registerBody }), authController.register);
router.post('/login', validate({ body: loginBody }), authController.login);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', validate({ body: forgotPasswordBody }), authController.forgotPassword);
router.post('/reset-password', validate({ body: resetPasswordBody }), authController.resetPassword);
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.patch(
  '/profile',
  authenticate,
  uploadVehiclePhoto.single('avatar'),
  validate({ body: updateProfileBody }),
  authController.updateProfile,
);
router.delete('/account', authenticate, validate({ body: deleteAccountBody }), authController.deleteAccount);

module.exports = router;
