/* ==========================================================================
   AFRICA BIOPHARMA — /functions/admin-login.js
   Authentifie un compte admin (email + mot de passe), pose un cookie de
   session JWT httpOnly + secure en cas de succès. Protégé contre le
   brute-force via la table login_attempts (5 échecs / 15 min max).
   ========================================================================== */

const bcrypt = require('bcryptjs');
const { query } = require('./_lib/db');
const { signToken, buildSessionCookie, isLockedOut, recordAttempt } = require('./_lib/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Requête invalide.' }) };
  }

  const email = (data.email || '').trim().toLowerCase();
  const password = data.password || '';
  const ipAddress = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';

  if (!email || !password) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Email et mot de passe requis.' }) };
  }

  // ---------- Anti brute-force ----------
  const lockedOut = await isLockedOut(email);
  if (lockedOut) {
    return {
      statusCode: 429,
      body: JSON.stringify({
        ok: false,
        error: 'Trop de tentatives. Réessayez dans quelques minutes.'
      })
    };
  }

  // ---------- Vérification des identifiants ----------
  const result = await query('SELECT id, email, password_hash FROM admin_users WHERE email = $1', [email]);
  const adminUser = result.rows[0];

  const passwordMatches = adminUser
    ? await bcrypt.compare(password, adminUser.password_hash)
    : false; // on compare quand même un hash factice pour éviter un timing attack évident
  if (!adminUser) {
    await bcrypt.compare(password, '$2a$10$invalidsaltinvalidsaltinvalidsalt');
  }

  await recordAttempt(email, ipAddress, Boolean(adminUser && passwordMatches));

  if (!adminUser || !passwordMatches) {
    return {
      statusCode: 401,
      body: JSON.stringify({ ok: false, error: 'Email ou mot de passe incorrect.' })
    };
  }

  // ---------- Succès : émission du cookie de session ----------
  const token = signToken(adminUser);

  return {
    statusCode: 200,
    headers: { 'Set-Cookie': buildSessionCookie(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true, email: adminUser.email })
  };
};
