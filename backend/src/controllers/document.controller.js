const documentService = require('../services/document.service');
const storageService = require('../services/storage.service');

const EXPIRATION_DEFAULTS = {
  INSURANCE: 365,
  TECHNICAL_INSPECTION: 730,
  WARRANTY: 730,
  REGISTRATION: null,
  INVOICE: null,
  OTHER: null,
};

const TYPE_KEYWORDS = {
  INSURANCE: ['assurance', 'insurance', 'maaf', 'maif', 'matmut', 'axa', 'allianz', 'groupama'],
  TECHNICAL_INSPECTION: ['controle', 'technique', 'ct', 'inspection', 'dekra', 'autovision', 'securitest'],
  INVOICE: ['facture', 'invoice', 'devis', 'receipt'],
  WARRANTY: ['garantie', 'warranty'],
  REGISTRATION: ['carte grise', 'certificat', 'immatriculation', 'registration'],
};

function detectDocumentType(filename) {
  const lower = (filename || '').toLowerCase();
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return type;
  }
  return null;
}

class DocumentController {
  async getByVehicle(req, res, next) {
    try {
      const filters = { type: req.query.type };
      const documents = await documentService.getByVehicle(req.params.vehicleId, req.userId, filters);
      res.json(documents);
    } catch (error) { next(error); }
  }

  async getAll(req, res, next) {
    try {
      const filters = { type: req.query.type };
      const documents = await documentService.getAllByUser(req.userId, filters);
      res.json(documents);
    } catch (error) { next(error); }
  }

  async create(req, res, next) {
    try {
      const { name, type, expirationDate, notes, vehicleId, reminderDays } = req.body;

      if (!name || !type || !vehicleId) {
        return res.status(400).json({ error: 'Nom, type et véhicule sont requis' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'Fichier requis' });
      }

      let parsedReminders = [30, 7];
      if (reminderDays) {
        try {
          parsedReminders = JSON.parse(reminderDays).map(Number).filter(n => n > 0);
        } catch { /* ignore */ }
      }

      const filePath = await storageService.upload(req.file.buffer, req.file.originalname, 'documents');

      const data = {
        name,
        type,
        filePath,
        fileName: req.file.originalname,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        notes: notes || null,
        reminderDays: parsedReminders,
      };

      const document = await documentService.create(data, vehicleId, req.userId);
      res.status(201).json(document);
    } catch (error) { next(error); }
  }

  async delete(req, res, next) {
    try {
      await documentService.delete(req.params.id, req.userId);
      res.json({ message: 'Document supprimé avec succès' });
    } catch (error) { next(error); }
  }

  async detectType(req, res, next) {
    try {
      const { filename } = req.query;
      const detected = detectDocumentType(filename);
      const suggestedExpiration = detected ? EXPIRATION_DEFAULTS[detected] : null;
      res.json({ detectedType: detected, suggestedExpirationDays: suggestedExpiration });
    } catch (error) { next(error); }
  }
}

module.exports = new DocumentController();
