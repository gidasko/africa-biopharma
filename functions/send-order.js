/* ==========================================================================
   AFRICA BIOPHARMA — /functions/send-order.js
   Netlify Function (Node.js) : reçoit la demande de commande envoyée par
   la modale, revérifie le honeypot ET le score reCAPTCHA côté serveur
   (ne jamais faire confiance à la seule vérification client), puis
   envoie un email récapitulatif via Nodemailer/SMTP.

   ------------------------------------------------------------------------
   VARIABLES D'ENVIRONNEMENT À CONFIGURER (Netlify > Site settings >
   Environment variables) :

   SMTP_HOST            Hôte SMTP (ex: smtp.gmail.com, ou celui de
                        Resend/SendGrid/Mailgun...)
   SMTP_PORT            Port SMTP (ex: 587)
   SMTP_SECURE          "true" si port 465 (TLS direct), sinon "false"
   SMTP_USER            Identifiant SMTP
   SMTP_PASSWORD        Mot de passe / clé API SMTP
   ORDER_NOTIFY_EMAIL   Adresse qui reçoit les commandes
                        (afrikapharma1@gmail.com par défaut — Session 9
                        permettra de la modifier depuis l'admin)
   RECAPTCHA_SECRET_KEY Clé secrète reCAPTCHA v3 (jamais exposée au
                        client — voir https://www.google.com/recaptcha/admin)
   RECAPTCHA_MIN_SCORE  Score minimal accepté (0 à 1). Valeur par défaut
                        recommandée : 0.5

   Alternative : remplacer le transport Nodemailer/SMTP ci-dessous par
   l'appel HTTP à l'API d'un service comme Resend ou SendGrid si préféré ;
   la structure générale (vérification anti-bot -> construction de
   l'email -> envoi -> réponse) reste identique.
   ------------------------------------------------------------------------ */

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

  // ---------- 1. Vérification honeypot ----------
  // Un champ honeypot non vide = comportement de bot quasi certain.
  // Rejet silencieux : on renvoie un succès générique pour ne pas
  // révéler au bot que sa demande a été bloquée.
  if (data.honeypot && String(data.honeypot).trim() !== '') {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  // ---------- 2. Validation des champs obligatoires ----------
  const required = ['produit', 'nom', 'telephone', 'ville', 'consentement'];
  const missing = required.filter((key) => !data[key]);
  if (missing.length || data.consentement !== true) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'Champs obligatoires manquants.' })
    };
  }

  // ---------- 3. Vérification reCAPTCHA v3 ----------
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  const minScore = parseFloat(process.env.RECAPTCHA_MIN_SCORE || '0.5');

  if (secretKey) {
    if (!data.recaptchaToken) {
      // Pas de jeton alors qu'une clé secrète est configurée : suspect.
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
        // Score trop faible ou vérification échouée : rejet silencieux.
        return { statusCode: 200, body: JSON.stringify({ ok: true }) };
      }
    } catch (err) {
      // En cas d'erreur réseau vers Google, on choisit de ne pas bloquer
      // une commande légitime : on continue le traitement normalement.
      console.error('Erreur de vérification reCAPTCHA :', err);
    }
  }

  // ---------- 4. Construction et envoi de l'email ----------
  const notifyEmail = process.env.ORDER_NOTIFY_EMAIL || 'afrikapharma1@gmail.com';

  const priceLine = (data.prixUnitaire === null || data.prixUnitaire === undefined)
    ? 'Prix unitaire : sur demande\nPrix total : sur demande'
    : `Prix unitaire : ${Number(data.prixUnitaire).toLocaleString('fr-FR')} FCFA\n` +
      `Prix total (x${data.quantite || 1}) : ${Number(data.prixTotal).toLocaleString('fr-FR')} FCFA`;

  const now = new Date();
  const formattedDate = now.toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Africa/Porto-Novo' });

  const emailBody = [
    `Nouvelle demande d'achat reçue sur le site AFRICA BIOPHARMA`,
    ``,
    `Produit : ${data.produit}`,
    priceLine,
    `Quantité : ${data.quantite || 1}`,
    ``,
    `Client : ${data.nom}`,
    `Téléphone / WhatsApp : ${data.telephone}`,
    `Ville / Quartier : ${data.ville}`,
    data.message ? `Message du client : ${data.message}` : null,
    ``,
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
      replyTo: process.env.SMTP_USER,
      subject: `Nouvelle demande d'achat — ${data.produit}`,
      text: emailBody
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("Erreur d'envoi de l'email de commande :", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Échec de l'envoi de l'email." })
    };
  }
};
