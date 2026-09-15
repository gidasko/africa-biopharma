/* ==========================================================================
   AFRICA BIOPHARMA — admin-dashboard.js
   Charge et affiche la liste des 8 produits (miniature, nom, prix), avec
   lien vers la page d'édition de chacun.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.querySelector('[data-dashboard-status]');
  const grid = document.querySelector('[data-product-grid]');

  try {
    const response = await window.adminFetch('/.netlify/functions/admin-products');
    const result = await response.json();

    if (!result.ok) throw new Error(result.error || 'Erreur inconnue.');

    grid.innerHTML = result.products.map(renderProductCard).join('');
    grid.hidden = false;
    statusEl.hidden = true;
  } catch (err) {
    if (err.message === 'unauthorized') return; // déjà redirigé par adminFetch
    statusEl.textContent = "Impossible de charger les produits. Vérifiez la connexion à la base de données.";
    statusEl.dataset.state = 'error';
  }
});

function renderProductCard(product) {
  const firstImage = (product.images || []).find(Boolean);
  const priceLabel = product.price === null || product.price === undefined
    ? 'Prix sur demande'
    : `${Number(product.price).toLocaleString('fr-FR')} FCFA`;

  const thumb = firstImage
    ? `<div class="admin-product-card__thumb"><img src="${firstImage}" alt="${product.name}" loading="lazy" /></div>`
    : `<div class="admin-product-card__thumb admin-product-card__thumb--empty">Aucune photo</div>`;

  return `
    <a class="admin-product-card" href="/admin/produit.html?slug=${encodeURIComponent(product.slug)}">
      ${thumb}
      <div class="admin-product-card__body">
        <h3>${product.name}</h3>
        <p class="admin-product-card__price">${priceLabel}</p>
        <span class="btn btn-secondary" style="width:100%;">Modifier</span>
      </div>
    </a>
  `;
}
