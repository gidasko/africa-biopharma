/* ==========================================================================
   AFRICA BIOPHARMA — /functions/admin-contact.js
   Route protégée :
   - GET  -> réglages de contact actuels (pré-remplissage du formulaire admin)
   - POST -> met à jour les réglages de contact
   ========================================================================== */

const { query } = require('./_lib/db');
const { requireAdmin, unauthorizedResponse } = require('./_lib/auth');

exports.handler = async (event) => {
  const admin = requireAdmin(event);
  if (!admin) return unauthorizedResponse();

  if (event.httpMethod === 'GET') {
    const result = await query('SELECT phone1, phone2, email, address FROM contact_settings WHERE id = 1');
    return { statusCode: 200, body: JSON.stringify({ ok: true, contact: result.rows[0] || {} }) };
  }

  if (event.httpMethod === 'POST') {
    let data;
    try {
      data = JSON.parse(event.body || '{}');
    } catch (err) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Requête invalide.' }) };
    }

    const { phone1, phone2, email, address } = data;

    if (!phone1 || !phone2 || !email || !address) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Tous les champs sont requis.' }) };
    }

    const result = await query(
      `UPDATE contact_settings
       SET phone1 = $1, phone2 = $2, email = $3, address = $4, updated_at = now()
       WHERE id = 1
       RETURNING phone1, phone2, email, address`,
      [phone1.trim(), phone2.trim(), email.trim(), address.trim()]
    );

    return { statusCode: 200, body: JSON.stringify({ ok: true, contact: result.rows[0] }) };
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};
