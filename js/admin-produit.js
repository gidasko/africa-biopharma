/* ==========================================================================
   AFRICA BIOPHARMA — admin-produit.js
   Page d'édition d'un produit : prix + galerie de 4 emplacements d'image
   (upload vers Cloudinary via /functions/admin-upload-image, suppression,
   réordonnancement par boutons monter/descendre), avec aperçu en direct
   reproduisant le slider public (réutilise js/product-slider.js).
   ========================================================================== */

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

let slug = null;
let productName = '';
let images = [null, null, null, null];

document.addEventListener('DOMContentLoaded', async () => {
  slug = new URLSearchParams(window.location.search).get('slug');
  const statusEl = document.querySelector('[data-product-status]');
  const editWrap = document.querySelector('[data-product-edit]');

  if (!slug) {
    statusEl.textContent = 'Aucun produit spécifié.';
    statusEl.dataset.state = 'error';
    return;
  }

  try {
    const response = await window.adminFetch(`/.netlify/functions/admin-products?slug=${encodeURIComponent(slug)}`);
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || 'Produit introuvable.');

    productName = result.product.name;
    images = [0, 1, 2, 3].map((i) => (result.product.images || [])[i] || null);

    document.querySelector('[data-product-title]').textContent = productName;
    document.getElementById('product-price').value = result.product.price ?? '';

    renderImageSlots();
    updatePreview(result.product.price ?? null);

    editWrap.hidden = false;
    statusEl.hidden = true;
  } catch (err) {
    if (err.message === 'unauthorized') return;
    statusEl.textContent = "Impossible de charger le produit.";
    statusEl.dataset.state = 'error';
    return;
  }

  document.querySelector('[data-save-price]').addEventListener('click', savePrice);
  document.querySelector('[data-save-images]').addEventListener('click', saveImages);
});

// ---------------------------------------------------------------------------
// Rendu des 4 emplacements d'image
// ---------------------------------------------------------------------------

function renderImageSlots() {
  const wrap = document.querySelector('[data-image-slots]');
  wrap.innerHTML = images.map((url, index) => slotTemplate(url, index)).join('');

  wrap.querySelectorAll('[data-slot-file]').forEach((input) => {
    input.addEventListener('change', (e) => handleFileSelect(e, Number(input.dataset.slotFile)));
  });
  wrap.querySelectorAll('[data-slot-delete]').forEach((btn) => {
    btn.addEventListener('click', () => deleteImage(Number(btn.dataset.slotDelete)));
  });
  wrap.querySelectorAll('[data-slot-up]').forEach((btn) => {
    btn.addEventListener('click', () => moveImage(Number(btn.dataset.slotUp), -1));
  });
  wrap.querySelectorAll('[data-slot-down]').forEach((btn) => {
    btn.addEventListener('click', () => moveImage(Number(btn.dataset.slotDown), 1));
  });
}

