const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Labels français
const DOC_TYPES = {
  INSURANCE: 'Assurance', TECHNICAL_INSPECTION: 'Contrôle technique',
  INVOICE: 'Facture', WARRANTY: 'Garantie', OTHER: 'Autre',
};
const EXP_CATS = {
  MAINTENANCE: 'Entretien', TIRES: 'Pneus', FUEL: 'Carburant',
  INSURANCE: 'Assurance', REPAIR: 'Réparation', PARKING: 'Stationnement',
  TOLL: 'Péage', OTHER: 'Autre',
};
const FUEL_TYPES = {
  GASOLINE: 'Essence', DIESEL: 'Diesel', HYBRID: 'Hybride',
  ELECTRIC: 'Électrique', LPG: 'GPL', OTHER: 'Autre',
};

const COLORS = {
  bg: '#f5f0eb',
  dark: '#1a1a1a',
  lime: '#b9ff66',
  muted: '#888888',
  accent: '#7c5cfc',
  white: '#ffffff',
  lightGray: '#e5e5e5',
};

class PdfService {
  /**
   * Générer le dossier PDF complet d'un véhicule
   * @returns {Promise<Buffer>}
   */
  async generateVehicleDossier(vehicle, documents, expenses, stats) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `CarVault — ${vehicle.brand} ${vehicle.model}`,
          Author: 'CarVault',
          Subject: 'Dossier véhicule',
          Creator: 'CarVault PDF Generator',
        },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        this._drawCover(doc, vehicle);
        this._drawVehicleInfo(doc, vehicle);
        this._drawExpenseHistory(doc, expenses, stats);
        this._drawDocumentList(doc, documents);
        this._drawFinancialSummary(doc, expenses, stats);
        this._drawFooter(doc);
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  // ===================== PAGE 1 : COUVERTURE =====================

  _drawCover(doc, vehicle) {
    // Fond sombre
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.dark);

    // Logo texte
    doc.fontSize(14).fillColor(COLORS.lime).font('Helvetica-Bold').text('CARVAULT', 50, 50);
    doc.fontSize(9).fillColor(COLORS.muted).font('Helvetica').text('Dossier véhicule', 50, 68);

    // Photo du véhicule si disponible
    let photoY = 180;
    if (vehicle.photo) {
      const photoPath = path.join(__dirname, '../../', vehicle.photo);
      if (fs.existsSync(photoPath)) {
        try {
          doc.image(photoPath, 100, 140, { width: 400, height: 220, fit: [400, 220], align: 'center' });
          photoY = 380;
        } catch {}
      }
    }

    // Nom du véhicule
    doc.fontSize(36).fillColor(COLORS.white).font('Helvetica-Bold')
      .text(`${vehicle.brand}`, 50, photoY, { width: doc.page.width - 100 });
    doc.fontSize(36).fillColor(COLORS.lime).font('Helvetica-Bold')
      .text(`${vehicle.model}`, 50, photoY + 44, { width: doc.page.width - 100 });

    // Infos résumé
    const infoY = photoY + 110;
    doc.fontSize(12).fillColor(COLORS.muted).font('Helvetica');
    const infos = [
      `Année : ${vehicle.year}`,
      `Kilométrage : ${vehicle.mileage?.toLocaleString('fr-FR')} km`,
      vehicle.licensePlate ? `Plaque : ${vehicle.licensePlate}` : null,
      vehicle.color ? `Couleur : ${vehicle.color}` : null,
      `Carburant : ${FUEL_TYPES[vehicle.fuelType] || 'N/C'}`,
    ].filter(Boolean);

    infos.forEach((info, i) => {
      doc.text(info, 50, infoY + i * 20);
    });

    // Date de génération
    doc.fontSize(9).fillColor(COLORS.muted)
      .text(`Généré le ${new Date().toLocaleDateString('fr-FR')} — CarVault`, 50, doc.page.height - 70, {
        width: doc.page.width - 100, align: 'center',
      });

    doc.addPage();
  }

  // ===================== PAGE 2 : FICHE VÉHICULE =====================

  _drawVehicleInfo(doc, vehicle) {
    this._drawHeader(doc, 'Fiche véhicule');

    let y = 120;
    const fields = [
      ['Marque', vehicle.brand],
      ['Modèle', vehicle.model],
      ['Année', String(vehicle.year)],
      ['Kilométrage', `${vehicle.mileage?.toLocaleString('fr-FR')} km`],
      ['Plaque d\'immatriculation', vehicle.licensePlate || 'N/C'],
      ['Couleur', vehicle.color || 'N/C'],
      ['Type de carburant', FUEL_TYPES[vehicle.fuelType] || 'N/C'],
      ['Prix d\'achat', vehicle.purchasePrice ? `${vehicle.purchasePrice.toLocaleString('fr-FR')} €` : 'N/C'],
      ['Ajouté le', new Date(vehicle.createdAt).toLocaleDateString('fr-FR')],
    ];

    fields.forEach(([label, value], i) => {
      const bgColor = i % 2 === 0 ? '#f9f7f4' : COLORS.white;
      doc.rect(50, y, doc.page.width - 100, 30).fill(bgColor);
      doc.fontSize(10).fillColor(COLORS.muted).font('Helvetica').text(label, 60, y + 9);
      doc.fontSize(10).fillColor(COLORS.dark).font('Helvetica-Bold').text(value, 280, y + 9);
      y += 30;
    });

    doc.addPage();
  }

  // ===================== PAGE 3+ : HISTORIQUE ENTRETIEN/DÉPENSES =====================

  _drawExpenseHistory(doc, expenses, stats) {
    this._drawHeader(doc, 'Historique des dépenses');

    if (!expenses || expenses.length === 0) {
      doc.fontSize(11).fillColor(COLORS.muted).font('Helvetica')
        .text('Aucune dépense enregistrée.', 50, 130);
      doc.addPage();
      return;
    }

    // En-tête du tableau
    let y = 120;
    this._drawTableRow(doc, y, ['Date', 'Catégorie', 'Description', 'Km', 'Montant'], true);
    y += 28;

    // Lignes
    const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    for (const exp of sorted) {
      if (y > doc.page.height - 80) {
        doc.addPage();
        this._drawHeader(doc, 'Historique des dépenses (suite)');
        y = 120;
        this._drawTableRow(doc, y, ['Date', 'Catégorie', 'Description', 'Km', 'Montant'], true);
        y += 28;
      }

      this._drawTableRow(doc, y, [
        new Date(exp.date).toLocaleDateString('fr-FR'),
        EXP_CATS[exp.category] || exp.category,
        (exp.description || '—').substring(0, 30),
        exp.mileage ? `${exp.mileage.toLocaleString('fr-FR')}` : '—',
        `${exp.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`,
      ], false);
      y += 24;
    }

    doc.addPage();
  }

  // ===================== DOCUMENTS =====================

  _drawDocumentList(doc, documents) {
    this._drawHeader(doc, 'Documents');

    if (!documents || documents.length === 0) {
      doc.fontSize(11).fillColor(COLORS.muted).font('Helvetica')
        .text('Aucun document enregistré.', 50, 130);
      doc.addPage();
      return;
    }

    // Grouper par type
    const grouped = {};
    for (const d of documents) {
      const typeName = DOC_TYPES[d.type] || d.type;
      if (!grouped[typeName]) grouped[typeName] = [];
      grouped[typeName].push(d);
    }

    let y = 120;
    for (const [typeName, docs] of Object.entries(grouped)) {
      if (y > doc.page.height - 120) {
        doc.addPage();
        this._drawHeader(doc, 'Documents (suite)');
        y = 120;
      }

      // Type header
      doc.rect(50, y, doc.page.width - 100, 26).fill(COLORS.dark);
      doc.fontSize(10).fillColor(COLORS.lime).font('Helvetica-Bold')
        .text(`${typeName} (${docs.length})`, 60, y + 7);
      y += 30;

      for (const d of docs) {
        if (y > doc.page.height - 60) {
          doc.addPage();
          this._drawHeader(doc, 'Documents (suite)');
          y = 120;
        }

        const expDate = d.expirationDate ? new Date(d.expirationDate) : null;
        const isExpired = expDate && expDate < new Date();
        const expStr = expDate
          ? `Exp: ${expDate.toLocaleDateString('fr-FR')}${isExpired ? ' (EXPIRÉ)' : ''}`
          : 'Pas d\'expiration';

        doc.fontSize(10).fillColor(COLORS.dark).font('Helvetica-Bold')
          .text(d.name, 60, y);
        doc.fontSize(9).fillColor(isExpired ? '#ef4444' : COLORS.muted).font('Helvetica')
          .text(expStr, 60, y + 14);
        doc.fontSize(9).fillColor(COLORS.muted).font('Helvetica')
          .text(`Ajouté le ${new Date(d.createdAt).toLocaleDateString('fr-FR')}`, 350, y + 7);

        y += 36;
      }

      y += 10;
    }

    doc.addPage();
  }

  // ===================== RÉSUMÉ FINANCIER =====================

  _drawFinancialSummary(doc, expenses, stats) {
    this._drawHeader(doc, 'Résumé financier');

    let y = 120;

    // Totaux
    const currentYear = new Date().getFullYear();
    const totalAll = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalYear = expenses
      .filter(e => new Date(e.date).getFullYear() === currentYear)
      .reduce((sum, e) => sum + e.amount, 0);
    const avgMonthly = totalYear / 12;

    const summaryItems = [
      ['Total général', `${totalAll.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`],
      [`Total ${currentYear}`, `${totalYear.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`],
      ['Moyenne mensuelle', `${avgMonthly.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`],
      ['Nombre de dépenses', String(expenses.length)],
    ];

    summaryItems.forEach(([label, value], i) => {
      const bgColor = i % 2 === 0 ? '#f9f7f4' : COLORS.white;
      doc.rect(50, y, 250, 35).fill(bgColor);
      doc.fontSize(10).fillColor(COLORS.muted).font('Helvetica').text(label, 60, y + 11);
      doc.fontSize(12).fillColor(COLORS.dark).font('Helvetica-Bold').text(value, 200, y + 10, { width: 90, align: 'right' });
      y += 35;
    });

    y += 30;

    // Répartition par catégorie
    doc.fontSize(13).fillColor(COLORS.dark).font('Helvetica-Bold')
      .text('Répartition par catégorie', 50, y);
    y += 25;

    const byCategory = {};
    for (const e of expenses) {
      const cat = EXP_CATS[e.category] || e.category;
      byCategory[cat] = (byCategory[cat] || 0) + e.amount;
    }

    const sortedCats = Object.entries(byCategory).sort(([, a], [, b]) => b - a);
    for (const [cat, total] of sortedCats) {
      const pct = totalAll > 0 ? (total / totalAll * 100).toFixed(1) : 0;

      // Barre de progression
      const barWidth = Math.min((total / totalAll) * 300, 300);
      doc.rect(50, y, 300, 12).fill(COLORS.lightGray);
      doc.rect(50, y, barWidth, 12).fill(COLORS.dark);

      doc.fontSize(9).fillColor(COLORS.dark).font('Helvetica-Bold')
        .text(`${cat}`, 360, y + 1);
      doc.fontSize(9).fillColor(COLORS.muted).font('Helvetica')
        .text(`${total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € (${pct}%)`, 430, y + 1);

      y += 22;
    }
  }

  // ===================== HELPERS =====================

  _drawHeader(doc, title) {
    doc.rect(0, 0, doc.page.width, 80).fill(COLORS.dark);
    doc.fontSize(18).fillColor(COLORS.white).font('Helvetica-Bold').text(title, 50, 30);
    doc.fontSize(8).fillColor(COLORS.lime).font('Helvetica').text('CARVAULT', doc.page.width - 110, 35);
  }

  _drawTableRow(doc, y, cells, isHeader) {
    const colWidths = [70, 80, 150, 60, 80];
    const colX = [55, 125, 205, 360, 425];

    if (isHeader) {
      doc.rect(50, y, doc.page.width - 100, 24).fill(COLORS.dark);
    }

    cells.forEach((cell, i) => {
      doc.fontSize(isHeader ? 9 : 9)
        .fillColor(isHeader ? COLORS.lime : COLORS.dark)
        .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
        .text(cell, colX[i], y + (isHeader ? 7 : 5), { width: colWidths[i], lineBreak: false });
    });

    if (!isHeader) {
      doc.moveTo(50, y + 22).lineTo(doc.page.width - 50, y + 22)
        .strokeColor(COLORS.lightGray).lineWidth(0.5).stroke();
    }
  }

  _drawFooter(doc) {
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor(COLORS.muted).font('Helvetica')
        .text(`Page ${i + 1} / ${pages.count}`, 50, doc.page.height - 30, {
          width: doc.page.width - 100,
          align: 'center',
        });
    }
  }
}

module.exports = new PdfService();
