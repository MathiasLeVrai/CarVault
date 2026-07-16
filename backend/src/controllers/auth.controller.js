const authService = require('../services/auth.service');
const storageService = require('../services/storage.service');
const {
  sendAuthResponse,
  sendRefreshResponse,
  getRefreshTokenFromRequest,
  clearRefreshCookie,
} = require('../utils/refresh-cookie');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return sendAuthResponse(req, res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      return sendAuthResponse(req, res, result);
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await authService.getProfile(req.userId);
      res.json(await storageService.signAssets(user));
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const refreshToken = getRefreshTokenFromRequest(req);
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token requis' });
      }
      const result = await authService.refresh(refreshToken);
      return sendRefreshResponse(req, res, result);
    } catch (error) {
      clearRefreshCookie(res);
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      await authService.revokeRefreshTokens(req.userId);
      clearRefreshCookie(res);
      res.json({ message: 'Déconnexion réussie' });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      await authService.forgotPassword(req.body.email);
      res.json({ message: 'Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.' });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      await authService.resetPassword(token, password);
      clearRefreshCookie(res);
      res.json({ message: 'Mot de passe réinitialisé avec succès.' });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { firstName, lastName } = req.body;
      const file = req.file;
      const user = await authService.updateProfile(req.userId, {
        firstName,
        lastName,
        avatarBuffer: file?.buffer,
        avatarOriginalname: file?.originalname,
      });
      res.json(await storageService.signAssets(user));
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(req, res, next) {
    try {
      await authService.deleteAccount(req.userId, req.body.password);
      clearRefreshCookie(res);
      res.json({ message: 'Votre compte et toutes vos données ont été supprimés définitivement.' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
