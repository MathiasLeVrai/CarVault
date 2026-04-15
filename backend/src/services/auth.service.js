const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const storageService = require('./storage.service');
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
}

module.exports = new AuthService();
