/* ==========================================================================
   AFRICA BIOPHARMA — /functions/admin-upload-image.js
   Route protégée : reçoit une image (base64) depuis le formulaire d'édition
   produit, valide type/taille, l'uploade sur Cloudinary avec conversion
   automatique en WebP, et renvoie l'URL sécurisée à enregistrer en base
   (via /functions/admin-products.js).

   Variables d'environnement requises :
   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
   ========================================================================== */

const cloudinary = require('cloudinary').v2;
const { requireAdmin, unauthorizedResponse } = require('./_lib/auth');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

exports.handler = async (event) => {
  const admin = requireAdmin(event);
  if (!admin) return unauthorizedResponse();

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Requête invalide.' }) };
  }

  const { slug, fileDataUrl, mimeType, sizeBytes } = data;

  if (!slug || !fileDataUrl) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Fichier ou produit manquant.' }) };
  }

  // ---------- Validation type et taille ----------
  if (!ALLOWED_TYPES.includes(mimeType)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'Format non supporté. Utilisez JPG, PNG ou WebP.' })
    };
  }

  if (typeof sizeBytes === 'number' && sizeBytes > MAX_SIZE_BYTES) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'Fichier trop volumineux (5 Mo maximum).' })
    };
  }

  try {
    // fileDataUrl est une chaîne "data:image/png;base64,...." envoyée par
    // le client (FileReader.readAsDataURL) — Cloudinary l'accepte directement.
    const uploadResult = await cloudinary.uploader.upload(fileDataUrl, {
      folder: `africa-biopharma/products/${slug}`,
      resource_type: 'image',
      // Conversion automatique au meilleur format (WebP quand supporté par
      // le navigateur du visiteur) et à la meilleure qualité disponible :
      transformation: [
        { fetch_format: 'auto', quality: 'auto' },
        { width: 1600, crop: 'limit' } // évite de stocker des images inutilement larges
      ]
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, url: uploadResult.secure_url, publicId: uploadResult.public_id })
    };
  } catch (err) {
    console.error('Erreur upload Cloudinary :', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Échec de l'upload de l'image." })
    };
  }
};
