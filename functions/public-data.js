/* ==========================================================================
   AFRICA BIOPHARMA — /functions/public-data.js
   Endpoint public (GET, sans authentification) : renvoie les prix/images
   des 8 produits et les coordonnées de contact actuelles, telles que
   modifiées depuis le panneau d'administration. Consommé par
   js/products-data.js et js/site-contact.js au chargement du site.
   ========================================================================== */

const { query } = require('./_lib/db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const [productsResult, contactResult] = await Promise.all([
      query('SELECT slug, name, price, images FROM products ORDER BY id ASC'),
      query('SELECT phone1, phone2, email, address FROM contact_settings WHERE id = 1')
    ]);

    const products = {};
    productsResult.rows.forEach((row) => {
      products[row.slug] = {
        price: row.price === null ? null : Number(row.price),
        images: (row.images || []).filter(Boolean) // retire les emplacements vides
      };
    });

    const contactRow = contactResult.rows[0] || {};
    const contact = {
      phone1: contactRow.phone1 || null,
      whatsappNumber: contactRow.phone2 ? contactRow.phone2.replace(/[^\d]/g, '') : null,
      phone2: contactRow.phone2 || null,
      email: contactRow.email || null,
      addressLine: contactRow.address || null
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache court côté CDN : les changements faits en admin doivent
        // rester visibles rapidement (quelques dizaines de secondes).
        'Cache-Control': 'public, max-age=30'
      },
      body: JSON.stringify({ ok: true, products, contact })
    };
  } catch (err) {
    console.error('Erreur public-data :', err);
    // En cas d'erreur base de données, le frontend garde ses valeurs par
    // défaut codées en dur (voir js/products-data.js / js/site-contact.js) :
    // le site reste fonctionnel même si la base est temporairement indisponible.
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: 'Erreur lors de la lecture des données.' })
    };
  }
};
