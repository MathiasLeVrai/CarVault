const prisma = require('../lib/prisma');

const BASE_URL = 'https://bankaccountdata.gocardless.com/api/v2';

// Keywords to detect fuel purchases in transaction descriptions
const FUEL_KEYWORDS = [
  'station', 'carburant', 'essence', 'gasoil', 'gazole',
  'esso', 'total energies', 'totalenergies', 'bp ', ' bp ', 'shell',
  'leclerc', 'carrefour', 'intermarche', 'intermarché', 'systeme u',
  'casino carburant', 'géant casino', 'auchan', 'e. leclerc',
  'primoil', 'agip', 'q8', 'dyneff', 'rouen energie',
];

function isFuelTransaction(description = '', amount = 0) {
  const lower = description.toLowerCase();
  const hasFuelKeyword = FUEL_KEYWORDS.some(kw => lower.includes(kw));
  // Fuel fill-up typically 20–150€ debit
  const isDebit = amount < 0;
  const isReasonableAmount = Math.abs(amount) >= 15 && Math.abs(amount) <= 200;
  return hasFuelKeyword && isDebit && isReasonableAmount;
}

class NordigenService {
  constructor() {
    this._token = null;
    this._tokenExpiry = null;
  }

  isConfigured() {
    return !!(process.env.NORDIGEN_SECRET_ID && process.env.NORDIGEN_SECRET_KEY);
  }

  async getToken() {
    // Return cached token if still valid (with 60s buffer)
    if (this._token && this._tokenExpiry && Date.now() < this._tokenExpiry - 60_000) {
      return this._token;
    }

    const res = await fetch(`${BASE_URL}/token/new/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        secret_id: process.env.NORDIGEN_SECRET_ID,
        secret_key: process.env.NORDIGEN_SECRET_KEY,
      }),
    });
    if (!res.ok) throw new Error('Nordigen auth failed');
    const data = await res.json();
    this._token = data.access;
    // access tokens are valid for 24h; use access_expires if provided
    const expiresIn = (data.access_expires || 86400) * 1000;
    this._tokenExpiry = Date.now() + expiresIn;
    return this._token;
  }

  async listInstitutions(country = 'FR') {
    const token = await this.getToken();
    const res = await fetch(`${BASE_URL}/institutions/?country=${country}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to list institutions');
    const data = await res.json();
    return data.map(inst => ({
      id: inst.id,
      name: inst.name,
      logo: inst.logo,
      bic: inst.bic,
    }));
  }

  async createRequisition(userId, institutionId, institutionName, redirectUrl) {
    const token = await this.getToken();

    // Create end user agreement (90 day access, transactions scope)
    const agreementRes = await fetch(`${BASE_URL}/agreements/enduser/`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        institution_id: institutionId,
        max_historical_days: 90,
        access_valid_for_days: 90,
        access_scope: ['balances', 'details', 'transactions'],
      }),
    });
    if (!agreementRes.ok) throw new Error('Failed to create agreement');
    const agreement = await agreementRes.json();

    // Create requisition
    const reqRes = await fetch(`${BASE_URL}/requisitions/`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        redirect: redirectUrl,
        institution_id: institutionId,
        agreement: agreement.id,
        reference: `carvault_${userId}_${Date.now()}`,
        user_language: 'FR',
      }),
    });
    if (!reqRes.ok) throw new Error('Failed to create requisition');
    const requisition = await reqRes.json();

    // Upsert bank connection in DB
    await prisma.bankConnection.upsert({
      where: { userId },
      create: { userId, institutionId, institutionName, requisitionId: requisition.id, status: 'pending' },
      update: { institutionId, institutionName, requisitionId: requisition.id, accountId: null, status: 'pending' },
    });

    return { link: requisition.link, requisitionId: requisition.id };
  }

  async handleCallback(userId) {
    const connection = await prisma.bankConnection.findUnique({ where: { userId } });
    if (!connection || connection.status !== 'pending') return null;

    const token = await this.getToken();
    const res = await fetch(`${BASE_URL}/requisitions/${connection.requisitionId}/`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to get requisition');
    const req = await res.json();

    if (req.status !== 'LN' || !req.accounts?.length) {
      return { status: req.status };
    }

    const accountId = req.accounts[0];
    await prisma.bankConnection.update({
      where: { userId },
      data: { accountId, status: 'linked' },
    });

    return { status: 'linked', accountId };
  }

  async getConnection(userId) {
    return prisma.bankConnection.findUnique({ where: { userId } });
  }

  async disconnect(userId) {
    await prisma.bankConnection.deleteMany({ where: { userId } });
  }

  async detectFuelTransactions(userId) {
    const connection = await prisma.bankConnection.findUnique({ where: { userId } });
    if (!connection || connection.status !== 'linked' || !connection.accountId) {
      throw new Error('Compte bancaire non connecté');
    }

    const token = await this.getToken();
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 60); // last 60 days
    const dateFromStr = dateFrom.toISOString().split('T')[0];

    const res = await fetch(
      `${BASE_URL}/accounts/${connection.accountId}/transactions/?date_from=${dateFromStr}`,
      { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } }
    );
    if (!res.ok) throw new Error('Failed to fetch transactions');
    const data = await res.json();

    const transactions = data.transactions?.booked || [];

    const fuelTxs = transactions
      .filter(tx => {
        const amount = parseFloat(tx.transactionAmount?.amount || '0');
        const desc = tx.remittanceInformationUnstructured || tx.additionalInformation || tx.creditorName || '';
        return isFuelTransaction(desc, amount);
      })
      .map(tx => ({
        id: tx.transactionId,
        date: tx.valueDate || tx.bookingDate,
        amount: Math.abs(parseFloat(tx.transactionAmount?.amount || '0')),
        currency: tx.transactionAmount?.currency || 'EUR',
        description: tx.remittanceInformationUnstructured || tx.additionalInformation || tx.creditorName || 'Station service',
        creditor: tx.creditorName || '',
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return fuelTxs;
  }
}

module.exports = new NordigenService();
