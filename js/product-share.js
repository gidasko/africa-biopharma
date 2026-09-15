/* ==========================================================================
   AFRICA BIOPHARMA — product-share.js
   Boutons de partage social par fiche produit (Facebook, WhatsApp, X,
   LinkedIn, copier le lien).
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-share]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const network = btn.dataset.share;
      const productTitle = btn.closest('[data-product-name]')?.dataset.productName || document.title;
      const url = window.location.href.split('#')[0] + '#' + (btn.closest('.product-card')?.id || '');
      const text = encodeURIComponent(`${productTitle} — AFRICA BIOPHARMA`);
      const encodedUrl = encodeURIComponent(url);

      const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        whatsapp: `https://wa.me/?text=${text}%20${encodedUrl}`,
        twitter: `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
      };

      if (network === 'copy') {
        navigator.clipboard?.writeText(url).then(() => {
          const original = btn.getAttribute('aria-label');
          btn.setAttribute('aria-label', 'Lien copié !');
          btn.classList.add('is-copied');
          window.setTimeout(() => {
            btn.setAttribute('aria-label', original);
            btn.classList.remove('is-copied');
          }, 1800);
        });
        return;
      }

      const target = shareUrls[network];
      if (target) {
        window.open(target, '_blank', 'noopener,noreferrer,width=600,height=520');
      }
    });
  });
});
