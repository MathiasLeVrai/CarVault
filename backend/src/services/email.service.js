const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this._transporter = null;
  }

  _getTransporter() {
    if (this._transporter) return this._transporter;
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
    this._transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    return this._transporter;
  }

  isConfigured() {
    return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  }

  /**
   * Envoie un email d'alerte document/entretien à un utilisateur
   */
  async sendAlertEmail(userEmail, userName, alertTitle, alertMessage, dueDate = null) {
    const transporter = this._getTransporter();
    if (!transporter) return false;

    const daysLeft = dueDate ? Math.ceil((new Date(dueDate) - new Date()) / 864e5) : null;
    const urgencyColor =
      daysLeft === null ? '#888888' :
      daysLeft < 0     ? '#e63946' :
      daysLeft <= 7    ? '#f97316' : '#22c55e';

    const urgencyLabel =
      daysLeft === null      ? '' :
      daysLeft < 0           ? 'Expiré' :
      daysLeft === 0         ? 'Expire aujourd\'hui' :
                               `Expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`;

    const appUrl = process.env.APP_URL || 'https://carvault.fly.dev';

    try {
      await transporter.sendMail({
        from: `"CarVault" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: userEmail,
        subject: `🔔 CarVault — ${alertTitle}`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="background:#1a1a1a;padding:24px 32px;">
    <span style="color:#b9ff66;font-size:20px;font-weight:800;letter-spacing:-0.5px;">CAR<span style="color:#fff;">VAULT</span></span>
  </td></tr>
  <tr><td style="padding:32px;">
    <p style="margin:0 0 8px;font-size:13px;color:#888888;">Bonjour ${userName || ''},</p>
    <h2 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#1a1a1a;">${alertTitle}</h2>
    <div style="padding:16px;background:#f9f9fb;border-radius:12px;border-left:4px solid ${urgencyColor};margin-bottom:20px;">
      <p style="margin:0;font-size:14px;color:#444444;line-height:1.6;">${alertMessage}</p>
    </div>
    ${urgencyLabel ? `<div style="text-align:center;margin-bottom:20px;">
      <span style="display:inline-block;padding:8px 20px;border-radius:999px;background:${urgencyColor}20;color:${urgencyColor};font-weight:700;font-size:13px;">${urgencyLabel}</span>
    </div>` : ''}
    <a href="${appUrl}/alerts" style="display:block;text-align:center;padding:14px 24px;background:#e63946;color:#fff;border-radius:12px;font-weight:700;text-decoration:none;font-size:14px;">Voir mes alertes →</a>
  </td></tr>
  <tr><td style="padding:16px 32px;background:#f9f9fb;border-top:1px solid #eeeeee;">
    <p style="margin:0;font-size:11px;color:#aaaaaa;text-align:center;">CarVault · <a href="${appUrl}/alerts" style="color:#aaaaaa;text-decoration:none;">Gérer mes notifications</a></p>
  </td></tr>
</table></td></tr></table>
</body></html>`,
      });
      return true;
    } catch (err) {
      console.error('[EMAIL] Erreur envoi:', err.message);
      return false;
    }
  }
}

module.exports = new EmailService();
