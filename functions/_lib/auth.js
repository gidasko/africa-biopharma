/* ==========================================================================
   AFRICA BIOPHARMA — functions/_lib/auth.js
   Authentification admin : signature/vérification JWT, gestion du cookie
   httpOnly + secure, middleware de protection des routes admin, et
   vérification anti brute-force basée sur la table login_attempts.

   Variable d'environnement requise : JWT_SECRET
   (secret aléatoire long — voir README, Session 9, pour le générer).
   ========================================================================== */

const jwt = require('jsonwebtoken');
const { query } = require('./db');

const COOKIE_NAME = 'abp_admin_session';
const TOKEN_TTL_SECONDS = 60 * 60 * 8; // 8 heures
const MAX_ATTEMPTS = 5;
const ATTEMPTS_WINDOW_MINUTES = 15;

/**
 * Signe un JWT pour un utilisateur admin.
 */
function signToken(adminUser) {
  return jwt.sign(
    { sub: adminUser.id, email: adminUser.email },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_TTL_SECONDS }
  );
}

/**
 * Construit l'en-tête Set-Cookie httpOnly + secure + SameSite pour le token.
 */
function buildSessionCookie(token) {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    `Max-Age=${TOKEN_TTL_SECONDS}`
  ];
  return parts.join('; ');
}

/**
 * Cookie de déconnexion (valeur vide, expiration immédiate).
 */
function buildLogoutCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

/**
 * Extrait le token de session depuis l'en-tête Cookie de la requête.
 */
function getTokenFromEvent(event) {
  const cookieHeader = event.headers?.cookie || event.headers?.Cookie || '';
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

/**
 * Middleware : vérifie la présence et la validité du JWT dans le cookie.
 * Retourne le payload décodé si valide, ou null sinon.
 */
function requireAdmin(event) {
  const token = getTokenFromEvent(event);
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Réponse 401 standardisée pour les routes protégées.
 */
function unauthorizedResponse() {
  return {
    statusCode: 401,
    body: JSON.stringify({ ok: false, error: 'Non authentifié.' })
  };
}

/**
 * Vérifie si un email a dépassé le nombre d'échecs de connexion autorisés
 * sur la fenêtre glissante définie (anti brute-force).
 */
async function isLockedOut(email) {
  const result = await query(
    `SELECT COUNT(*) AS failures
     FROM login_attempts
     WHERE email = $1
       AND success = false
       AND attempted_at > now() - ($2 || ' minutes')::interval`,
    [email, ATTEMPTS_WINDOW_MINUTES]
  );
  return parseInt(result.rows[0].failures, 10) >= MAX_ATTEMPTS;
}

/**
 * Enregistre une tentative de connexion (réussie ou échouée).
 */
async function recordAttempt(email, ipAddress, success) {
  await query(
    `INSERT INTO login_attempts (email, ip_address, success) VALUES ($1, $2, $3)`,
    [email, ipAddress, success]
  );
}

module.exports = {
  signToken,
  buildSessionCookie,
  buildLogoutCookie,
  requireAdmin,
  unauthorizedResponse,
  isLockedOut,
  recordAttempt,
  MAX_ATTEMPTS,
  ATTEMPTS_WINDOW_MINUTES
};
