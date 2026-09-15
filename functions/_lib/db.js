/* ==========================================================================
   AFRICA BIOPHARMA — functions/_lib/db.js
   Pool de connexion PostgreSQL partagé entre toutes les Netlify Functions.
   Variable d'environnement requise : DATABASE_URL
   (chaîne de connexion Supabase ou Neon — voir README, Session 9).
   ========================================================================== */

const { Pool } = require('pg');

// Réutilise le même Pool entre les invocations "chaudes" de la fonction
// (les environnements serverless recyclent parfois le même processus).
let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // requis par Supabase/Neon en TLS
    });
  }
  return pool;
}

/**
 * Exécute une requête SQL paramétrée.
 * @param {string} text
 * @param {Array} params
 */
async function query(text, params) {
  const client = getPool();
  return client.query(text, params);
}

module.exports = { query, getPool };
