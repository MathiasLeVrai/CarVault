const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const storageService = require('./storage.service');
const { AppError } = require('../middleware/error.middleware');

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

    return { user, token };
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

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
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
   * Générer un JWT
   */
  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }
}

module.exports = new AuthService();
