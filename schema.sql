-- ==============================================================================
-- AFRICA BIOPHARMA — schema.sql
-- Schéma PostgreSQL (Supabase / Neon, comme défini en Session 1).
-- À exécuter une seule fois sur la base de données de production.
-- ==============================================================================

-- ---------- Extension utile pour les identifiants aléatoires (optionnel) ----------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- Table des produits ----------
CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  price       NUMERIC(12, 2),              -- NULL = "Prix sur demande"
  images      JSONB NOT NULL DEFAULT '[null, null, null, null]'::jsonb,
              -- tableau de 4 emplacements ; chaque élément est une URL Cloudinary
              -- (string) ou null si l'emplacement est vide. L'ordre du tableau
              -- correspond à l'ordre d'affichage dans le slider public.
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed des 8 produits — slugs identiques à ceux utilisés dans
-- js/products-data.js et aux ancres HTML (#biokamel, #bio-alpha-12, ...)
INSERT INTO products (slug, name, price, images) VALUES
  ('biokamel',          'Biokamel',          NULL, '[null, null, null, null]'),
  ('bio-alpha-12',      'Bio-Alpha 12®',     NULL, '[null, null, null, null]'),
  ('bio-dk',            'Bio-DK',            NULL, '[null, null, null, null]'),
  ('bio-gamma-5',       'Bio-Gamma 5',       NULL, '[null, null, null, null]'),
  ('charbon-bio-magic', 'Charbon Bio Magic', NULL, '[null, null, null, null]'),
  ('bio-hepa-3',        'Bio-Hepa 3',        NULL, '[null, null, null, null]'),
  ('bioforce',          'Bioforce',          NULL, '[null, null, null, null]'),
  ('biovitalis',        'Biovitalis',        NULL, '[null, null, null, null]')
ON CONFLICT (slug) DO NOTHING;

-- ---------- Table des réglages de contact (une seule ligne, id = 1) ----------
CREATE TABLE IF NOT EXISTS contact_settings (
  id          SMALLINT PRIMARY KEY DEFAULT 1,
  phone1      TEXT NOT NULL,
  phone2      TEXT NOT NULL,               -- numéro WhatsApp principal
  email       TEXT NOT NULL,
  address     TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO contact_settings (id, phone1, phone2, email, address) VALUES (
  1,
  '+229 01 95 19 34 91',
  '+229 01 41 67 04 42',
  'afrikapharma1@gmail.com',
  'Abomey-Calavi, BÉNIN — 03 BP 3949 Jéricho'
)
ON CONFLICT (id) DO NOTHING;

-- ---------- Table des comptes admin ----------
CREATE TABLE IF NOT EXISTS admin_users (
  id             SERIAL PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,            -- hash bcrypt, jamais le mot de passe en clair
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Aucun INSERT ici : le premier compte admin est créé via le script
-- scripts/create-admin.js (voir README, section "Créer le premier compte
-- admin"), qui hash le mot de passe côté serveur avant insertion.

-- ---------- Table des tentatives de connexion (anti brute-force) ----------
CREATE TABLE IF NOT EXISTS login_attempts (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL,
  ip_address    TEXT,
  success       BOOLEAN NOT NULL,
  attempted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time
  ON login_attempts (email, attempted_at DESC);

-- Nettoyage optionnel : les lignes de plus de 24h peuvent être purgées
-- périodiquement (cron externe ou tâche planifiée), ex :
-- DELETE FROM login_attempts WHERE attempted_at < now() - INTERVAL '24 hours';
