#!/usr/bin/env node
/* ==========================================================================
   AFRICA BIOPHARMA — scripts/create-admin.js
   Script à exécuter UNE FOIS, en local, pour créer le premier compte admin.
   Ne fait jamais transiter le mot de passe en clair vers la base : il est
   hashé avec bcrypt avant insertion.

   Utilisation :
     DATABASE_URL="postgres://..." node scripts/create-admin.js \
       admin@africabiopharma.com "UnMotDePasseSolide!23"

   (nécessite les dépendances de /functions : `cd functions && npm install`
   avant d'exécuter ce script depuis la racine du projet, ou exécuter
   `npm install pg bcryptjs` dans /scripts si séparé du dossier functions)
   ========================================================================== */

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function main() {
  const [, , email, password] = process.argv;

  if (!email || !password) {
    console.error('Usage : node scripts/create-admin.js <email> <mot_de_passe>');
    process.exit(1);
  }

  if (password.length < 10) {
    console.error('Le mot de passe doit contenir au moins 10 caractères.');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('Variable DATABASE_URL manquante.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await pool.query(
      `INSERT INTO admin_users (email, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [email.trim().toLowerCase(), passwordHash]
    );
    console.log(`✅ Compte admin créé/mis à jour pour ${email}`);
  } catch (err) {
    console.error('Erreur lors de la création du compte admin :', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
