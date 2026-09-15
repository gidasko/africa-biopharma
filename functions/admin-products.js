/* ==========================================================================
   AFRICA BIOPHARMA — /functions/admin-products.js
   Routes protégées (cookie de session requis) :
   - GET  ?slug=xxx      -> détail d'un produit
   - GET  (sans slug)    -> liste des 8 produits (pour le tableau de bord)
   - POST                -> met à jour prix / images / ordre d'un produit
   ========================================================================== */

const { query } = require('./_lib/db');
const { requireAdmin, unauthorizedResponse } = require('./_lib/auth');

exports.handler = async (event) => {
  const admin = requireAdmin(event);
  if (!admin) return unauthorizedResponse();

  if (event.httpMethod === 'GET') {
    const slug = event.queryStringParameters?.slug;

    if (slug) {
      const result = await query(
        'SELECT slug, name, price, images, updated_at FROM products WHERE slug = $1',
        [slug]
      );
      if (!result.rows.length) {
        return { statusCode: 404, body: JSON.stringify({ ok: false, error: 'Produit introuvable.' }) };
      }
      return { statusCode: 200, body: JSON.stringify({ ok: true, product: result.rows[0] }) };
    }

    const result = await query('SELECT slug, name, price, images FROM products ORDER BY id ASC');
    return { statusCode: 200, body: JSON.stringify({ ok: true, products: result.rows }) };
  }

  if (event.httpMethod === 'POST') {
    let data;
    try {
      data = JSON.parse(event.body || '{}');
    } catch (err) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Requête invalide.' }) };
    }

    const { slug, price, images } = data;

    if (!slug) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'slug requis.' }) };
    }

    // price : nombre positif ou null ("Prix sur demande")
    let normalizedPrice = null;
    if (price !== null && price !== undefined && price !== '') {
      const parsed = Number(price);
      if (Number.isNaN(parsed) || parsed < 0) {
        return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Prix invalide.' }) };
      }
      normalizedPrice = parsed;
    }

    // images : tableau de 4 emplacements (string ou null), ordre conservé
    let normalizedImages = [null, null, null, null];
    if (Array.isArray(images)) {
      normalizedImages = [0, 1, 2, 3].map((i) => images[i] || null);
    }

    const result = await query(
      `UPDATE products
       SET price = $1, images = $2::jsonb, updated_at = now()
       WHERE slug = $3
       RETURNING slug, name, price, images`,
      [normalizedPrice, JSON.stringify(normalizedImages), slug]
    );

    if (!result.rows.length) {
      return { statusCode: 404, body: JSON.stringify({ ok: false, error: 'Produit introuvable.' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, product: result.rows[0] }) };
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};
