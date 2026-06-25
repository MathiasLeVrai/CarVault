const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const storageService = require('./storage.service');
const emailService = require('./email.service');
const stripeService = require('./stripe.service');
const { AppError } = require('../middleware/error.middleware');

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

class AuthService {
  /**
   * Inscription d'un nouvel utilisateur
   */
  async register({ email, password, firstName, lastName }) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Cet email est déjà utilisé', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        createdAt: true,
      },
    });

    const token = this.generateToken(user.id);
    const refreshToken = await this.generateRefreshToken(user.id);

    return { user, token, refreshToken };
  }

  /**
   * Connexion utilisateur
   */
  async login({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Email ou mot de passe incorrect', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Email ou mot de passe incorrect', 401);
    }

    const token = this.generateToken(user.id);
    const refreshToken = await this.generateRefreshToken(user.id);

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token, refreshToken };
  }

  /**
   * Récupérer le profil utilisateur
   */
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        createdAt: true,
        isPremium: true,
        _count: {
          select: { vehicles: true },
        },
      },
    });

    if (!user) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    return user;
  }

  async updateProfile(userId, { firstName, lastName, avatarBuffer, avatarOriginalname }) {
    const data = {};
    if (firstName) data.firstName = firstName.trim();
    if (lastName) data.lastName = lastName.trim();

    if (avatarBuffer && avatarOriginalname) {
      // Delete old avatar if it exists
      const existing = await prisma.user.findUnique({ where: { id: userId }, select: { avatar: true } });
      if (existing?.avatar) await storageService.delete(existing.avatar).catch(() => {});
      data.avatar = await storageService.upload(avatarBuffer, avatarOriginalname, 'avatars');
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        createdAt: true,
        isPremium: true,
        _count: { select: { vehicles: true } },
      },
    });

    return user;
  }

  /**
   * Rafraîchir les tokens via refresh token
   */
  async refresh(refreshTokenValue) {
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenValue },
    });

    if (!stored || stored.expiresAt < new Date()) {
      // Clean up expired token if it exists
      if (stored) {
        await prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      throw new AppError('Refresh token invalide ou expiré', 401);
    }

    // Rotation: delete old, create new
    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const token = this.generateToken(stored.userId);
    const refreshToken = await this.generateRefreshToken(stored.userId);

    return { token, refreshToken };
  }

  /**
   * Demande de réinitialisation de mot de passe
   */
  async forgotPassword(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Toujours répondre OK pour ne pas révéler si l'email existe
    if (!user) return;

    // Supprimer les anciens tokens de reset pour cet utilisateur
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const appUrl = process.env.APP_URL || 'https://carvio.fr';
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    const sent = await emailService.sendPasswordResetEmail(
      user.email,
      user.firstName,
      resetLink,
    );
    if (!sent) {
      console.warn('[AUTH] Échec envoi email reset pour', user.email);
    }
  }

  /**
   * Réinitialiser le mot de passe avec un token
   */
  async resetPassword(token, newPassword) {
    const stored = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await prisma.passwordResetToken.delete({ where: { id: stored.id } });
      }
      throw new AppError('Lien invalide ou expiré. Veuillez refaire une demande.', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: stored.userId },
      data: { password: hashedPassword },
    });

    // Supprimer le token utilisé + révoquer toutes les sessions
    await prisma.passwordResetToken.deleteMany({ where: { userId: stored.userId } });
    await prisma.refreshToken.deleteMany({ where: { userId: stored.userId } });
  }

  /**
   * Révoquer tous les refresh tokens d'un utilisateur (logout)
   */
  async revokeRefreshTokens(userId) {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }

  /**
   * Générer un JWT (access token court)
   */
  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
  }

  /**
   * Générer et stocker un refresh token (longue durée)
   */
  async generateRefreshToken(userId) {
    const token = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await prisma.refreshToken.create({
      data: { token, userId, expiresAt },
    });

    // Clean up old expired tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } },
    });

    return token;
  }

  /**
   * Suppression définitive du compte (RGPD « droit à l'oubli »).
   * Exige le mot de passe en confirmation. Supprime l'utilisateur — la cascade
   * Prisma efface véhicules, documents, dépenses, alertes, liens de partage,
   * abonnements push et tokens. Les fichiers téléversés (avatar, documents,
   * photos de véhicules) sont retirés du stockage objet en best-effort.
   */
  async deleteAccount(userId, password) {
    if (!password) {
      throw new AppError('Mot de passe requis pour supprimer le compte', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true, avatar: true, stripeSubscriptionId: true },
    });
    if (!user) {
      throw new AppError('Utilisateur introuvable', 404);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // 403 (et non 401) pour ne pas déclencher le refresh-token côté client
      throw new AppError('Mot de passe incorrect', 403);
    }

    // Collecte des fichiers AVANT le delete (la cascade efface les lignes BDD)
    const documents = await prisma.document.findMany({
      where: { vehicle: { userId } },
      select: { filePath: true },
    });
    const vehicles = await prisma.vehicle.findMany({
      where: { userId },
      select: { photo: true },
    });
    const fileUrls = [
      user.avatar,
      ...documents.map((d) => d.filePath),
      ...vehicles.map((v) => v.photo),
    ].filter(Boolean);

    // Annule l'abonnement Stripe éventuel (best-effort, n'émet jamais d'erreur)
    await stripeService.cancelSubscription(user.stripeSubscriptionId);

    // Suppression de l'utilisateur — la cascade Prisma fait le reste en BDD
    await prisma.user.delete({ where: { id: userId } });

    // Best-effort : retire les fichiers du stockage objet
    await Promise.allSettled(fileUrls.map((url) => storageService.delete(url)));

    return { success: true };
  }
}

module.exports = new AuthService();