function slotTemplate(url, index) {
  const preview = url
    ? `<div class="admin-image-slot__preview"><img src="${url}" alt="Photo ${index + 1}" /></div>`
    : `<div class="admin-image-slot__empty">Emplacement ${index + 1} vide</div>`;

  return `
    <div class="admin-image-slot">
      <span class="admin-image-slot__number">${index + 1}</span>
      ${preview}
      <div class="admin-image-slot__actions">
        <div class="admin-image-slot__reorder">
          <button type="button" class="admin-icon-btn" data-slot-up="${index}" ${index === 0 ? 'disabled' : ''} aria-label="Monter">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M12 5L5 12M12 5L19 12" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button type="button" class="admin-icon-btn" data-slot-down="${index}" ${index === images.length - 1 ? 'disabled' : ''} aria-label="Descendre">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5V19M12 19L5 12M12 19L19 12" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
        <label class="admin-image-slot__upload-label">
          ${url ? 'Remplacer' : 'Uploader'}
          <input type="file" accept="image/jpeg,image/png,image/webp" data-slot-file="${index}" />
        </label>
        ${url ? `<button type="button" class="admin-icon-btn admin-image-slot__delete" data-slot-delete="${index}" aria-label="Supprimer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6L18 18M6 18L18 6" stroke-linecap="round"/></svg>
        </button>` : ''}
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Upload / suppression / réordonnancement
// ---------------------------------------------------------------------------

async function handleFileSelect(event, index) {
  const file = event.target.files[0];
  if (!file) return;

  if (!ALLOWED_TYPES.includes(file.type)) {
    alert('Format non supporté. Utilisez JPG, PNG ou WebP.');
    event.target.value = '';
    return;
  }
  if (file.size > MAX_SIZE_BYTES) {
    alert('Fichier trop volumineux (5 Mo maximum).');
    event.target.value = '';
    return;
  }

  const feedback = document.querySelector('[data-images-feedback]');
  feedback.hidden = false;
  feedback.dataset.state = '';
  feedback.textContent = 'Envoi en cours...';

  try {
    const fileDataUrl = await readFileAsDataUrl(file);

    const response = await window.adminFetch('/.netlify/functions/admin-upload-image', {
      method: 'POST',
      body: JSON.stringify({
        slug,
        fileDataUrl,
        mimeType: file.type,
        sizeBytes: file.size
      })
    });
    const result = await response.json();

    if (!result.ok) throw new Error(result.error || "Échec de l'upload.");

    images[index] = result.url;
    renderImageSlots();
    updatePreview(currentPriceValue());
    feedback.hidden = true;
  } catch (err) {
    if (err.message === 'unauthorized') return;
    feedback.textContent = err.message || "Échec de l'upload de l'image.";
    feedback.dataset.state = 'error';
  }
}

function deleteImage(index) {
  images[index] = null;
  renderImageSlots();
  updatePreview(currentPriceValue());
}

function moveImage(index, direction) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= images.length) return;
  [images[index], images[targetIndex]] = [images[targetIndex], images[index]];
  renderImageSlots();
  updatePreview(currentPriceValue());
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------------------------------------------------------------------------
// Enregistrement (prix / images)
// ---------------------------------------------------------------------------

function currentPriceValue() {
  const raw = document.getElementById('product-price').value;
  return raw === '' ? null : Number(raw);
}

async function savePrice() {
  await persist(document.querySelector('[data-price-feedback]'));
}

async function saveImages() {
  await persist(document.querySelector('[data-images-feedback]'));
}

async function persist(feedbackEl) {
  feedbackEl.hidden = false;
  feedbackEl.dataset.state = '';
  feedbackEl.textContent = 'Enregistrement...';

  try {
    const response = await window.adminFetch('/.netlify/functions/admin-products', {
      method: 'POST',
      body: JSON.stringify({
        slug,
        price: currentPriceValue(),
        images
      })
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "Échec de l'enregistrement.");

    feedbackEl.textContent = 'Enregistré ✓';
    feedbackEl.dataset.state = 'success';
    updatePreview(currentPriceValue());
    window.setTimeout(() => { feedbackEl.hidden = true; }, 2500);
  } catch (err) {
    if (err.message === 'unauthorized') return;
    feedbackEl.textContent = err.message || "Échec de l'enregistrement.";
    feedbackEl.dataset.state = 'error';
  }
}

// ---------------------------------------------------------------------------
// Aperçu en direct (réutilise le moteur de slider public)
// ---------------------------------------------------------------------------

function updatePreview(price) {
  window.PRODUCTS_DATA = window.PRODUCTS_DATA || {};
  window.PRODUCTS_DATA['__admin_preview__'] = { price, images: images.filter(Boolean) };

  const previewRoot = document.querySelector('[data-preview-slider]');
  previewRoot.dataset.productImages = '__admin_preview__';
  previewRoot.dataset.productName = productName;
  if (typeof window.buildSlider === 'function') {
    window.buildSlider(previewRoot);
  }

  document.querySelector('[data-preview-name]').textContent = productName;
  const priceBadge = document.querySelector('[data-preview-price]');
  priceBadge.textContent = typeof window.formatProductPrice === 'function'
    ? window.formatProductPrice(price)
    : (price === null ? 'Prix sur demande' : `${price} FCFA`);
}
