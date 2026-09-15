/* ==========================================================================
   AFRICA BIOPHARMA — /functions/admin-logout.js
   Efface le cookie de session admin.
   ========================================================================== */

const { buildLogoutCookie } = require('./_lib/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  return {
    statusCode: 200,
    headers: { 'Set-Cookie': buildLogoutCookie(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true })
  };
};
