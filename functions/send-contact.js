/* ==========================================================================
   AFRICA BIOPHARMA — /functions/send-contact.js
   Netlify Function (Node.js) pour le formulaire de contact générique de
   la section #contact. Même logique anti-bot et d'envoi que
   /functions/send-order.js (Session 6) — voir ce fichier pour le détail
   des variables d'environnement SMTP / reCAPTCHA à configurer.
   ========================================================================== */

const nodemailer = require('nodemailer');

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  // ---------- 1. Honeypot ----------
  if (data.honeypot && String(data.honeypot).trim() !== '') {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  // ---------- 2. Champs obligatoires ----------
  const required = ['nom', 'telephone', 'message', 'consentement'];
  const missing = required.filter((key) => !data[key]);
  if (missing.length || data.consentement !== true) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'Champs obligatoires manquants.' })
    };
  }

  // ---------- 3. reCAPTCHA v3 ----------
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  const minScore = parseFloat(process.env.RECAPTCHA_MIN_SCORE || '0.5');

  if (secretKey) {
    if (!data.recaptchaToken) {
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }
    try {
      const verifyResponse = await fetch(RECAPTCHA_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(data.recaptchaToken)}`
      });
      const verifyResult = await verifyResponse.json();
      if (!verifyResult.success || (typeof verifyResult.score === 'number' && verifyResult.score < minScore)) {
        return { statusCode: 200, body: JSON.stringify({ ok: true }) };
      }
    } catch (err) {
      console.error('Erreur de vérification reCAPTCHA :', err);
    }
  }

  // ---------- 4. Envoi de l'email ----------
  const notifyEmail = process.env.ORDER_NOTIFY_EMAIL || 'afrikapharma1@gmail.com';
  const now = new Date();
  const formattedDate = now.toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Africa/Porto-Novo' });

  const emailBody = [
    'Nouveau message reçu via le formulaire de contact du site AFRICA BIOPHARMA',
    '',
    `Nom : ${data.nom}`,
    data.email ? `Email : ${data.email}` : null,
    `Téléphone : ${data.telephone}`,
    '',
    'Message :',
    data.message,
    '',
    `Reçu le : ${formattedDate}`
  ].filter(Boolean).join('\n');

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    await transporter.sendMail({
      from: `"Site Africa Biopharma" <${process.env.SMTP_USER}>`,
      to: notifyEmail,
      replyTo: data.email || process.env.SMTP_USER,
      subject: `Nouveau message de contact — ${data.nom}`,
      text: emailBody
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("Erreur d'envoi de l'email de contact :", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Échec de l'envoi de l'email." })
    };
  }
};
