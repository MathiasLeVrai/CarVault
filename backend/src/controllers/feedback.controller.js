const prisma = require('../lib/prisma');
const emailService = require('../services/email.service');

class FeedbackController {
  async submit(req, res, next) {
    try {
      const message = (req.body?.message || '').trim();

      if (message.length < 5) {
        return res.status(400).json({ error: 'Votre idée est un peu trop courte.' });
      }
      if (message.length > 2000) {
        return res.status(400).json({ error: 'Votre idée est trop longue (2000 caractères max).' });
      }

      const user = await prisma.utilisateur.findUnique({
        where: { id: req.userId },
        select: { email: true, firstName: true, lastName: true },
      });

      const sent = await emailService.sendFeedbackEmail(user, message);
      if (!sent) {
        return res.status(502).json({
          error: "Impossible d'envoyer votre idée pour le moment. Réessayez plus tard.",
        });
      }

      res.json({ message: 'Merci pour votre idée !' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FeedbackController();
