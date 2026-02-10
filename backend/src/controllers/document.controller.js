const documentService = require('../services/document.service');

class DocumentController {
  async getByVehicle(req, res, next) {
    try {
      const filters = { type: req.query.type };
      const documents = await documentService.getByVehicle(req.params.vehicleId, req.userId, filters);
      res.json(documents);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const filters = { type: req.query.type };
      const documents = await documentService.getAllByUser(req.userId, filters);
      res.json(documents);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { name, type, expirationDate, notes, vehicleId } = req.body;

      if (!name || !type || !vehicleId) {
        return res.status(400).json({ error: 'Nom, type et véhicule sont requis' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Fichier requis' });
      }

      const data = {
        name,
        type,
        filePath: `/uploads/documents/${req.file.filename}`,
        fileName: req.file.originalname,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        notes: notes || null,
      };

      const document = await documentService.create(data, vehicleId, req.userId);
      res.status(201).json(document);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await documentService.delete(req.params.id, req.userId);
      res.json({ message: 'Document supprimé avec succès' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DocumentController();
