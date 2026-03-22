const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Labels français
const DOC_TYPES = {
  TECHNICAL_INSPECTION: 'Contrôle technique', INSURANCE: 'Assurance',
  REGISTRATION: 'Carte grise', INVOICE: 'Facture', ACCIDENT_REPORT: 'Constat amiable',
  WARRANTY: 'Garantie', OTHER: 'Autre',
};
const EXP_CATS = {
  MAINTENANCE: 'Entretien / Révision', OIL_CHANGE: 'Vidange', BRAKES: 'Freins / Plaquettes',
  TIRES: 'Pneus', BODYWORK: 'Carrosserie', TECHNICAL_INSPECTION: 'Contrôle technique',
  PARKING: 'Stationnement', TOLL: 'Péage', OTHER: 'Autre',
};
const FUEL_TYPES = {
  GASOLINE: 'Essence', DIESEL: 'Diesel', HYBRID: 'Hybride',
  ELECTRIC: 'Électrique', LPG: 'GPL', OTHER: 'Autre',
};

const CRITAIR_PDF_COLORS = {
  0: '#4ade80', 1: '#a78bfa', 2: '#facc15', 3: '#f97316', 4: '#b45309', 5: '#6b7280',
};
const CRITAIR_PDF_LABELS = {
  0: 'Electrique', 1: 'Crit\'Air 1', 2: 'Crit\'Air 2', 3: 'Crit\'Air 3', 4: 'Crit\'Air 4', 5: 'Crit\'Air 5',
};

const COLORS = {
  bg: '#f5f0eb',
  dark: '#1a1a1a',
  lime: '#b9ff66',
  muted: '#888888',
  accent: '#7c5cfc',
  white: '#ffffff',
  lightGray: '#e5e5e5',
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  red: '#ef4444',
};

