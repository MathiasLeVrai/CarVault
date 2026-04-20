const nodemailer = require('nodemailer');
const { Resend } = require('resend');

class EmailService {
  constructor() {
    this._client = null;
    this._smtpInit = false;
    this._smtpTransporter = null;
  }

  _getClient() {
    if (this._client) return this._client;
    if (!process.env.RESEND_API_KEY) return null;
    this._client = new Resend(process.env.RESEND_API_KEY);
    return this._client;
  }

  /**
   * Transporter Nodemailer (Gmail, Brevo, etc.) — utilisé par les crons digest/rapport.
   */
  _getTransporter() {
    if (this._smtpInit) return this._smtpTransporter;
    this._smtpInit = true;
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
      this._smtpTransporter = null;
      return null;
    }
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const passNormalized = String(pass).replace(/\s/g, '');
    this._smtpTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass: passNormalized },
    });
    return this._smtpTransporter;
  }

  /** Resend « onboarding » n’autorise pas l’envoi vers n’importe quel destinataire — préférer SMTP si configuré. */
  _usesResendOnboarding() {
    const from = process.env.RESEND_FROM || '';
    return from.includes('onboarding@resend.dev');
  }

  isConfigured() {
    return !!(
      process.env.RESEND_API_KEY
      || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
    );
  }

  _getFrom() {
    return process.env.RESEND_FROM || 'CarVault <noreply@carvault.fly.dev>';
  }

  smtpFromHeader() {
    return process.env.SMTP_FROM || `CarVault <${process.env.SMTP_USER}>`;
  }

  /**
   * Resend puis SMTP (ou SMTP d’abord si expéditeur onboarding Resend + SMTP dispo).
   */
  async _sendMailDual(to, subject, html) {
    const smtp = this._getTransporter();
    const client = this._getClient();
    const preferSmtpFirst = !!(smtp && this._usesResendOnboarding());

    const attemptSmtp = async () => {
      if (!smtp) return false;
      try {
        await smtp.sendMail({
          from: this.smtpFromHeader(),
          to,
          subject,
          html,
        });
        return true;
      } catch (err) {
        console.error('[EMAIL] SMTP:', err.message);
        return false;
      }
    };

    const attemptResend = async () => {
      if (!client) return false;
      try {
        await client.emails.send({
          from: this._getFrom(),
          to,
          subject,
          html,
        });
        return true;
      } catch (err) {
        console.error('[EMAIL] Resend:', err.message);
        return false;
      }
    };

    if (preferSmtpFirst) {
      if (await attemptSmtp()) return true;
      if (await attemptResend()) return true;
      console.error(
        '[EMAIL] Échec envoi (SMTP puis Resend). Vérifie SMTP_* ou domaine Resend vérifié + RESEND_FROM.',
      );
      return false;
    }

    if (await attemptResend()) return true;
    if (await attemptSmtp()) return true;

    if (!client && !smtp) {
      console.error('[EMAIL] Aucun transport configuré (RESEND_API_KEY ou SMTP_HOST/SMTP_USER/SMTP_PASS).');
    } else {
      console.error('[EMAIL] Échec envoi (Resend puis SMTP).');
    }
    return false;
  }

  /**
   * Envoie un email d'alerte document/entretien à un utilisateur
   */
  async sendAlertEmail(userEmail, userName, alertTitle, alertMessage, dueDate = null) {
    const client = this._getClient();
    const smtp = this._getTransporter();
    if (!client && !smtp) return false;

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

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
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
    <a href="${appUrl}/alerts" style="display:block;text-align:center;padding:14px 24px;background:#e63946;color:#fff;border-radius:12px;font-weight:700;text-decoration:none;font-size:14px;">Voir mes alertes</a>
  </td></tr>
  <tr><td style="padding:16px 32px;background:#f9f9fb;border-top:1px solid #eeeeee;">
    <p style="margin:0;font-size:11px;color:#aaaaaa;text-align:center;">CarVault · <a href="${appUrl}/alerts" style="color:#aaaaaa;text-decoration:none;">Gérer mes notifications</a></p>
  </td></tr>
</table></td></tr></table>
</body></html>`;

    return this._sendMailDual(userEmail, `CarVault — ${alertTitle}`, html);
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(userEmail, userName, resetLink) {
    const appUrl = process.env.APP_URL || 'https://carvault.fly.dev';

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="background:#1a1a1a;padding:24px 32px;">
    <span style="color:#b9ff66;font-size:20px;font-weight:800;letter-spacing:-0.5px;">CAR<span style="color:#fff;">VAULT</span></span>
  </td></tr>
  <tr><td style="padding:32px;">
    <p style="margin:0 0 8px;font-size:13px;color:#888888;">Bonjour ${userName || ''},</p>
    <h2 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#1a1a1a;">Réinitialisation de mot de passe</h2>
    <div style="padding:16px;background:#f9f9fb;border-radius:12px;border-left:4px solid #e63946;margin-bottom:20px;">
      <p style="margin:0;font-size:14px;color:#444444;line-height:1.6;">Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.</p>
    </div>
    <p style="margin:0 0 20px;font-size:12px;color:#888888;">Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
    <a href="${resetLink}" style="display:block;text-align:center;padding:14px 24px;background:#e63946;color:#fff;border-radius:12px;font-weight:700;text-decoration:none;font-size:14px;">Réinitialiser mon mot de passe</a>
  </td></tr>
  <tr><td style="padding:16px 32px;background:#f9f9fb;border-top:1px solid #eeeeee;">
    <p style="margin:0;font-size:11px;color:#aaaaaa;text-align:center;">CarVault · <a href="${appUrl}" style="color:#aaaaaa;text-decoration:none;">carvault.fly.dev</a></p>
  </td></tr>
</table></td></tr></table>
</body></html>`;

    return this._sendMailDual(
      userEmail,
      'CarVault — Réinitialisation de votre mot de passe',
      html,
    );
  }

  /**
   * Au démarrage du serveur : rappel en français si l’email « mot de passe oublié » risque de ne pas partir.
   */
  logStartupHint() {
    const user = (process.env.SMTP_USER || '').trim();
    const pass = process.env.SMTP_PASS || '';
    const hasSmtp = !!(process.env.SMTP_HOST && user && pass);
    const onboarding = this._usesResendOnboarding();
    const exampleUser = /^(ton|your)@/i.test(user) || user === 'your@gmail.com';
    const examplePass = /xxxx/i.test(pass) || /^your-app-password$/i.test(String(pass).trim());

    if (!process.env.APP_URL) {
      console.log(
        '[EMAIL] Pas de APP_URL dans .env → le lien du mail utilise l’adresse par défaut du code. En local, mets APP_URL=http://localhost:5173',
      );
    }

    if (onboarding && !hasSmtp) {
      console.warn(
        '[EMAIL] Problème : Resend « onboarding » ne peut pas envoyer le reset à tous les utilisateurs. Remplis SMTP_USER + SMTP_PASS (Gmail : mot de passe d’application).',
      );
      return;
    }

    if (hasSmtp && (exampleUser || examplePass)) {
      console.warn(
        '[EMAIL] SMTP a l’air encore être un exemple (ton@gmail / xxxx…). Ouvre .env et mets ton vrai Gmail + mot de passe d’application Google (16 caractères). Guide : https://support.google.com/accounts/answer/185833',
      );
      return;
    }

    if (hasSmtp || process.env.RESEND_API_KEY) {
      console.log('[EMAIL] OK — envoi possible (SMTP et/ou Resend).');
    }
  }
}

module.exports = new EmailService();
