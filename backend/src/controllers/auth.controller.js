const authService = require('../services/auth.service');

class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: 'Tous les champs sont requis' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
      }

      const result = await authService.register({ email, password, firstName, lastName });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email et mot de passe requis' });
      }

      const result = await authService.login({ email, password });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await authService.getProfile(req.userId);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token requis' });
      }
      const result = await authService.refresh(refreshToken);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      await authService.revokeRefreshTokens(req.userId);
      res.json({ message: 'Déconnexion réussie' });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email requis' });
      }
      await authService.forgotPassword(email);
      // Toujours répondre OK pour ne pas révéler si l'email existe
      res.json({ message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ error: 'Token et nouveau mot de passe requis' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
      }
      await authService.resetPassword(token, password);
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
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