// Résout le chemin physique d'une photo véhicule (stockée en DB comme /uploads/vehicles/xxx)
function resolvePhotoPath(photoUrl) {
  if (!photoUrl || typeof photoUrl !== 'string') return null;
  const relative = photoUrl.replace(/^\//, '');
  const candidates = [
    path.join(__dirname, '..', '..', relative),
    path.join(process.cwd(), relative),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch { /* ignore */ }
  }
  return null;
}

class PdfService {
  /**
   * Générer le dossier PDF complet d'un véhicule
   * @param {object} health - Score santé (optionnel)
   * @returns {Promise<Buffer>}
   */
  async generateVehicleDossier(vehicle, documents, expenses, stats, health) {
    if (!vehicle || typeof vehicle !== 'object') {
      return Promise.reject(new Error('Véhicule invalide'));
    }
    const safe = {
      documents: Array.isArray(documents) ? documents : [],
      expenses: Array.isArray(expenses) ? expenses : [],
      stats: stats && typeof stats === 'object' ? stats : {},
    };
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        bufferPages: true,
        info: {
          Title: `CarVault — Dossier revente — ${vehicle.brand || ''} ${vehicle.model || ''}`,
          Author: 'CarVault',
          Subject: 'Dossier exportable pour revente',
          Creator: 'CarVault PDF Generator',
        },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        this._drawCover(doc, vehicle, health);
        this._drawResaleSummary(doc, vehicle, safe.documents, safe.expenses);
        this._drawVehicleInfo(doc, vehicle, health);
        this._drawExpenseHistory(doc, safe.expenses, safe.stats);
        this._drawDocumentList(doc, safe.documents);
        this._drawFinancialSummary(doc, safe.expenses, safe.stats, health);
        this._drawFooter(doc);
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  // ===================== PAGE 1 : COUVERTURE =====================

  _drawCover(doc, vehicle, health) {
    // Fond sombre
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.dark);

    // Logo texte
    doc.fontSize(14).fillColor(COLORS.lime).font('Helvetica-Bold').text('CARVAULT', 50, 50);
    doc.fontSize(9).fillColor(COLORS.muted).font('Helvetica').text('Dossier exportable pour revente', 50, 68);

    // Score santé en haut à droite de la couverture
    if (health) {
      const scoreColor = this._getScoreColor(health.score);
      doc.fontSize(9).fillColor(COLORS.muted).font('Helvetica').text('Score santé', doc.page.width - 150, 50, { width: 100, align: 'right' });
      doc.fontSize(28).fillColor(scoreColor).font('Helvetica-Bold').text(`${health.score}/100`, doc.page.width - 150, 63, { width: 100, align: 'right' });
      doc.fontSize(9).fillColor(scoreColor).font('Helvetica').text(health.grade === 'A' ? 'Excellent' : health.grade === 'B' ? 'Bon' : health.grade === 'C' ? 'Moyen' : 'À améliorer', doc.page.width - 150, 93, { width: 100, align: 'right' });
    }

    // Photo du véhicule si disponible
    let photoY = 180;
    const photoPath = resolvePhotoPath(vehicle.photo);
    if (photoPath) {
      try {
        doc.image(photoPath, 100, 140, { width: 400, height: 220, fit: [400, 220], align: 'center' });
        photoY = 380;
      } catch { /* ignore */ }
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

  // ===================== PAGE 2 : RÉSUMÉ REVENTE =====================

  _drawResaleSummary(doc, vehicle, documents, expenses) {
    this._drawHeader(doc, 'Contenu du dossier revente');

    const hasPhoto = !!resolvePhotoPath(vehicle.photo);
    const byType = (documents || []).reduce((acc, d) => { acc[d.type] = (acc[d.type] || 0) + 1; return acc; }, {});
    const maintenanceCount = (expenses || []).filter(e => e.category === 'MAINTENANCE').length;
    const invoiceCount = byType.INVOICE || 0;
    const ctCount = byType.TECHNICAL_INSPECTION || 0;
    const carteGriseCount = byType.REGISTRATION || 0;

    const items = [
      { label: 'Kilométrage', value: `${vehicle.mileage?.toLocaleString('fr-FR') ?? '—'} km`, ok: true },
      { label: 'Historique entretien', value: maintenanceCount ? `${maintenanceCount} entrée(s)` : 'Aucune', ok: true },
      { label: 'Factures', value: invoiceCount ? `${invoiceCount} document(s)` : 'Aucune', ok: true },
      { label: 'Contrôle technique (CT)', value: ctCount ? `${ctCount} document(s)` : 'Aucun', ok: true },
      { label: 'Carte grise', value: carteGriseCount ? `${carteGriseCount} document(s)` : 'Aucune', ok: true },
      { label: 'Photos', value: hasPhoto ? 'Incluse(s)' : 'Aucune', ok: hasPhoto },
    ];

    let y = 120;
    items.forEach((item, i) => {
      doc.rect(50, y, doc.page.width - 100, 36).fill(i % 2 === 0 ? '#f9f7f4' : COLORS.white);
      doc.fontSize(11).fillColor(COLORS.dark).font('Helvetica-Bold').text(item.label, 60, y + 10);
      doc.fontSize(10).fillColor(item.ok ? COLORS.muted : COLORS.orange).font('Helvetica')
        .text(item.value, 60, y + 24, { width: doc.page.width - 180 });
      doc.fontSize(14).fillColor(item.ok ? COLORS.green : COLORS.muted).font('Helvetica')
        .text(item.ok ? '✓' : '—', doc.page.width - 80, y + 12);
      y += 40;
    });

    doc.addPage();
  }

  // ===================== PAGE 3 : FICHE VÉHICULE =====================

  _drawVehicleInfo(doc, vehicle, health) {
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
    ];

    // Specs techniques (depuis CarAPI)
    if (vehicle.horsepower) fields.push(['Puissance', `${vehicle.horsepower} ch`]);
    if (vehicle.engineSize) fields.push(['Cylindrée', `${vehicle.engineSize} L`]);
    if (vehicle.transmission) fields.push(['Transmission', vehicle.transmission]);
    if (vehicle.bodyType) fields.push(['Carrosserie', vehicle.bodyType]);
    if (vehicle.doors) fields.push(['Portes', String(vehicle.doors)]);
    if (vehicle.fiscalPower) fields.push(['Puissance fiscale', `${vehicle.fiscalPower} CV`]);
    if (vehicle.co2) fields.push(['Emissions CO2', `${vehicle.co2} g/km`]);
    if (vehicle.critAir != null) fields.push(['Vignette Crit\'Air', CRITAIR_PDF_LABELS[vehicle.critAir] || `Niveau ${vehicle.critAir}`]);

    fields.push(['Ajouté le', new Date(vehicle.createdAt).toLocaleDateString('fr-FR')]);

    fields.forEach(([label, value], i) => {
      const bgColor = i % 2 === 0 ? '#f9f7f4' : COLORS.white;
      doc.rect(50, y, doc.page.width - 100, 30).fill(bgColor);
      doc.fontSize(10).fillColor(COLORS.muted).font('Helvetica').text(label, 60, y + 9);
      doc.fontSize(10).fillColor(COLORS.dark).font('Helvetica-Bold').text(value, 280, y + 9);
      y += 30;
    });

    // Score santé breakdown
    if (health && y < doc.page.height - 200) {
      y += 20;
      doc.fontSize(13).fillColor(COLORS.dark).font('Helvetica-Bold').text('Score Santé', 50, y);
      y += 22;

      const breakdown = [
        health.breakdown?.maintenance && ['Entretien', health.breakdown.maintenance.score, health.breakdown.maintenance.max],
        health.breakdown?.documents && ['Documents', health.breakdown.documents.score, health.breakdown.documents.max],
        health.breakdown?.cost && ['Coût maîtrisé', health.breakdown.cost.score, health.breakdown.cost.max],
        health.breakdown?.completeness && ['Complétude', health.breakdown.completeness.score, health.breakdown.completeness.max],
      ].filter(Boolean);

      for (const [label, score, max] of breakdown) {
        const pct = max > 0 ? score / max : 0;
        const barWidth = pct * 200;
        const color = this._getScoreColor(pct * 100);

        doc.rect(50, y, 200, 10).fill(COLORS.lightGray);
        if (barWidth > 0) doc.rect(50, y, barWidth, 10).fill(color);
        doc.fontSize(9).fillColor(COLORS.dark).font('Helvetica-Bold').text(label, 260, y + 0);
        doc.fontSize(9).fillColor(COLORS.muted).font('Helvetica').text(`${score}/${max}`, 380, y + 0);
        y += 20;
      }

      // Total
      const scoreColor = this._getScoreColor(health.score);
      doc.fontSize(11).fillColor(scoreColor).font('Helvetica-Bold')
        .text(`Score global : ${health.score}/100 (${health.grade})`, 50, y + 5);
    }

    doc.addPage();
  }

  // ===================== PAGE 3+ : HISTORIQUE ENTRETIEN/DÉPENSES =====================

  _drawExpenseHistory(doc, expenses, _stats) {
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

      const amount = exp.amount != null ? Number(exp.amount) : 0;
      const dateStr = exp.date ? new Date(exp.date).toLocaleDateString('fr-FR') : '—';
      this._drawTableRow(doc, y, [
        dateStr,
        EXP_CATS[exp.category] || exp.category || '—',
        (exp.description || '—').substring(0, 30),
        exp.mileage != null ? `${Number(exp.mileage).toLocaleString('fr-FR')}` : '—',
        `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`,
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

    // Ordre pour revente : Carte grise, CT, Factures, puis le reste
    const typeOrder = [DOC_TYPES.REGISTRATION, DOC_TYPES.TECHNICAL_INSPECTION, DOC_TYPES.INVOICE];
    const orderedEntries = [
      ...typeOrder.filter(t => grouped[t]).map(t => [t, grouped[t]]),
      ...Object.entries(grouped).filter(([t]) => !typeOrder.includes(t)),
    ];

    let y = 120;
    for (const [typeName, docs] of orderedEntries) {
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
        const createdStr = d.createdAt ? new Date(d.createdAt).toLocaleDateString('fr-FR') : '';
        doc.fontSize(9).fillColor(COLORS.muted).font('Helvetica')
          .text(createdStr ? `Ajouté le ${createdStr}` : '', 350, y + 7);

        y += 36;
      }

      y += 10;
    }

    doc.addPage();
  }

  // ===================== RÉSUMÉ FINANCIER =====================

  _drawFinancialSummary(doc, expenses, _stats, health) {
    this._drawHeader(doc, 'Résumé financier');

    let y = 120;

    // Totaux
    const currentYear = new Date().getFullYear();
    const totalAll = (expenses || []).reduce((sum, e) => sum + (e.amount != null ? Number(e.amount) : 0), 0);
    const totalYear = (expenses || [])
      .filter(e => e.date && new Date(e.date).getFullYear() === currentYear)
      .reduce((sum, e) => sum + (e.amount != null ? Number(e.amount) : 0), 0);
    const avgMonthly = totalYear / 12;

    const summaryItems = [
      ['Total général', `${totalAll.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`],
      [`Total ${currentYear}`, `${totalYear.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`],
      ['Moyenne mensuelle', `${avgMonthly.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`],
      ['Nombre de dépenses', String(expenses.length)],
    ];

    // Ajouter la valeur estimée si disponible
    if (health?.estimatedValue) {
      summaryItems.push(['Valeur estimée', `${health.estimatedValue.toLocaleString('fr-FR')} €`]);
    }

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
    for (const e of expenses || []) {
      const cat = EXP_CATS[e.category] || e.category || 'Autre';
      const amt = e.amount != null ? Number(e.amount) : 0;
      byCategory[cat] = (byCategory[cat] || 0) + amt;
    }

    const sortedCats = Object.entries(byCategory).sort(([, a], [, b]) => b - a);
    for (const [cat, total] of sortedCats) {
      const pct = totalAll > 0 ? (total / totalAll * 100).toFixed(1) : 0;

      // Barre de progression
      const barWidth = totalAll > 0 ? Math.min((total / totalAll) * 300, 300) : 0;
      doc.rect(50, y, 300, 12).fill(COLORS.lightGray);
      if (barWidth > 0) doc.rect(50, y, barWidth, 12).fill(COLORS.dark);

      doc.fontSize(9).fillColor(COLORS.dark).font('Helvetica-Bold')
        .text(`${cat}`, 360, y + 1);
      doc.fontSize(9).fillColor(COLORS.muted).font('Helvetica')
        .text(`${total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € (${pct}%)`, 430, y + 1);

      y += 22;
    }
  }

  // ===================== HELPERS =====================

  _getScoreColor(score) {
    if (score >= 80) return COLORS.green;
    if (score >= 60) return COLORS.yellow;
    if (score >= 40) return COLORS.orange;
    return COLORS.red;
  }

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
    const range = doc.bufferedPageRange();
    const totalPages = range.start + range.count;
    for (let i = 0; i < range.count; i++) {
      const pageIndex = range.start + i;
      doc.switchToPage(pageIndex);
      doc.fontSize(8).fillColor(COLORS.muted).font('Helvetica')
        .text(`Page ${pageIndex + 1} / ${totalPages}`, 50, doc.page.height - 30, {
          width: doc.page.width - 100,
          align: 'center',
        });
    }
  }
}

module.exports = new PdfService();
