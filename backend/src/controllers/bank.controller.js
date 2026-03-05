const nordigenService = require('../services/nordigen.service');

class BankController {
  async getStatus(req, res, next) {
    try {
      const connection = await nordigenService.getConnection(req.userId);
      res.json({
        configured: nordigenService.isConfigured(),
        connection: connection
          ? { status: connection.status, institutionName: connection.institutionName, createdAt: connection.createdAt }
          : null,
      });
    } catch (error) {
      next(error);
    }
  }

  async listBanks(req, res, next) {
    try {
      if (!nordigenService.isConfigured()) {
        return res.json({ banks: [], configured: false });
      }
      const banks = await nordigenService.listInstitutions('FR');
      res.json({ banks, configured: true });
    } catch (error) {
      next(error);
    }
  }

  async connect(req, res, next) {
    try {
      if (!nordigenService.isConfigured()) {
        return res.status(503).json({ error: 'Open Banking non configuré' });
      }
      const { institutionId, institutionName } = req.body;
      if (!institutionId || !institutionName) {
        return res.status(400).json({ error: 'institutionId et institutionName requis' });
      }
      const origin = req.headers.origin || process.env.APP_URL || 'http://localhost:5173';
      const redirectUrl = `${origin}/bank/callback`;
      const result = await nordigenService.createRequisition(req.userId, institutionId, institutionName, redirectUrl);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async callback(req, res, next) {
    try {
      const result = await nordigenService.handleCallback(req.userId);
      res.json(result || { status: 'unknown' });
    } catch (error) {
      next(error);
    }
  }

  async disconnect(req, res, next) {
    try {
      await nordigenService.disconnect(req.userId);
      res.json({ message: 'Compte bancaire déconnecté' });
    } catch (error) {
      next(error);
    }
  }

  async detectFuel(req, res, next) {
    try {
      const transactions = await nordigenService.detectFuelTransactions(req.userId);
      res.json({ transactions });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BankController();
